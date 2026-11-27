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

/** Hasil query laporan bulanan untuk satu bulan: bulan yang dipakai dan rekannya. */
export type HasilLaporanBulanan = {
  bulan: string;
  daftar: RekapInstansi[];
  totalEmber: number;
  totalBeratKg: number;
};
