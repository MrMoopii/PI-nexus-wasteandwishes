import "server-only";

import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { kunjunganPengambilan, pengajuanLangganan } from "@/lib/db/schema";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { requireAdmin } from "@/lib/require-admin";
import { isStatusKunjungan, type StatusKunjungan } from "../types";
import { skemaFilterTanggal } from "../validasi/pencatatan";

/** Satu baris daftar pencatatan harian. Hanya kolom yang dipakai tampilan. */
export type KunjunganHarian = {
  idKunjungan: number;
  namaInstansi: string;
  jamMulai: string | null;
  jamSelesai: string | null;
  status: StatusKunjungan;
  jumlahEmber: number | null;
  beratKg: number | null;
  fotoBukti: string | null;
  alasanKendala: string | null;
  tanggalPalingLambat: string | null;
};

/** Hasil halaman pencatatan: tanggal yang akhirnya dipakai dan barisnya. */
export type HalamanKunjungan = {
  tanggal: string;
  daftar: KunjunganHarian[];
};

/**
 * Kunjungan pada satu tanggal untuk halaman pencatatan admin (kode tugas 2.3).
 * Tanggal kosong berarti hari ini (WIB). Hanya admin; belum login dialihkan ke
 * login, bukan admin ke beranda. Tanggal yang diisi tetapi tidak valid menjadi 404.
 */
export async function getKunjunganPerTanggal(
  tanggalMentah: string | string[] | undefined,
): Promise<HalamanKunjungan> {
  // 1. Cek admin sebelum membaca URL atau data (CONTRIBUTING 7.2 dan 9.8).
  const cek = await requireAdmin();
  if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");

  // 2. Validasi ?tanggal=. Kosong berarti hari ini; isian salah berarti 404 (9.3).
  const hasil = skemaFilterTanggal.safeParse({
    tanggal: tanggalMentah === "" ? undefined : tanggalMentah,
  });
  if (!hasil.success) notFound();
  const tanggal = hasil.data.tanggal ?? tanggalHariIniJakarta();

  // 3. Baca hanya kolom yang dipakai tampilan, urut jam lalu id.
  const daftar = await getDb()
    .select({
      idKunjungan: kunjunganPengambilan.idKunjungan,
      namaInstansi: pengajuanLangganan.namaInstansi,
      jamMulai: kunjunganPengambilan.jamMulai,
      jamSelesai: kunjunganPengambilan.jamSelesai,
      status: kunjunganPengambilan.status,
      jumlahEmber: kunjunganPengambilan.jumlahEmber,
      beratKg: kunjunganPengambilan.beratKg,
      fotoBukti: kunjunganPengambilan.fotoBukti,
      alasanKendala: kunjunganPengambilan.alasanKendala,
      tanggalPalingLambat: kunjunganPengambilan.tanggalPalingLambat,
    })
    .from(kunjunganPengambilan)
    .innerJoin(
      pengajuanLangganan,
      eq(pengajuanLangganan.idPengajuan, kunjunganPengambilan.pengajuanId),
    )
    .where(eq(kunjunganPengambilan.tanggal, tanggal))
    .orderBy(
      asc(kunjunganPengambilan.jamMulai),
      asc(kunjunganPengambilan.idKunjungan),
    );

  // 4. Status ke tipe sempit, berat numeric ke number (CONTRIBUTING 9.2).
  return {
    tanggal,
    daftar: daftar.map((baris) => {
      if (!isStatusKunjungan(baris.status)) {
        throw new Error(`Status kunjungan tidak dikenal: ${baris.status}`);
      }
      return {
        ...baris,
        status: baris.status,
        beratKg: baris.beratKg === null ? null : Number(baris.beratKg),
      };
    }),
  };
}
