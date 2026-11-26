import "server-only";

import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db";
import {
  hariLibur,
  kunjunganPengambilan,
  laporanKendala,
  perubahanJadwal,
} from "@/lib/db/schema";
import { hariKerjaBerikutnya, tambahHari } from "../jadwal";
import {
  isAturanHariLibur,
  isJenisLaporan,
  isStatusLaporan,
  type AturanHariLibur,
  type IsiTracker,
  type LaporanTracker,
  type PemberitahuanLibur,
  type PerubahanPolaTracker,
} from "../types";

// Pemberitahuan di tracker pelanggan (kode tugas 2.4), dipanggil getTrackerSaya() di
// queries/pelanggan.ts SETELAH cek sesi dan langganan aktif. Fungsi di sini menerima
// idUser dan idPengajuan dari pemanggil itu, jadi jangan dipanggil dengan id dari form
// atau URL. Kunjungan tertunda dibaca bersama kunjungan lain di queries/pelanggan.ts.
//
// Batas tampilan disepakati di 2.4: libur sampai 30 hari ke depan, perubahan pola yang
// berlaku mulai 30 hari terakhir dan sesudahnya, dan 10 laporan terakhir.
const HARI_LIBUR_KE_DEPAN = 30;
const PERUBAHAN_POLA_KE_BELAKANG = 30;
const BATAS_PERMINTAAN = 10;

/** Nomor hari ISO (1 = Senin) sebuah kolom date, dihitung Postgres. */
function nomorHari(kolom: AnyPgColumn) {
  return sql<number>`extract(isodow from ${kolom})::int`.mapWith(Number);
}

/**
 * Hari libur dari hari ini sampai 30 hari ke depan yang jatuh di hari pola pelanggan.
 * Libur geser diberi tanggal diambil paling lambat dari hariKerjaBerikutnya() (2.2).
 * Peta memuat semua libur mendatang, karena hasil geser boleh melewati 30 hari itu.
 */
async function bacaLibur(
  hariPengambilan: readonly number[],
  hariIni: string,
): Promise<PemberitahuanLibur[]> {
  if (hariPengambilan.length === 0) return [];

  const daftar = await getDb()
    .select({
      tanggal: hariLibur.tanggal,
      hari: nomorHari(hariLibur.tanggal),
      keterangan: hariLibur.keterangan,
      aturan: hariLibur.aturan,
    })
    .from(hariLibur)
    .where(gte(hariLibur.tanggal, hariIni))
    .orderBy(asc(hariLibur.tanggal));

  // 1. Aturan asing berarti data rusak, jadi dilempar ke error.tsx.
  const peta = new Map<string, AturanHariLibur>();
  const valid = daftar.map((baris) => {
    if (!isAturanHariLibur(baris.aturan)) {
      throw new Error(`Aturan hari libur tidak dikenal: ${baris.aturan}`);
    }
    peta.set(baris.tanggal, baris.aturan);
    return { ...baris, aturan: baris.aturan };
  });

  // 2. Hanya libur di hari pola dan masih dalam 30 hari; teks "YYYY-MM-DD" dibandingkan langsung.
  const akhir = tambahHari(hariIni, HARI_LIBUR_KE_DEPAN);
  return valid
    .filter(
      (libur) =>
        libur.tanggal <= akhir && hariPengambilan.includes(libur.hari),
    )
    .map((libur) => ({
      ...libur,
      diambilPalingLambat:
        libur.aturan === "geser"
          ? hariKerjaBerikutnya(libur.tanggal, peta)
          : null,
    }));
}

/**
 * Perubahan pola dari admin (2.7) untuk kesepakatan pelanggan, yang berlaku mulai
 * 30 hari terakhir atau sesudahnya. Yang terbaru lebih dulu.
 */
async function bacaPerubahanPola(
  idPengajuan: number,
  hariIni: string,
): Promise<PerubahanPolaTracker[]> {
  return getDb()
    .select({
      idPerubahan: perubahanJadwal.idPerubahan,
      hariPengambilan: perubahanJadwal.hariPengambilan,
      jamMulai: perubahanJadwal.jamMulai,
      jamSelesai: perubahanJadwal.jamSelesai,
      berlakuMulai: perubahanJadwal.berlakuMulai,
      alasan: perubahanJadwal.alasan,
    })
    .from(perubahanJadwal)
    .where(
      and(
        eq(perubahanJadwal.pengajuanId, idPengajuan),
        gte(
          perubahanJadwal.berlakuMulai,
          tambahHari(hariIni, -PERUBAHAN_POLA_KE_BELAKANG),
        ),
      ),
    )
    .orderBy(desc(perubahanJadwal.berlakuMulai), desc(perubahanJadwal.idPerubahan));
}

/**
 * 10 laporan terakhir milik akun ini beserta tanggal kunjungannya, tanggapan admin,
 * dan tanggal pengganti yang disetujui admin (2.6), yaitu kunjungan baru dengan
 * pengganti_dari berisi kunjungan yang dilewati. Jenis atau status asing dilempar.
 */
async function bacaPermintaan(idUser: number): Promise<LaporanTracker[]> {
  const db = getDb();
  const pengganti = alias(kunjunganPengambilan, "pengganti");
  const penggantiDisetujui = db
    .select({ tanggal: sql<string>`min(${pengganti.tanggal})` })
    .from(pengganti)
    .where(
      and(
        eq(pengganti.penggantiDari, laporanKendala.kunjunganId),
        eq(laporanKendala.jenis, "lewati"),
      ),
    );

  const daftar = await db
    .select({
      idLaporan: laporanKendala.idLaporan,
      jenis: laporanKendala.jenis,
      status: laporanKendala.status,
      pesan: laporanKendala.pesan,
      tanggalPengganti: laporanKendala.tanggalPengganti,
      tanggapanAdmin: laporanKendala.tanggapanAdmin,
      dibuatPada: laporanKendala.dibuatPada,
      tanggalKunjungan: kunjunganPengambilan.tanggal,
      hariKunjungan: nomorHari(kunjunganPengambilan.tanggal),
      tanggalPenggantiDisetujui: sql<string | null>`(${penggantiDisetujui})`,
    })
    .from(laporanKendala)
    .innerJoin(
      kunjunganPengambilan,
      eq(kunjunganPengambilan.idKunjungan, laporanKendala.kunjunganId),
    )
    .where(eq(laporanKendala.idUser, idUser))
    .orderBy(desc(laporanKendala.dibuatPada), desc(laporanKendala.idLaporan))
    .limit(BATAS_PERMINTAAN);

  return daftar.map((baris) => {
    if (!isJenisLaporan(baris.jenis) || !isStatusLaporan(baris.status)) {
      throw new Error(
        `Laporan tidak dikenal: jenis ${baris.jenis}, status ${baris.status}`,
      );
    }
    return { ...baris, jenis: baris.jenis, status: baris.status };
  });
}

/**
 * Pemberitahuan tracker selain kunjungan tertunda: libur di hari pola, perubahan pola
 * dari admin, dan status laporan pelanggan. Pelanggan tanpa kesepakatan siap_bayar
 * (idPengajuan null, pola kosong) tidak mendapat pemberitahuan libur dan perubahan pola.
 */
export async function bacaPemberitahuan(isi: {
  idUser: number;
  idPengajuan: number | null;
  hariPengambilan: readonly number[];
  hariIni: string;
}): Promise<Pick<IsiTracker, "libur" | "perubahanPola" | "permintaan">> {
  const [libur, perubahanPola, permintaan] = await Promise.all([
    bacaLibur(isi.hariPengambilan, isi.hariIni),
    isi.idPengajuan === null
      ? Promise.resolve([])
      : bacaPerubahanPola(isi.idPengajuan, isi.hariIni),
    bacaPermintaan(isi.idUser),
  ]);
  return { libur, perubahanPola, permintaan };
}
