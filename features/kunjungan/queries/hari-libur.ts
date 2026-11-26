import "server-only";

import { redirect } from "next/navigation";
import { asc, gte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { hariLibur } from "@/lib/db/schema";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { requireAdmin } from "@/lib/require-admin";
import { isAturanHariLibur, type HariLiburTampilan } from "../types";

/**
 * Hari libur mulai hari ini (WIB), urut dari yang terdekat, untuk halaman admin
 * hari libur dan buat kunjungan (kode tugas 2.2). Libur yang sudah lewat tidak
 * memengaruhi pembuatan kunjungan, jadi tidak ikut.
 * Hanya admin; belum login dialihkan ke login, bukan admin ke beranda.
 * Gagal (dilempar) jika aturan di database tidak dikenal.
 */
export async function getDaftarHariLibur(): Promise<HariLiburTampilan[]> {
  // 1. Cek admin sebelum membaca data (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");

  // 2. Kolom date dibandingkan sebagai teks dengan tanggal hari ini (CONTRIBUTING 9.2).
  const daftar = await getDb()
    .select({
      idHariLibur: hariLibur.idHariLibur,
      tanggal: hariLibur.tanggal,
      keterangan: hariLibur.keterangan,
      aturan: hariLibur.aturan,
    })
    .from(hariLibur)
    .where(gte(hariLibur.tanggal, tanggalHariIniJakarta()))
    .orderBy(asc(hariLibur.tanggal));

  // 3. Aturan asing berarti data rusak, jadi dilempar ke error.tsx.
  return daftar.map((baris) => {
    if (!isAturanHariLibur(baris.aturan)) {
      throw new Error(`Aturan hari libur tidak dikenal: ${baris.aturan}`);
    }
    return { ...baris, aturan: baris.aturan };
  });
}
