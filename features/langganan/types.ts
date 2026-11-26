import type { pengajuanLangganan, pesanNegosiasi } from "@/lib/db/schema";

/** Setiap daftar ditulis sekali, lalu tipenya diturunkan dari daftar itu.
    Daftar ini juga dipakai skema Zod: z.enum(STATUS_PENGAJUAN) (CONTRIBUTING 9.8).
*/

/**
 * Status pengajuan langganan, urut sesuai alur.
 * Harus sama dengan CHECK pengajuan_langganan_status_valid di lib/db/schema-langganan.ts.
 */
export const STATUS_PENGAJUAN = [
  "menunggu_review",
  "ditawarkan",
  "negosiasi",
  "disetujui_pelanggan",
  "siap_bayar",
  "ditolak",
  "dibatalkan",
] as const;

export type StatusPengajuan = (typeof STATUS_PENGAJUAN)[number];

/** Pemeriksa status dari database (bertipe string) tanpa "as". */
export function isStatusPengajuan(nilai: string): nilai is StatusPengajuan {
  return STATUS_PENGAJUAN.some((status) => status === nilai);
}

/** Label tampilan setiap status pengajuan, dipakai halaman pelanggan dan admin. */
export const LABEL_STATUS_PENGAJUAN: Record<StatusPengajuan, string> = {
  menunggu_review: "Menunggu review",
  ditawarkan: "Ditawarkan",
  negosiasi: "Negosiasi",
  disetujui_pelanggan: "Disetujui pelanggan",
  siap_bayar: "Siap bayar",
  ditolak: "Ditolak",
  dibatalkan: "Dibatalkan",
};

/** Jenis instansi pelanggan. 'lainnya' disertai jenis_instansi_lain yang diketik pelanggan. */
export const JENIS_INSTANSI = [
  "hotel",
  "restoran",
  "rumah_sakit",
  "umkm",
  "lainnya",
] as const;

export type JenisInstansi = (typeof JENIS_INSTANSI)[number];

/** Label tampilan setiap jenis instansi, untuk pilihan di form dan teks di halaman. */
export const LABEL_JENIS_INSTANSI: Record<JenisInstansi, string> = {
  hotel: "Hotel",
  restoran: "Restoran",
  rumah_sakit: "Rumah Sakit",
  umkm: "UMKM",
  lainnya: "Instansi Lain",
};

/** Pemeriksa jenis instansi dari database. */
export function isJenisInstansi(nilai: string): nilai is JenisInstansi {
  return JENIS_INSTANSI.some((jenis) => jenis === nilai);
}

/** Jenis pelanggan yang ditetapkan admin. Pelanggan MOU wajib punya rentang jam. */
export const JENIS_PELANGGAN = ["mou", "reguler"] as const;

export type JenisPelanggan = (typeof JENIS_PELANGGAN)[number];

/** Pemeriksa jenis pelanggan dari database. */
export function isJenisPelanggan(nilai: string): nilai is JenisPelanggan {
  return JENIS_PELANGGAN.some((jenis) => jenis === nilai);
}

/**
 * Pihak yang menulis pesan negosiasi atau menjalankan aksi pada pengajuan.
 * Harus sama dengan CHECK pesan_negosiasi_pengirim_valid di lib/db/schema-langganan.ts.
 */
export const PENGIRIM_PESAN = ["pelanggan", "admin"] as const;

export type PengirimPesan = (typeof PENGIRIM_PESAN)[number];

/** Pemeriksa pengirim pesan dari database. */
export function isPengirimPesan(nilai: string): nilai is PengirimPesan {
  return PENGIRIM_PESAN.some((pengirim) => pengirim === nilai);
}

// Bentuk data untuk tampilan. Nama kolom diambil dari skema (CONTRIBUTING 9.2),
// lalu kolom status/pilihan diganti tipe sempitnya dan kolom numeric menjadi number.
type BarisPengajuan = typeof pengajuanLangganan.$inferSelect;
type BarisPesan = typeof pesanNegosiasi.$inferSelect;

/** Satu baris di daftar pengajuan (halaman pelanggan dan daftar admin). */
export type RingkasanPengajuan = Pick<
  BarisPengajuan,
  "idPengajuan" | "namaInstansi" | "dibuatPada" | "diperbaruiPada"
> & {
  jenisInstansi: JenisInstansi;
  status: StatusPengajuan;
  hargaFinal: number | null;
};

/** Isi lengkap satu pengajuan untuk halaman detail. Tanpa id_user (CONTRIBUTING 7.2 no. 7). */
export type DetailPengajuan = Omit<
  BarisPengajuan,
  "idUser" | "jenisInstansi" | "jenisPelanggan" | "hargaFinal" | "status"
> & {
  jenisInstansi: JenisInstansi;
  jenisPelanggan: JenisPelanggan | null;
  hargaFinal: number | null;
  status: StatusPengajuan;
};

/** Satu pesan di riwayat negosiasi. Tanpa id_pengirim karena tampilan cukup tahu pihaknya. */
export type PesanNegosiasiTampilan = Pick<
  BarisPesan,
  "idPesan" | "pesan" | "dibuatPada"
> & {
  pengirim: PengirimPesan;
  hargaUsulan: number | null;
};
