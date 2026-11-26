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

// ── Tracker pelanggan (kode tugas 2.4) ─────────────────────────────

/** Nama hari pola: 1 = Senin sampai 5 = Jumat, sama dengan hari_pengambilan dan ISODOW. */
export const LABEL_HARI: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
};

/** Nama hari dari angka 1–5. Angka lain ditampilkan apa adanya, tidak disembunyikan. */
export function namaHari(hari: number): string {
  return LABEL_HARI[hari] ?? `Hari ke-${hari}`;
}

/** Panjang pesan kendala dan alasan lewati paling banyak, dipakai skema dan form. */
export const PANJANG_PESAN_LAPORAN_MAKS = 1000;

/**
 * Satu kunjungan di tracker. Hanya kolom yang ditampilkan ke pelanggan: tanpa foto,
 * catatan admin, dan pencatat (CONTRIBUTING 7.2 no. 7). `hari` = nomor hari ISO tanggalnya.
 */
export type KunjunganTracker = Pick<
  KunjunganTampilan,
  | "idKunjungan"
  | "tanggal"
  | "jamMulai"
  | "jamSelesai"
  | "status"
  | "jumlahEmber"
  | "beratKg"
  | "alasanKendala"
  | "tanggalPalingLambat"
  | "penggantiDari"
> & { hari: number };

/** Kunjungan yang bisa dipilih di form laporan. */
export type PilihanKunjungan = Pick<
  KunjunganTracker,
  "idKunjungan" | "tanggal" | "hari" | "status"
>;

/** Kunjungan yang masih boleh diminta lewati; `batas` sudah diformat di server (WIB). */
export type PilihanLewati = PilihanKunjungan & { batas: string };

/** Pola tetap dari kesepakatan yang berlaku (pengajuan siap_bayar). Hanya admin yang mengubahnya. */
export type JadwalTetap = {
  namaInstansi: string;
  hariPengambilan: number[];
  jamMulai: string | null;
  jamSelesai: string | null;
};

/** Hari libur di hari pola pelanggan. `diambilPalingLambat` hanya untuk aturan geser. */
export type PemberitahuanLibur = Pick<
  HariLiburTampilan,
  "tanggal" | "keterangan" | "aturan"
> & { hari: number; diambilPalingLambat: string | null };

/** Perubahan pola dari admin (2.7) yang ditampilkan ke pelanggan. */
export type PerubahanPolaTracker = Omit<
  PerubahanJadwalTampilan,
  "pengajuanId" | "dibuatPada"
>;

/** Laporan pelanggan beserta tanggapan admin dan tanggal pengganti yang disetujui (2.6). */
export type LaporanTracker = Omit<
  LaporanKendalaTampilan,
  "kunjunganId"
> & {
  tanggalKunjungan: string;
  hariKunjungan: number;
  tanggalPenggantiDisetujui: string | null;
};

/** Isi halaman /tracker untuk pelanggan dengan langganan aktif. */
export type IsiTracker = {
  hariIni: string;
  jadwalTetap: JadwalTetap | null;
  kunjunganHariIni: KunjunganTracker | null;
  mendatang: KunjunganTracker[];
  riwayat: KunjunganTracker[];
  /** Ember dari status diambil dan ditimbang, kg dari status ditimbang, seluruh riwayat. */
  total: { ember: number; kg: number };
  tertunda: KunjunganTracker[];
  libur: PemberitahuanLibur[];
  perubahanPola: PerubahanPolaTracker[];
  permintaan: LaporanTracker[];
  pilihanKendala: {
    hariIni: PilihanKunjungan | null;
    mendatang: PilihanKunjungan[];
    riwayat: PilihanKunjungan[];
  };
  pilihanLewati: PilihanLewati[];
};

/** Hasil getTrackerSaya(): akun tanpa langganan aktif tidak menerima data apa pun. */
export type DataTracker = { aktif: false } | ({ aktif: true } & IsiTracker);
