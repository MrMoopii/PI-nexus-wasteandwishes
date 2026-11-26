"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hariLibur } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import {
  skemaHariLibur,
  skemaIdHariLibur,
  type IsianHariLibur,
} from "../validasi/hari-libur";
import {
  teksIsian,
  type GalatIsian,
  type NilaiIsian,
} from "../validasi/jadwal";

// Aksi admin hari libur (kode tugas 2.2): tambah, ubah, hapus. Dipanggil lewat
// useActionState dari halaman /admin/hari-libur. Kunjungan yang sudah dibuat tidak
// ikut berubah (keputusan 2.2), jadi halaman meminta libur diisi sebelum membuat kunjungan.

/** Hasil aksi hari libur: pesan sukses, atau pesan gagal beserta isian yang diketik. */
export type HasilAksiHariLibur =
  | { ok: true; pesan: string }
  | {
      ok: false;
      pesan: string;
      galat?: GalatIsian<IsianHariLibur>;
      nilai?: NilaiIsian<IsianHariLibur>;
    };

const SUDAH_DIHAPUS = "Hari libur ini sudah dihapus. Muat ulang halaman.";
const TANGGAL_TERPAKAI = "Tanggal ini sudah terdaftar sebagai hari libur.";
const ISIAN_LIBUR: IsianHariLibur[] = ["tanggal", "keterangan", "aturan"];

/** Hasil gagal form hari libur dengan pesan per isian. */
function isianSalah(
  galat: GalatIsian<IsianHariLibur>,
  nilai: NilaiIsian<IsianHariLibur>,
): HasilAksiHariLibur {
  return {
    ok: false,
    pesan: "Periksa kembali isian yang ditandai.",
    galat,
    nilai,
  };
}

/** ID dari form ubah dan hapus, atau pesan gagal dari skema jika tidak valid. */
function bacaId(formData: FormData): { idHariLibur: number } | string {
  const id = skemaIdHariLibur.safeParse({
    idHariLibur: formData.get("idHariLibur"),
  });
  if (id.success) return id.data;
  return id.error.issues[0]?.message ?? "Isian tidak valid.";
}

/** Hari libur memengaruhi kedua halaman admin, jadi keduanya disegarkan. */
function segarkanHalaman(): void {
  revalidatePath("/admin/hari-libur");
  revalidatePath("/admin/buat-kunjungan");
}

/**
 * Admin menambah hari libur.
 * Hanya admin; gagal jika isian salah atau tanggal itu sudah terdaftar.
 */
export async function tambahHariLibur(
  _sebelumnya: HasilAksiHariLibur | null,
  formData: FormData,
): Promise<HasilAksiHariLibur> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8).
  const nilai = teksIsian(formData, ISIAN_LIBUR);
  const hasil = skemaHariLibur.safeParse(nilai);
  if (!hasil.success) {
    return isianSalah(z.flattenError(hasil.error).fieldErrors, nilai);
  }

  // 3. Tanggal ganda ditolak unique index; ON CONFLICT DO NOTHING mengubahnya
  //    menjadi hasil kosong, bukan error 500.
  const [baru] = await getDb()
    .insert(hariLibur)
    .values(hasil.data)
    .onConflictDoNothing({ target: hariLibur.tanggal })
    .returning({ idHariLibur: hariLibur.idHariLibur });
  if (!baru) return isianSalah({ tanggal: [TANGGAL_TERPAKAI] }, nilai);

  // 4. Segarkan halaman hari libur dan buat kunjungan.
  segarkanHalaman();
  return { ok: true, pesan: "Hari libur ditambahkan." };
}

/**
 * Admin mengubah tanggal, keterangan, atau aturan satu hari libur.
 * Hanya admin; gagal jika ID atau isian salah, tanggal baru sudah dipakai
 * libur lain, atau hari libur sudah dihapus.
 */
export async function ubahHariLibur(
  _sebelumnya: HasilAksiHariLibur | null,
  formData: FormData,
): Promise<HasilAksiHariLibur> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi ID baris, lalu isiannya (CONTRIBUTING 9.8).
  const id = bacaId(formData);
  if (typeof id === "string") return { ok: false, pesan: id };
  const { idHariLibur } = id;
  const nilai = teksIsian(formData, ISIAN_LIBUR);
  const hasil = skemaHariLibur.safeParse(nilai);
  if (!hasil.success) {
    return isianSalah(z.flattenError(hasil.error).fieldErrors, nilai);
  }

  // 3. Satu perintah: ubah hanya jika tanggal barunya belum dipakai libur lain.
  const db = getDb();
  const lain = alias(hariLibur, "lain");
  const [diubah] = await db
    .update(hariLibur)
    .set(hasil.data)
    .where(
      and(
        eq(hariLibur.idHariLibur, idHariLibur),
        notExists(
          db
            .select({ idHariLibur: lain.idHariLibur })
            .from(lain)
            .where(
              and(
                eq(lain.tanggal, hasil.data.tanggal),
                ne(lain.idHariLibur, idHariLibur),
              ),
            ),
        ),
      ),
    )
    .returning({ idHariLibur: hariLibur.idHariLibur });

  // 4. Tidak ada yang berubah: bedakan baris yang sudah dihapus dan tanggal terpakai.
  if (!diubah) {
    const [masihAda] = await db
      .select({ idHariLibur: hariLibur.idHariLibur })
      .from(hariLibur)
      .where(eq(hariLibur.idHariLibur, idHariLibur))
      .limit(1);
    if (!masihAda) return { ok: false, pesan: SUDAH_DIHAPUS };
    return isianSalah({ tanggal: [TANGGAL_TERPAKAI] }, nilai);
  }

  // 5. Segarkan halaman hari libur dan buat kunjungan.
  segarkanHalaman();
  return { ok: true, pesan: "Perubahan hari libur disimpan." };
}

/**
 * Admin menghapus satu hari libur.
 * Hanya admin; gagal jika ID salah atau hari libur sudah dihapus.
 */
export async function hapusHariLibur(
  _sebelumnya: HasilAksiHariLibur | null,
  formData: FormData,
): Promise<HasilAksiHariLibur> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi ID (CONTRIBUTING 9.8).
  const id = bacaId(formData);
  if (typeof id === "string") return { ok: false, pesan: id };

  // 3. Hapus; tidak ada baris yang kembali berarti sudah dihapus di tab lain.
  const [dihapus] = await getDb()
    .delete(hariLibur)
    .where(eq(hariLibur.idHariLibur, id.idHariLibur))
    .returning({ idHariLibur: hariLibur.idHariLibur });
  if (!dihapus) return { ok: false, pesan: SUDAH_DIHAPUS };

  // 4. Segarkan halaman hari libur dan buat kunjungan.
  segarkanHalaman();
  return { ok: true, pesan: "Hari libur dihapus." };
}
