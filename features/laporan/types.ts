/**
 * Bentuk data laporan bulanan untuk tampilan (kode tugas 2.5).
 * Semua nilai sudah dihitung di queries/admin.ts; file ini hanya tipe.
 */

/** Satu baris tabel: satu kunjungan yang sudah ditimbang. */
export type BarisLaporan = {
  tanggal: string;
  jamMulai: string | null;
  jamSelesai: string | null;
  jumlahEmber: number | null;
  beratKg: number;
};

/** Ringkasan per instansi: nama instansinya, daftar barisnya, dan totalnya. */
export type RekapInstansi = {
  idPengajuan: number;
  namaInstansi: string;
  daftar: BarisLaporan[];
  totalEmber: number;
  totalBeratKg: number;
};

/** Hasil query laporan bulanan: filter yang dipakai (bulan, instansi) dan rekapnya. */
export type HasilLaporanBulanan = {
  bulan: string;
  /** ID pengajuan yang difilter; null berarti semua instansi. */
  instansi: number | null;
  daftar: RekapInstansi[];
  totalEmber: number;
  totalBeratKg: number;
};

/** Satu pilihan dropdown instansi: pengajuan yang pernah punya kunjungan ditimbang. */
export type PilihanInstansi = {
  idPengajuan: number;
  namaInstansi: string;
};
