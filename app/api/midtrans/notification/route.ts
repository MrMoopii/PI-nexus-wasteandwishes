import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  skemaNotifikasiMidtrans,
  skemaPayloadNotifikasi,
} from "@/features/langganan/validasi/pembayaran";
import { getDb } from "@/lib/db";
import {
  pembayaranEvent,
  pembayaranLangganan,
} from "@/lib/db/schema";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { getMidtransSnap } from "@/lib/midtrans";
import { selesaikanPembayaranEvent } from "@/lib/pembayaran-event";

/**
 * Notifikasi pembayaran dari Midtrans untuk pembayaran event dan langganan.
 * Dipanggil Midtrans, bukan pengguna. Status transaksi selalu dibaca ulang dari
 * Midtrans, bukan dari body. Kontrak lengkapnya di docs/api/midtrans.md.
 */
export async function POST(request: Request) {
  // 1. Body harus JSON berisi transaction_id (CONTRIBUTING 9.8).
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Payload notifikasi Midtrans bukan JSON valid:", error);
    return NextResponse.json(
      { error: "Payload tidak valid." },
      { status: 400 },
    );
  }

  const hasilPayload = skemaPayloadNotifikasi.safeParse(body);
  if (!hasilPayload.success) {
    return NextResponse.json(
      { error: "Payload tidak valid." },
      { status: 400 },
    );
  }

  try {
    // 2. Verifikasi ke Midtrans: transaction.notification() membaca status transaksi
    //    langsung dari Midtrans, jadi notifikasi palsu tidak bisa mengaktifkan apa pun.
    const hasilVerifikasi = skemaNotifikasiMidtrans.safeParse(
      await getMidtransSnap().transaction.notification(hasilPayload.data),
    );

    // 3. Bentuk data dari Midtrans dicek sebelum dipakai. Gagal di sini berarti masalah
    //    integrasi, bukan kesalahan pengirim, jadi 500 supaya Midtrans mengirim ulang.
    if (!hasilVerifikasi.success) {
      console.error(
        "Data transaksi Midtrans tidak sesuai skema:",
        hasilVerifikasi.error.issues,
      );
      return NextResponse.json(
        { error: "Notifikasi belum dapat diproses." },
        { status: 500 },
      );
    }
    const notification = hasilVerifikasi.data;

    // 4. Pembayaran event: order_id dicari di pembayaran_event lebih dulu.
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

    // 5. Pembayaran langganan: order_id dan nominal harus cocok dengan yang dicatat
    //    Server Action mulaiPembayaranLangganan().
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

    // 6. Ubah status menurut hasil transaksi. Status lain (deny, refund, …) diabaikan.
    if (sukses) {
      if (payment.status === "pending") {
        const hariIniJakarta = tanggalHariIniJakarta();
        // Satu perintah (neon-http tanpa transaksi, CONTRIBUTING 6.2): tandai pembayaran
        // berhasil, lalu mulai atau perpanjang langganan 30 hari (9.7). Langganan yang
        // dihentikan tidak ditimpa menjadi aktif, tetapi pembayarannya tetap dicatat
        // berhasil karena uangnya sudah masuk.
        const hasilBayar = await getDb().execute<{
          jumlah_pembayaran: number;
          jumlah_langganan: number;
        }>(sql`
          WITH pembayaran_berhasil AS (
            UPDATE pembayaran_langganan
            SET status_pembayaran = 'berhasil',
                midtrans_transaction_id = ${notification.transaction_id ?? null},
                tanggal_dibayar = now()
            WHERE id_pembayaran_langganan = ${payment.idPembayaran}
              AND status_pembayaran = 'pending'
              AND jumlah = ${String(grossAmount)}::numeric
            RETURNING langganan_id
          ),
          langganan_diperbarui AS (
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
              AND langganan.status_langganan <> 'dihentikan'
            RETURNING langganan.id_langganan
          )
          SELECT
            (SELECT count(*) FROM pembayaran_berhasil)::int AS jumlah_pembayaran,
            (SELECT count(*) FROM langganan_diperbarui)::int AS jumlah_langganan
        `);

        // Pembayaran tercatat tetapi langganan tidak berubah hanya terjadi jika
        // langganannya dihentikan. Catat untuk ditindaklanjuti admin (misalnya refund).
        const [ringkasan] = hasilBayar.rows;
        if (
          ringkasan &&
          ringkasan.jumlah_pembayaran > 0 &&
          ringkasan.jumlah_langganan === 0
        ) {
          console.error(
            `Pembayaran ${notification.order_id} berhasil, tetapi langganan dihentikan sehingga tidak diaktifkan.`,
          );
        }
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
