"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { pengajuanLangganan } from "@/lib/db/schema";
import { requireLogin } from "@/lib/require-login";
import { AKSI_PENGAJUAN, statusAsal } from "../aturan";
import { getAkunLanggananSaya } from "../queries/pelanggan";
import {
  ISIAN_PENGAJUAN,
  skemaBatalPengajuan,
  skemaPengajuan,
  type GalatIsianPengajuan,
  type NilaiIsianPengajuan,
} from "../validasi/pelanggan";

/** Hasil kirimPengajuan() untuk useActionState di form pengajuan. */
export type HasilKirimPengajuan =
  | { ok: true }
  | {
      ok: false;
      pesan: string;
      galat?: GalatIsianPengajuan;
      nilai?: NilaiIsianPengajuan;
    };

/** Hasil batalkanPengajuan() untuk useActionState di tombol batal. */
export type HasilBatalPengajuan = { ok: true } | { ok: false; pesan: string };

// Harus sama dengan WHERE unique index pengajuan_langganan_satu_berjalan_per_user
// di lib/db/schema-langganan.ts, supaya ON CONFLICT memakai index itu.
const KONDISI_BERJALAN = sql`status NOT IN ('ditolak', 'dibatalkan')`;

/** Teks isian apa adanya, hanya untuk dikembalikan ke form saat gagal. */
function nilaiDariForm(formData: FormData): NilaiIsianPengajuan {
  const nilai: NilaiIsianPengajuan = {};
  for (const nama of ISIAN_PENGAJUAN) {
    const isian = formData.get(nama);
    if (typeof isian === "string") nilai[nama] = isian;
  }
  return nilai;
}

/**
 * Pelanggan mengirim pengajuan langganan baru dengan status menunggu_review.
 * Hanya akun berperan user dengan profil lengkap. Gagal jika isian salah
 * atau akun masih punya pengajuan yang berjalan.
 */
export async function kirimPengajuan(
  _sebelumnya: HasilKirimPengajuan | null,
  formData: FormData,
): Promise<HasilKirimPengajuan> {
  // 1. Cek sesi sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8). Teks yang diketik ikut dikembalikan,
  //    karena React mengosongkan form setelah action selesai.
  const nilai = nilaiDariForm(formData);
  const hasil = skemaPengajuan.safeParse(nilai);
  if (!hasil.success) {
    return {
      ok: false,
      pesan: "Periksa kembali isian yang ditandai.",
      galat: z.flattenError(hasil.error).fieldErrors,
      nilai,
    };
  }

  // 3. Admin dan akun dengan profil belum lengkap ditolak di sini, bukan hanya
  //    disembunyikan di halaman (CONTRIBUTING 7.2 no. 9).
  const { halangan } = await getAkunLanggananSaya();
  if (halangan === "bukan_pelanggan") {
    return {
      ok: false,
      pesan: "Hanya akun pelanggan yang dapat mengajukan langganan.",
      nilai,
    };
  }
  if (halangan === "profil_belum_lengkap") {
    return {
      ok: false,
      pesan: "Lengkapi profil Anda terlebih dahulu sebelum mengajukan langganan.",
      nilai,
    };
  }

  // 4. Simpan. Unique index sebagian menolak pengajuan kedua selagi ada yang berjalan;
  //    ON CONFLICT DO NOTHING mengubah penolakan itu menjadi hasil kosong, bukan error 500.
  const [baru] = await getDb()
    .insert(pengajuanLangganan)
    .values({ ...hasil.data, idUser: cek.idUser, status: "menunggu_review" })
    .onConflictDoNothing({
      target: pengajuanLangganan.idUser,
      where: KONDISI_BERJALAN,
    })
    .returning({ idPengajuan: pengajuanLangganan.idPengajuan });

  if (!baru) {
    return {
      ok: false,
      pesan:
        "Anda masih punya pengajuan yang sedang berjalan. Muat ulang halaman untuk melihat statusnya.",
      nilai,
    };
  }

  // 5. Segarkan halaman supaya tampilan berganti ke status pengajuan.
  revalidatePath("/langganan");
  return { ok: true };
}

/**
 * Pelanggan membatalkan pengajuannya sendiri. Hanya sebelum siap_bayar.
 * Gagal jika ID salah, pengajuan milik akun lain, atau statusnya sudah berubah.
 */
export async function batalkanPengajuan(
  _sebelumnya: HasilBatalPengajuan | null,
  formData: FormData,
): Promise<HasilBatalPengajuan> {
  // 1. Cek sesi sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi ID pengajuan dari form (CONTRIBUTING 9.8).
  const hasil = skemaBatalPengajuan.safeParse({
    idPengajuan: formData.get("idPengajuan"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
    };
  }

  // 3. Satu UPDATE bersyarat: milik akun ini dan status asal masih mengizinkan
  //    (CONTRIBUTING 6.2). Transisinya diambil dari aturan.ts.
  const [batal] = await getDb()
    .update(pengajuanLangganan)
    .set({
      status: AKSI_PENGAJUAN.batalkanPengajuan.ke,
      diperbaruiPada: sql`now()`,
    })
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, hasil.data.idPengajuan),
        eq(pengajuanLangganan.idUser, cek.idUser),
        inArray(pengajuanLangganan.status, statusAsal("batalkanPengajuan")),
      ),
    )
    .returning({ idPengajuan: pengajuanLangganan.idPengajuan });

  // ID milik akun lain dan status yang sudah berubah sama-sama kosong di sini.
  // Pesannya disamakan supaya tidak membocorkan pengajuan akun lain.
  if (!batal) {
    return {
      ok: false,
      pesan:
        "Pengajuan tidak dapat dibatalkan karena statusnya sudah berubah. Muat ulang halaman.",
    };
  }

  // 4. Segarkan halaman supaya form pengajuan baru muncul.
  revalidatePath("/langganan");
  return { ok: true };
}
