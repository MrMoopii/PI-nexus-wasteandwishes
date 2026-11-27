import { z } from "zod";

// Skema filter URL halaman /admin/laporan-bulanan (kode tugas 2.5, CONTRIBUTING 9.8).
// Tanpa "use server" dan "server-only". idUser tidak pernah masuk skema:
// admin yang memeriksa laporan selalu dari sesi (bagian 7.2 no. 3).

/** Pola "YYYY-MM" untuk filter bulan. */
const BULAN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Filter bulan dari ?bulan= di URL, dipakai lewat skemaFilterLaporan. Kosong
 * berarti memakai bawaan (bulan ini, WIB); diisi tetapi tidak cocok dengan
 * pola berarti halaman 404 (CONTRIBUTING 9.3 dan aturan tugas 2.5).
 */
export const skemaBulan = z.string({ error: "Bulan tidak valid." }).regex(
  BULAN,
  { error: "Bulan tidak valid." },
);

/**
 * Filter instansi dari ?instansi= di URL: ID pengajuan, dipakai lewat
 * skemaFilterLaporan. Kosong berarti semua instansi; diisi tetapi tidak
 * berupa angka bulat positif berarti 404 (CONTRIBUTING 9.3).
 */
export const skemaInstansi = z.coerce
  .number({ error: "Instansi tidak valid." })
  .int({ error: "Instansi tidak valid." })
  .positive({ error: "Instansi tidak valid." });

/**
 * String kosong dari URL dianggap tidak diisi. Form GET selalu mengirim
 * ?bulan= dan ?instansi=, juga saat "Semua instansi" dipilih atau bulan
 * dikosongkan; tanpa ini z.coerce.number("") menjadi 0 dan ditolak (#185).
 */
function kosongJadiUndefined(nilai: unknown): unknown {
  return nilai === "" ? undefined : nilai;
}

/** Gabungan filter bulan dan instansi untuk halaman laporan bulanan. */
export const skemaFilterLaporan = z.object({
  bulan: z.preprocess(kosongJadiUndefined, skemaBulan.optional()),
  instansi: z.preprocess(kosongJadiUndefined, skemaInstansi.optional()),
});

/** Nama isian filter laporan; sama dengan parameter URL. */
export type FilterLaporan = z.infer<typeof skemaFilterLaporan>;
