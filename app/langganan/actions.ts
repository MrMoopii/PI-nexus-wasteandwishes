"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { requireLogin } from "@/lib/require-login";
import { getDb } from "@/lib/db";
import { dataLangganan, pembayaranLangganan, users } from "@/lib/db/schema";
import { getMidtransSnap } from "@/lib/midtrans";

const HARGA_LANGGANAN = 30000;

export async function mulaiPembayaranLangganan(): Promise<
  { ok: true; redirectUrl: string } | { ok: false; pesan: string }
> {
  const cek = await requireLogin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  const db = getDb();
  const [user] = await db
    .select({
      idUser: users.idUser,
      namaPelanggan: users.namaPelanggan,
      username: users.username,
      email: users.email,
      nomorTelp: users.nomorTelp,
    })
    .from(users)
    .where(eq(users.idUser, cek.idUser))
    .limit(1);

  if (!user) return { ok: false, pesan: "Data akun tidak ditemukan." };

  await db
    .insert(dataLangganan)
    .values({ userId: cek.idUser, statusLangganan: "tidak_aktif" })
    .onConflictDoNothing({ target: dataLangganan.userId });

  const [langganan] = await db
    .select({ idLangganan: dataLangganan.idLangganan })
    .from(dataLangganan)
    .where(eq(dataLangganan.userId, cek.idUser))
    .limit(1);

  if (!langganan) {
    return { ok: false, pesan: "Data langganan gagal disiapkan. Coba lagi." };
  }

  const orderId = `lang-${cek.idUser}-${randomUUID()}`;
  await db.insert(pembayaranLangganan).values({
    langgananId: langganan.idLangganan,
    orderId,
    jumlah: String(HARGA_LANGGANAN),
    statusPembayaran: "pending",
  });

  try {
    const transaction = await getMidtransSnap().createTransaction({
      transaction_details: { order_id: orderId, gross_amount: HARGA_LANGGANAN },
      customer_details: {
        first_name: user.namaPelanggan || user.username || "Pelanggan",
        email: user.email,
        ...(user.nomorTelp ? { phone: user.nomorTelp } : {}),
      },
      item_details: [
        {
          id: "langganan-30-hari",
          price: HARGA_LANGGANAN,
          quantity: 1,
          name: "Langganan 30 hari",
        },
      ],
    });

    if (!transaction.redirect_url) {
      throw new Error("Midtrans tidak mengembalikan URL pembayaran.");
    }

    return { ok: true, redirectUrl: transaction.redirect_url };
  } catch (error) {
    console.error("Gagal membuat transaksi langganan Midtrans:", error);
    await db
      .update(pembayaranLangganan)
      .set({ statusPembayaran: "gagal" })
      .where(eq(pembayaranLangganan.orderId, orderId));
    return {
      ok: false,
      pesan: "Checkout belum dapat dibuat. Silakan coba beberapa saat lagi.",
    };
  }
}
