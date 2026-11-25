"use server";

import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  dataLangganan,
  pembayaranLangganan,
  pengajuanLangganan,
  users,
} from "@/lib/db/schema";
import { getMidtransSnap } from "@/lib/midtrans";
import { requireLogin } from "@/lib/require-login";
import { statusAsal } from "../aturan";
import { skemaMulaiPembayaran } from "../validasi/pembayaran";

type HasilMulaiPembayaran =
  | { ok: true; redirectUrl: string }
  | { ok: false; pesan: string };

/**
 * Pelanggan memulai pembayaran Midtrans untuk pengajuan berstatus siap_bayar miliknya.
 * Jumlah bayar = harga_final dari database. Ditolak jika belum login, bukan akun user
 * (admin), pengajuan bukan miliknya atau belum siap_bayar, atau langganan dihentikan.
 */
export async function mulaiPembayaranLangganan(
  formData: FormData,
): Promise<HasilMulaiPembayaran> {
  // 1. Cek sesi sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi ID pengajuan dari form (CONTRIBUTING 9.8).
  const hasil = skemaMulaiPembayaran.safeParse({
    idPengajuan: formData.get("idPengajuan"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
    };
  }
  const { idPengajuan } = hasil.data;

  const appBaseUrl = process.env.APP_BASE_URL?.trim().replace(/\/$/, "");
  if (!appBaseUrl || !URL.canParse(appBaseUrl)) {
    console.error("APP_BASE_URL kosong atau bukan URL yang valid.");
    return {
      ok: false,
      pesan: "Alamat aplikasi belum dikonfigurasi untuk kembali dari pembayaran.",
    };
  }

  const db = getDb();

  // 3. Peran dibaca dari database, bukan hanya dari sesi: hanya akun user yang boleh
  //    berlangganan, admin ditolak (CONTRIBUTING 7.2 no. 9, 9.7).
  const [user] = await db
    .select({
      peran: users.peran,
      namaPelanggan: users.namaPelanggan,
      username: users.username,
      email: users.email,
      nomorTelp: users.nomorTelp,
    })
    .from(users)
    .where(eq(users.idUser, cek.idUser))
    .limit(1);

  if (!user) return { ok: false, pesan: "Data akun tidak ditemukan." };
  if (user.peran !== "user") {
    return {
      ok: false,
      pesan: "Hanya akun pelanggan yang dapat membayar langganan.",
    };
  }

  // 4. Pengajuan harus milik user ini dan berstatus siap_bayar. Status yang boleh
  //    dibayar diambil dari aturan.ts supaya tidak ditulis ulang di sini.
  const [pengajuan] = await db
    .select({ hargaFinal: pengajuanLangganan.hargaFinal })
    .from(pengajuanLangganan)
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, idPengajuan),
        eq(pengajuanLangganan.idUser, cek.idUser),
        inArray(pengajuanLangganan.status, statusAsal("bayar")),
      ),
    )
    .limit(1);

  if (!pengajuan) {
    return {
      ok: false,
      pesan: "Pengajuan belum siap dibayar. Muat ulang halaman.",
    };
  }

  // 5. Midtrans menerima Rupiah tanpa sen, dan harga final memang selalu bulat.
  //    Harga kosong atau tidak bulat berarti data rusak: tolak, jangan dibulatkan.
  const jumlah = Number(pengajuan.hargaFinal);
  const hargaValid =
    pengajuan.hargaFinal !== null && Number.isInteger(jumlah) && jumlah > 0;
  if (!hargaValid) {
    console.error(
      `harga_final pengajuan ${idPengajuan} tidak valid untuk Midtrans:`,
      pengajuan.hargaFinal,
    );
    return {
      ok: false,
      pesan: "Pembayaran belum dapat dibuat. Silakan hubungi admin.",
    };
  }

  // 6. Siapkan baris data_langganan (satu per user), lalu tolak pelanggan yang
  //    langganannya dihentikan (CONTRIBUTING 9.7).
  await db
    .insert(dataLangganan)
    .values({ userId: cek.idUser, statusLangganan: "tidak_aktif" })
    .onConflictDoNothing({ target: dataLangganan.userId });

  const [langganan] = await db
    .select({
      idLangganan: dataLangganan.idLangganan,
      statusLangganan: dataLangganan.statusLangganan,
    })
    .from(dataLangganan)
    .where(eq(dataLangganan.userId, cek.idUser))
    .limit(1);

  if (!langganan) {
    return { ok: false, pesan: "Data langganan gagal disiapkan. Coba lagi." };
  }
  if (langganan.statusLangganan === "dihentikan") {
    return {
      ok: false,
      pesan: "Langganan Anda dihentikan. Silakan hubungi admin.",
    };
  }

  // 7. Catat pembayaran pending dengan jumlah dari harga_final. Webhook nanti
  //    mencocokkan gross_amount Midtrans dengan kolom jumlah ini.
  const orderId = `lang-${cek.idUser}-${randomUUID()}`;
  await db.insert(pembayaranLangganan).values({
    langgananId: langganan.idLangganan,
    orderId,
    jumlah: String(jumlah),
    statusPembayaran: "pending",
  });

  // 8. Buat transaksi Snap. Jika gagal, tandai pembayaran gagal supaya tidak
  //    menggantung sebagai pending.
  try {
    const transaction = await getMidtransSnap().createTransaction({
      transaction_details: { order_id: orderId, gross_amount: jumlah },
      customer_details: {
        first_name: user.namaPelanggan || user.username || "Pelanggan",
        email: user.email,
        ...(user.nomorTelp ? { phone: user.nomorTelp } : {}),
      },
      item_details: [
        {
          id: "langganan-30-hari",
          price: jumlah,
          quantity: 1,
          name: "Langganan 30 hari",
        },
      ],
      callbacks: {
        finish: `${appBaseUrl}/langganan`,
        unfinish: `${appBaseUrl}/langganan`,
        error: `${appBaseUrl}/langganan`,
      },
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
      pesan: "Pembayaran belum dapat dibuat. Silakan coba beberapa saat lagi.",
    };
  }
}
