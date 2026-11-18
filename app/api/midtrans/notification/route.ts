import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  pembayaranEvent,
  pembayaranLangganan,
} from "@/lib/db/schema";
import { getMidtransSnap } from "@/lib/midtrans";
import { selesaikanPembayaranEvent } from "@/lib/pembayaran-event";

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Payload tidak valid." },
        { status: 400 },
      );
    }
    payload = body;
  } catch (error) {
    console.error("Payload notifikasi Midtrans bukan JSON valid:", error);
    return NextResponse.json(
      { error: "Payload tidak valid." },
      { status: 400 },
    );
  }

  try {
    const notification =
      await getMidtransSnap().transaction.notification(payload);

    const [eventPayment] = await getDb()
      .select({
        id: pembayaranEvent.idPembayaranEvent,
        eventId: pembayaranEvent.eventId,
        userId: pembayaranEvent.userId,
        amount: pembayaranEvent.jumlah,
        status: pembayaranEvent.statusPembayaran,
      })
      .from(pembayaranEvent)
      .where(eq(pembayaranEvent.orderId, notification.order_id))
      .limit(1);

    if (eventPayment) {
      const grossAmount = Number(notification.gross_amount);
      if (
        !Number.isFinite(grossAmount) ||
        grossAmount !== Number(eventPayment.amount)
      ) {
        return NextResponse.json(
          { error: "Nominal transaksi tidak cocok." },
          { status: 400 },
        );
      }

      const sukses =
        notification.transaction_status === "settlement" ||
        (notification.transaction_status === "capture" &&
          notification.fraud_status === "accept");

      if (
        sukses &&
        (eventPayment.status === "pending" ||
          eventPayment.status === "memproses")
      ) {
        await selesaikanPembayaranEvent(
          eventPayment.id,
          notification.transaction_id ?? null,
        );
      } else if (
        (eventPayment.status === "pending" ||
          eventPayment.status === "memproses") &&
        (notification.transaction_status === "expire" ||
          notification.transaction_status === "cancel")
      ) {
        await getDb()
          .update(pembayaranEvent)
          .set({
            statusPembayaran:
              notification.transaction_status === "expire"
                ? "kedaluwarsa"
                : "dibatalkan",
            midtransTransactionId: notification.transaction_id ?? null,
          })
          .where(
            and(
              eq(pembayaranEvent.idPembayaranEvent, eventPayment.id),
              inArray(pembayaranEvent.statusPembayaran, [
                "pending",
                "memproses",
              ]),
            ),
          );
      } else if (
        notification.transaction_status === "pending" &&
        (eventPayment.status === "pending" ||
          eventPayment.status === "memproses")
      ) {
        await getDb()
          .update(pembayaranEvent)
          .set({ midtransTransactionId: notification.transaction_id ?? null })
          .where(eq(pembayaranEvent.idPembayaranEvent, eventPayment.id));
      }

      return NextResponse.json({ received: true });
    }

    const [payment] = await getDb()
      .select({
        idPembayaran: pembayaranLangganan.idPembayaranLangganan,
        jumlah: pembayaranLangganan.jumlah,
        status: pembayaranLangganan.statusPembayaran,
        langgananId: pembayaranLangganan.langgananId,
      })
      .from(pembayaranLangganan)
      .where(eq(pembayaranLangganan.orderId, notification.order_id))
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan." },
        { status: 404 },
      );
    }

    const grossAmount = Number(notification.gross_amount);
    if (
      !Number.isFinite(grossAmount) ||
      grossAmount !== Number(payment.jumlah)
    ) {
      return NextResponse.json(
        { error: "Nominal transaksi tidak cocok." },
        { status: 400 },
      );
    }

    const sukses =
      notification.transaction_status === "settlement" ||
      (notification.transaction_status === "capture" &&
        notification.fraud_status === "accept");

    if (sukses) {
      if (payment.status === "pending") {
        const hariIniJakarta = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
        }).format(new Date());
        await getDb().execute(sql`
          WITH pembayaran_berhasil AS (
            UPDATE pembayaran_langganan
            SET status_pembayaran = 'berhasil',
                midtrans_transaction_id = ${notification.transaction_id ?? null},
                tanggal_dibayar = now()
            WHERE id_pembayaran_langganan = ${payment.idPembayaran}
              AND status_pembayaran = 'pending'
              AND jumlah = ${String(grossAmount)}::numeric
            RETURNING langganan_id
          )
          UPDATE data_langganan AS langganan
          SET status_langganan = 'aktif',
              tanggal_mulai_langganan = CASE
                WHEN langganan.tanggal_akhir_langganan >= ${hariIniJakarta}::date
                  THEN COALESCE(langganan.tanggal_mulai_langganan, ${hariIniJakarta}::date)
                ELSE ${hariIniJakarta}::date
              END,
              tanggal_akhir_langganan = CASE
              WHEN langganan.tanggal_akhir_langganan >= ${hariIniJakarta}::date
                THEN langganan.tanggal_akhir_langganan + 30
              ELSE (${hariIniJakarta}::date - 1) + 30
              END
          FROM pembayaran_berhasil
          WHERE langganan.id_langganan = pembayaran_berhasil.langganan_id
        `);
      }
    } else if (
      notification.transaction_status === "expire" ||
      notification.transaction_status === "cancel"
    ) {
      await getDb()
        .update(pembayaranLangganan)
        .set({
          statusPembayaran:
            notification.transaction_status === "expire"
              ? "kedaluwarsa"
              : "dibatalkan",
          midtransTransactionId: notification.transaction_id ?? null,
        })
        .where(
          and(
            eq(pembayaranLangganan.idPembayaranLangganan, payment.idPembayaran),
            eq(pembayaranLangganan.statusPembayaran, "pending"),
          ),
        );
    } else if (notification.transaction_status === "pending") {
      await getDb()
        .update(pembayaranLangganan)
        .set({ midtransTransactionId: notification.transaction_id ?? null })
        .where(
          and(
            eq(pembayaranLangganan.idPembayaranLangganan, payment.idPembayaran),
            eq(pembayaranLangganan.statusPembayaran, "pending"),
          ),
        );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Gagal memproses notifikasi pembayaran Midtrans:", error);
    return NextResponse.json(
      { error: "Notifikasi belum dapat diproses." },
      { status: 500 },
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
