"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireLogin } from "@/lib/require-login";
import { getDb } from "@/lib/db";
import {
  events,
  pembayaranEvent,
  pendaftaranEvent,
  users,
} from "@/lib/db/schema";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getMidtransSnap } from "@/lib/midtrans";
import { selesaikanPembayaranEvent } from "@/lib/pembayaran-event";

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  return null;
}

async function ensureEventRecord(eventId: number) {
  const normalizedEventId = parsePositiveInteger(eventId);

  if (normalizedEventId === null) {
    return null;
  }

  const [existingEvent] = await getDb()
    .select()
    .from(events)
    .where(
      and(
        eq(events.idEvent, normalizedEventId),
        eq(events.statusEvent, "aktif"),
      ),
    )
    .limit(1);

  return existingEvent ?? null;
}

function readNestedErrorValue(error: unknown, key: string): string {
  const seen = new Set<unknown>();

  const walk = (value: unknown): string => {
    if (!value || typeof value !== "object") {
      return "";
    }

    if (seen.has(value)) {
      return "";
    }
    seen.add(value);

    const record = value as Record<string, unknown>;
    if (key in record && typeof record[key] === "string") {
      return record[key] as string;
    }

    if (typeof record.cause !== "undefined") {
      const nested = walk(record.cause);
      if (nested) return nested;
    }

    if (typeof record.original !== "undefined") {
      const nested = walk(record.original);
      if (nested) return nested;
    }

    return "";
  };

  return walk(error);
}

export async function registerForEvent(input: { eventId: number | string }) {
  const cek = await requireLogin();

  if (!cek.ok) {
    return {
      ok: false,
      error: cek.pesan,
    };
  }

  const eventId = Number(input.eventId);
  const userId = cek.idUser;

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return {
      ok: false,
      error: "ID event tidak valid.",
    };
  }

  try {
    const resolvedEvent = await ensureEventRecord(eventId);

    if (!resolvedEvent) {
      return {
        ok: false,
        error: "Event tidak ditemukan.",
      };
    }

    const tanggalHariIni = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (resolvedEvent.tanggalPelaksanaan < tanggalHariIni) {
      return {
        ok: false,
        error: "Pendaftaran event telah ditutup.",
      };
    }

    if (Number(resolvedEvent.biayaEvent) > 0) {
      return {
        ok: false,
        error: "Event ini berbayar. Silakan lanjutkan pembayaran.",
      };
    }

    const [existingRegistration] = await getDb()
      .select()
      .from(pendaftaranEvent)
      .where(
        and(
          eq(pendaftaranEvent.eventId, eventId),
          eq(pendaftaranEvent.userId, userId),
        ),
      )
      .limit(1);

    if (existingRegistration) {
      return {
        ok: true,
        message: "Anda sudah terdaftar pada event ini.",
        idPendaftaran: existingRegistration.idPendaftaran,
        eventId: resolvedEvent.idEvent,
        eventName: resolvedEvent.namaEvent,
      };
    }

    // Kurangi kuota hanya jika masih tersisa. Satu UPDATE bersyarat supaya dua
    // pendaftaran bersamaan tidak bisa sama-sama lolos saat kuota tinggal 1.
    const [kuotaTerkurangi] = await getDb()
      .update(events)
      .set({ kuotaPeserta: sql`${events.kuotaPeserta} - 1` })
      .where(and(eq(events.idEvent, eventId), gt(events.kuotaPeserta, 0)))
      .returning({ kuotaPeserta: events.kuotaPeserta });

    if (!kuotaTerkurangi) {
      return {
        ok: false,
        error: "Kuota peserta event ini sudah habis.",
      };
    }

    let result: { idPendaftaran: number };

    try {
      [result] = await getDb()
        .insert(pendaftaranEvent)
        .values({
          eventId,
          userId,
        })
        .returning({
          idPendaftaran: pendaftaranEvent.idPendaftaran,
        });
    } catch (insertError: unknown) {
      // Insert gagal: kembalikan kuota yang sudah dikurangi supaya tidak
      // berkurang tanpa ada peserta yang tercatat.
      await getDb()
        .update(events)
        .set({ kuotaPeserta: sql`${events.kuotaPeserta} + 1` })
        .where(eq(events.idEvent, eventId));

      throw insertError;
    }

    return {
      ok: true,
      message: "Pendaftaran berhasil disimpan.",
      idPendaftaran: result.idPendaftaran,
      eventId: resolvedEvent.idEvent,
      eventName: resolvedEvent.namaEvent,
    };
  } catch (error: unknown) {
    const code = readNestedErrorValue(error, "code");
    const constraint = readNestedErrorValue(error, "constraint");
    const detail = readNestedErrorValue(error, "detail");
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat menyimpan pendaftaran event.";
    const lowerMessage = message.toLowerCase();

    const isDuplicateRegistration =
      code === "23505" ||
      constraint.toLowerCase().includes("pendaftaran_event") ||
      detail.toLowerCase().includes("pendaftaran_event") ||
      lowerMessage.includes("duplicate key") ||
      lowerMessage.includes("pendaftaran_event");

    if (isDuplicateRegistration) {
      const [existingRegistration] = await getDb()
        .select()
        .from(pendaftaranEvent)
        .where(
          and(
            eq(pendaftaranEvent.eventId, eventId),
            eq(pendaftaranEvent.userId, userId),
          ),
        )
        .limit(1);

      if (existingRegistration) {
        return {
          ok: true,
          message: "Anda sudah terdaftar pada event ini.",
          idPendaftaran: existingRegistration.idPendaftaran,
          eventId,
        };
      }

      return {
        ok: false,
        error: "Anda sudah terdaftar pada event ini.",
      };
    }

    console.error("Register event error:", {
      code,
      constraint,
      detail,
      message,
      error,
    });

    return {
      ok: false,
      error: "Terjadi kesalahan saat memproses pendaftaran. Silakan coba lagi.",
    };
  }
}

export async function mulaiPembayaranEvent(formData: FormData) {
  const cek = await requireLogin();
  if (!cek.ok) {
    redirect("/auth/login");
  }

  const eventId = parsePositiveInteger(formData.get("id_event"));
  if (eventId === null) {
    redirect(`/event?error=${encodeURIComponent("ID event tidak valid.")}`);
  }

  const db = getDb();
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.idEvent, eventId), eq(events.statusEvent, "aktif")))
    .limit(1);
  if (!event) redirect("/event");
  if (!(Number(event.biayaEvent) > 0)) {
    redirect(
      `/event/checkout/${eventId}?error=${encodeURIComponent("Event ini tidak berbayar.")}`,
    );
  }

  const [existing] = await db
    .select({ idPendaftaran: pendaftaranEvent.idPendaftaran })
    .from(pendaftaranEvent)
    .where(
      and(
        eq(pendaftaranEvent.eventId, eventId),
        eq(pendaftaranEvent.userId, cek.idUser),
      ),
    )
    .limit(1);
  if (existing) redirect(`/event/bukti/${existing.idPendaftaran}`);

  const [pembayaranTanpaKuota] = await db
    .select({ id: pembayaranEvent.idPembayaranEvent })
    .from(pembayaranEvent)
    .where(
      and(
        eq(pembayaranEvent.eventId, eventId),
        eq(pembayaranEvent.userId, cek.idUser),
        eq(pembayaranEvent.statusPembayaran, "berhasil_tanpa_kuota"),
      ),
    )
    .limit(1);
  if (pembayaranTanpaKuota) {
    redirect(
      `/event/checkout/${eventId}?error=${encodeURIComponent("Pembayaran Anda sudah diterima, tetapi kuota event tidak tersedia. Silakan hubungi admin.")}`,
    );
  }

  const [checkoutBerjalan] = await db
    .select({
      id: pembayaranEvent.idPembayaranEvent,
      orderId: pembayaranEvent.orderId,
      jumlah: pembayaranEvent.jumlah,
      redirectUrl: pembayaranEvent.redirectUrl,
    })
    .from(pembayaranEvent)
    .where(
      and(
        eq(pembayaranEvent.eventId, eventId),
        eq(pembayaranEvent.userId, cek.idUser),
        inArray(pembayaranEvent.statusPembayaran, ["pending", "memproses"]),
      ),
    )
    .orderBy(desc(pembayaranEvent.idPembayaranEvent))
    .limit(1);

  if (checkoutBerjalan) {
    let checkoutKedaluwarsa = false;
    let transaksi: Awaited<
      ReturnType<ReturnType<typeof getMidtransSnap>["transaction"]["status"]>
    > | null = null;
    try {
      transaksi = await getMidtransSnap().transaction.status(
        checkoutBerjalan.orderId,
      );
    } catch (error) {
      console.error(
        "Gagal memeriksa transaksi event yang sedang berjalan:",
        error,
      );
    }

    if (transaksi) {
      const sukses =
        transaksi.transaction_status === "settlement" ||
        (transaksi.transaction_status === "capture" &&
          transaksi.fraud_status === "accept");
      const grossAmount = Number(transaksi.gross_amount);

      if (sukses) {
        if (
          Number.isFinite(grossAmount) &&
          grossAmount === Number(checkoutBerjalan.jumlah)
        ) {
          await selesaikanPembayaranEvent(
            checkoutBerjalan.id,
            transaksi.transaction_id ?? null,
          );
        } else {
          console.error(
            "Nominal transaksi event Midtrans tidak cocok:",
            checkoutBerjalan.orderId,
          );
        }

        const [sudahDaftar] = await db
          .select({ idPendaftaran: pendaftaranEvent.idPendaftaran })
          .from(pendaftaranEvent)
          .where(
            and(
              eq(pendaftaranEvent.eventId, eventId),
              eq(pendaftaranEvent.userId, cek.idUser),
            ),
          )
          .limit(1);
        if (sudahDaftar) {
          redirect(`/event/bukti/${sudahDaftar.idPendaftaran}`);
        }
        redirect(
          `/event/checkout/${eventId}?error=${encodeURIComponent("Pembayaran sudah diterima, tetapi kuota event tidak tersedia. Silakan hubungi admin.")}`,
        );
      }

      if (
        transaksi.transaction_status === "expire" ||
        transaksi.transaction_status === "cancel"
      ) {
        await db
          .update(pembayaranEvent)
          .set({
            statusPembayaran:
              transaksi.transaction_status === "expire"
                ? "kedaluwarsa"
                : "dibatalkan",
            midtransTransactionId: transaksi.transaction_id ?? null,
          })
          .where(
            and(
              eq(pembayaranEvent.idPembayaranEvent, checkoutBerjalan.id),
              inArray(pembayaranEvent.statusPembayaran, [
                "pending",
                "memproses",
              ]),
            ),
          );
        checkoutKedaluwarsa = true;
      }
    }

    if (!checkoutKedaluwarsa && checkoutBerjalan.redirectUrl) {
      redirect(checkoutBerjalan.redirectUrl);
    }
  }

  const [user] = await db
    .select({
      namaPelanggan: users.namaPelanggan,
      username: users.username,
      email: users.email,
      nomorTelp: users.nomorTelp,
    })
    .from(users)
    .where(eq(users.idUser, cek.idUser))
    .limit(1);
  if (!user) {
    redirect(
      `/event/checkout/${eventId}?error=${encodeURIComponent("Akun tidak ditemukan.")}`,
    );
  }

  const appBaseUrl = process.env.APP_BASE_URL?.trim().replace(/\/$/, "");
  if (!appBaseUrl || !URL.canParse(appBaseUrl)) {
    redirect(
      `/event/checkout/${eventId}?error=${encodeURIComponent("Alamat aplikasi belum dikonfigurasi.")}`,
    );
  }

  const orderId = `event-${eventId}-${cek.idUser}-${randomUUID()}`;
  const jumlah = Number(event.biayaEvent);
  if (!Number.isSafeInteger(jumlah) || jumlah <= 0) {
    redirect(
      `/event/checkout/${eventId}?error=${encodeURIComponent("Biaya event tidak valid.")}`,
    );
  }
  const tanggalKedaluwarsa = new Date(Date.now() + 15 * 60 * 1000);
  try {
    await db.insert(pembayaranEvent).values({
      eventId,
      userId: cek.idUser,
      orderId,
      jumlah: String(jumlah),
      statusPembayaran: "pending",
      tanggalKedaluwarsa,
    });

    const transaction = await getMidtransSnap().createTransaction({
      transaction_details: { order_id: orderId, gross_amount: jumlah },
      customer_details: {
        first_name: user.namaPelanggan || user.username || "Peserta",
        email: user.email,
        ...(user.nomorTelp ? { phone: user.nomorTelp } : {}),
      },
      item_details: [
        {
          id: `event-${event.idEvent}`,
          price: jumlah,
          quantity: 1,
          name: event.namaEvent,
        },
      ],
      callbacks: {
        finish: `${appBaseUrl}/event/checkout/${eventId}`,
        unfinish: `${appBaseUrl}/event/checkout/${eventId}`,
        error: `${appBaseUrl}/event/checkout/${eventId}`,
      },
      expiry: { unit: "minute", duration: 15 },
    });
    if (!transaction.redirect_url) {
      throw new Error("Midtrans tidak mengembalikan URL pembayaran.");
    }
    await db
      .update(pembayaranEvent)
      .set({ redirectUrl: transaction.redirect_url })
      .where(eq(pembayaranEvent.orderId, orderId));
    redirect(transaction.redirect_url);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("Gagal membuat transaksi event Midtrans:", error);
    await db
      .update(pembayaranEvent)
      .set({ statusPembayaran: "gagal" })
      .where(eq(pembayaranEvent.orderId, orderId))
      .catch((updateError: unknown) => {
        console.error("Gagal memperbarui status checkout event:", updateError);
      });
    redirect(
      `/event/checkout/${eventId}?error=${encodeURIComponent("Checkout belum dapat dibuat.")}`,
    );
  }
}

export async function cekStatusPembayaranEvent(
  input: { eventId: number; orderId: string },
): Promise<
  | { status: "menunggu" }
  | { status: "berhasil"; idPendaftaran: number }
  | { status: "berhasil_tanpa_kuota" }
  | { status: "gagal" }
> {
  const cek = await requireLogin();
  if (!cek.ok) return { status: "gagal" };

  if (
    !Number.isInteger(input.eventId) ||
    input.eventId <= 0 ||
    !input.orderId.startsWith(`event-${input.eventId}-${cek.idUser}-`)
  ) {
    return { status: "gagal" };
  }

  const db = getDb();
  const [payment] = await db
    .select({
      id: pembayaranEvent.idPembayaranEvent,
      status: pembayaranEvent.statusPembayaran,
      jumlah: pembayaranEvent.jumlah,
    })
    .from(pembayaranEvent)
    .where(
      and(
        eq(pembayaranEvent.orderId, input.orderId),
        eq(pembayaranEvent.eventId, input.eventId),
        eq(pembayaranEvent.userId, cek.idUser),
      ),
    )
    .limit(1);

  if (!payment) return { status: "gagal" };

  let status = payment.status;

  if (status === "pending" || status === "memproses") {
    try {
      const transaksi = await getMidtransSnap().transaction.status(
        input.orderId,
      );
      const grossAmount = Number(transaksi.gross_amount);
      const sukses =
        transaksi.transaction_status === "settlement" ||
        (transaksi.transaction_status === "capture" &&
          transaksi.fraud_status === "accept");

      if (sukses) {
        if (
          Number.isFinite(grossAmount) &&
          grossAmount === Number(payment.jumlah)
        ) {
          await selesaikanPembayaranEvent(
            payment.id,
            transaksi.transaction_id ?? null,
          );
          status = "berhasil";
        } else {
          console.error(
            "Nominal transaksi event Midtrans tidak cocok:",
            input.orderId,
          );
        }
      } else if (
        transaksi.transaction_status === "expire" ||
        transaksi.transaction_status === "cancel"
      ) {
        const statusBaru =
          transaksi.transaction_status === "expire"
            ? "kedaluwarsa"
            : "dibatalkan";
        await db
          .update(pembayaranEvent)
          .set({
            statusPembayaran: statusBaru,
            midtransTransactionId: transaksi.transaction_id ?? null,
          })
          .where(
            and(
              eq(pembayaranEvent.idPembayaranEvent, payment.id),
              inArray(pembayaranEvent.statusPembayaran, [
                "pending",
                "memproses",
              ]),
            ),
          );
        return { status: "gagal" };
      }
    } catch (error) {
      console.error(
        "Gagal memeriksa status transaksi event ke Midtrans:",
        error,
      );
    }
  }

  if (status === "berhasil_tanpa_kuota") {
    return { status: "berhasil_tanpa_kuota" };
  }
  if (
    status === "gagal" ||
    status === "kedaluwarsa" ||
    status === "dibatalkan"
  ) {
    return { status: "gagal" };
  }
  if (status !== "berhasil") return { status: "menunggu" };

  const [registration] = await getDb()
    .select({ idPendaftaran: pendaftaranEvent.idPendaftaran })
    .from(pendaftaranEvent)
    .where(
      and(
        eq(pendaftaranEvent.eventId, input.eventId),
        eq(pendaftaranEvent.userId, cek.idUser),
      ),
    )
    .limit(1);

  return registration
    ? { status: "berhasil", idPendaftaran: registration.idPendaftaran }
    : { status: "menunggu" };
}

export async function confirmEventRegistration(formData: FormData) {
  const cek = await requireLogin();
  if (!cek.ok) {
    redirect("/auth/login");
  }

  const rawEventId = formData.get("id_event");
  const numericEventId = parsePositiveInteger(rawEventId);

  if (numericEventId === null) {
    redirect(`/event?error=${encodeURIComponent("ID event tidak valid.")}`);
  }

  const result = await registerForEvent({
    eventId: numericEventId,
  });

  if (result?.ok && result.idPendaftaran) {
    redirect(`/event/bukti/${result.idPendaftaran}`);
  }

  redirect(
    `/event/checkout/${numericEventId}?error=${encodeURIComponent(result?.error ?? "Pendaftaran gagal. Silakan coba lagi.")}`,
  );
}

export async function getRegistrationProof(idPendaftaran: number | string) {
  const session = await auth();

  if (!session?.user?.idUser) {
    return {
      ok: false,
      error: "Silakan login terlebih dahulu.",
    };
  }

  const registrationId = Number(idPendaftaran);
  const userId = Number(session.user.idUser);

  if (!Number.isInteger(registrationId) || registrationId <= 0) {
    return {
      ok: false,
      error: "ID bukti tidak valid.",
    };
  }

  const [row] = await getDb()
    .select({
      idPendaftaran: pendaftaranEvent.idPendaftaran,
      tanggalDaftar: pendaftaranEvent.tanggalDaftar,
      userId: pendaftaranEvent.userId,
      namaPelanggan: users.namaPelanggan,
      email: users.email,
      nomorTelp: users.nomorTelp,
      eventId: events.idEvent,
      namaEvent: events.namaEvent,
      jenisEvent: events.jenisEvent,
      tanggalPelaksanaan: events.tanggalPelaksanaan,
      biayaEvent: events.biayaEvent,
    })
    .from(pendaftaranEvent)
    .innerJoin(events, eq(events.idEvent, pendaftaranEvent.eventId))
    .innerJoin(users, eq(users.idUser, pendaftaranEvent.userId))
    .where(
      and(
        eq(pendaftaranEvent.idPendaftaran, registrationId),
        eq(pendaftaranEvent.userId, userId),
      ),
    )
    .limit(1);

  if (!row) {
    return {
      ok: false,
      error: "Bukti pendaftaran tidak ditemukan.",
    };
  }

  return {
    ok: true,
    registration: row,
  };
}
