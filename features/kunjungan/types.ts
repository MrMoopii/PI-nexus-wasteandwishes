import type {
  hariLibur,
  kunjunganPengambilan,
  laporanKendala,
  perubahanJadwal,
} from "@/lib/db/schema";

/** Setiap daftar ditulis sekali, lalu tipenya diturunkan dari daftar itu.
    Daftar ini juga dipakai skema Zod: z.enum(STATUS_KUNJUNGAN) (CONTRIBUTING 9.8).
    Setiap daftar HARUS sama dengan CHECK-nya di lib/db/schema-kunjungan.ts.
*/

/**
 * Status kunjungan pengambilan.
 * Harus sama dengan CHECK kunjungan_pengambilan_status_valid.
 */
export const STATUS_KUNJUNGAN = [
  "dijadwalkan",
  "diambil",
  "ditimbang",
  "tertunda",
  "batal",
  "dilewati",
] as const;

export type StatusKunjungan = (typeof STATUS_KUNJUNGAN)[number];

/** Pemeriksa status kunjungan dari database (bertipe string) tanpa "as". */
export function isStatusKunjungan(nilai: string): nilai is StatusKunjungan {
  return STATUS_KUNJUNGAN.some((status) => status === nilai);
}

/** Label tampilan setiap status kunjungan, dipakai tracker dan halaman admin. */
export const LABEL_STATUS_KUNJUNGAN: Record<StatusKunjungan, string> = {
  dijadwalkan: "Dijadwalkan",
  diambil: "Diambil",
  ditimbang: "Ditimbang",
  tertunda: "Tertunda",
  batal: "Batal",
  dilewati: "Dilewati",
};

/**
 * Jenis laporan dari pelanggan: kendala, atau permintaan satu pengambilan dilewati.
 * Harus sama dengan CHECK laporan_kendala_jenis_valid.
 */
export const JENIS_LAPORAN = ["kendala", "lewati"] as const;

export type JenisLaporan = (typeof JENIS_LAPORAN)[number];

/** Pemeriksa jenis laporan dari database. */
export function isJenisLaporan(nilai: string): nilai is JenisLaporan {
  return JENIS_LAPORAN.some((jenis) => jenis === nilai);
}

/** Label tampilan setiap jenis laporan. */
export const LABEL_JENIS_LAPORAN: Record<JenisLaporan, string> = {
  kendala: "Kendala",
  lewati: "Lewati pengambilan",
};

/**
 * Status laporan. 'menunggu' sampai admin menanggapi, termasuk lewati yang langsung berlaku.
 * Harus sama dengan CHECK laporan_kendala_status_valid.
 */
export const STATUS_LAPORAN = ["menunggu", "ditanggapi"] as const;

export type StatusLaporan = (typeof STATUS_LAPORAN)[number];

/** Pemeriksa status laporan dari database. */
export function isStatusLaporan(nilai: string): nilai is StatusLaporan {
  return STATUS_LAPORAN.some((status) => status === nilai);
}

/** Label tampilan setiap status laporan. */
export const LABEL_STATUS_LAPORAN: Record<StatusLaporan, string> = {
  menunggu: "Menunggu tanggapan",
  ditanggapi: "Sudah ditanggapi",
};

/**
 * Aturan hari libur: geser ke hari kerja berikutnya yang bukan libur, atau lewati.
 * Harus sama dengan CHECK hari_libur_aturan_valid.
 */
export const ATURAN_HARI_LIBUR = ["geser", "lewati"] as const;

export type AturanHariLibur = (typeof ATURAN_HARI_LIBUR)[number];

/** Pemeriksa aturan hari libur dari database. */
export function isAturanHariLibur(nilai: string): nilai is AturanHariLibur {
  return ATURAN_HARI_LIBUR.some((aturan) => aturan === nilai);
}

/** Label tampilan setiap aturan hari libur, untuk pilihan di form admin. */
export const LABEL_ATURAN_HARI_LIBUR: Record<AturanHariLibur, string> = {
  geser: "Geser ke hari kerja berikutnya",
  lewati: "Lewati pengambilan",
};

// Bentuk data untuk tampilan. Nama kolom diambil dari skema (CONTRIBUTING 9.2),
// lalu kolom status/pilihan diganti tipe sempitnya dan kolom numeric menjadi number.
// Kolom date tetap string "YYYY-MM-DD", kolom timestamp tetap Date.
type BarisKunjungan = typeof kunjunganPengambilan.$inferSelect;
type BarisLaporan = typeof laporanKendala.$inferSelect;
type BarisHariLibur = typeof hariLibur.$inferSelect;
type BarisPerubahanJadwal = typeof perubahanJadwal.$inferSelect;

/**
 * Satu kunjungan untuk tracker pelanggan dan pencatatan admin.
 * Tanpa id_user, id pencatat, dan fileId foto, karena tampilan tidak membutuhkannya
 * (CONTRIBUTING 7.2 no. 7). fileId dibaca di Server Action saat foto diganti.
 */
export type KunjunganTampilan = Omit<
  BarisKunjungan,
  "idUser" | "dicatatOleh" | "fotoBuktiFileId" | "status" | "beratKg"
> & {
  status: StatusKunjungan;
  beratKg: number | null;
};

/** Satu laporan kendala atau permintaan lewati. Tanpa id_user pelapor. */
export type LaporanKendalaTampilan = Omit<
  BarisLaporan,
  "idUser" | "jenis" | "status"
> & {
  jenis: JenisLaporan;
  status: StatusLaporan;
};

/** Satu hari libur di daftar admin dan di pesan tracker ("Ditunda: <keterangan>."). */
export type HariLiburTampilan = Omit<BarisHariLibur, "aturan"> & {
  aturan: AturanHariLibur;
};

/** Satu perubahan pola jadwal, untuk riwayat dan pemberitahuan di tracker. Tanpa id admin. */
export type PerubahanJadwalTampilan = Omit<BarisPerubahanJadwal, "diubahOleh">;
