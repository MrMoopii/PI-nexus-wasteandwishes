import type {
  detailTransaksi,
  permintaanProduk,
  produk,
  transaksi,
} from "@/lib/db/schema";

/** Setiap daftar ditulis sekali, lalu tipenya diturunkan dari daftar itu.
    Daftar ini juga dipakai skema Zod: z.enum(STATUS_PERMINTAAN) (CONTRIBUTING 9.8).
    Setiap daftar HARUS sama dengan CHECK-nya di lib/db/schema-toko.ts.
*/

/**
 * Cara membeli produk: lewat keranjang dan checkout (3.8), atau form permintaan (3.6).
 * Harus sama dengan CHECK produk_cara_beli_valid.
 */
export const CARA_BELI = ["keranjang", "permintaan"] as const;

export type CaraBeli = (typeof CARA_BELI)[number];

/** Pemeriksa cara beli dari database (bertipe string) tanpa "as". */
export function isCaraBeli(nilai: string): nilai is CaraBeli {
  return CARA_BELI.some((cara) => cara === nilai);
}

/** Label tampilan setiap cara beli, untuk pilihan di form admin produk. */
export const LABEL_CARA_BELI: Record<CaraBeli, string> = {
  keranjang: "Keranjang",
  permintaan: "Permintaan",
};

/**
 * Status pesanan toko online, urut sesuai alur.
 * Harus sama dengan CHECK transaksi_status_valid.
 */
export const STATUS_TRANSAKSI = [
  "menunggu_bayar",
  "dibayar",
  "selesai",
  "kedaluwarsa",
  "dibatalkan",
] as const;

export type StatusTransaksi = (typeof STATUS_TRANSAKSI)[number];

/** Pemeriksa status transaksi dari database. */
export function isStatusTransaksi(nilai: string): nilai is StatusTransaksi {
  return STATUS_TRANSAKSI.some((status) => status === nilai);
}

/** Label tampilan setiap status transaksi, untuk riwayat pesanan dan halaman admin. */
export const LABEL_STATUS_TRANSAKSI: Record<StatusTransaksi, string> = {
  menunggu_bayar: "Menunggu pembayaran",
  dibayar: "Dibayar",
  selesai: "Selesai",
  kedaluwarsa: "Kedaluwarsa",
  dibatalkan: "Dibatalkan",
};

/**
 * Status permintaan produk by request, urut sesuai alur.
 * Harus sama dengan CHECK permintaan_produk_status_valid.
 */
export const STATUS_PERMINTAAN = [
  "baru",
  "diproses",
  "selesai",
  "dibatalkan",
] as const;

export type StatusPermintaan = (typeof STATUS_PERMINTAAN)[number];

/** Pemeriksa status permintaan dari database. */
export function isStatusPermintaan(nilai: string): nilai is StatusPermintaan {
  return STATUS_PERMINTAAN.some((status) => status === nilai);
}

/** Label tampilan setiap status permintaan, untuk halaman pelanggan dan admin. */
export const LABEL_STATUS_PERMINTAAN: Record<StatusPermintaan, string> = {
  baru: "Baru",
  diproses: "Diproses",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

// Bentuk data untuk tampilan. Nama kolom diambil dari skema (CONTRIBUTING 9.2),
// lalu kolom status/pilihan diganti tipe sempitnya dan kolom numeric menjadi number.
// Kolom timestamp tetap Date.
type BarisProduk = typeof produk.$inferSelect;
type BarisTransaksi = typeof transaksi.$inferSelect;
type BarisDetailTransaksi = typeof detailTransaksi.$inferSelect;
type BarisPermintaan = typeof permintaanProduk.$inferSelect;

/** Satu produk untuk etalase, detail produk, keranjang, dan checkout. */
export type ProdukTampilan = Omit<BarisProduk, "hargaProduk" | "caraBeli"> & {
  hargaProduk: number;
  caraBeli: CaraBeli;
};

/**
 * Satu pesanan untuk riwayat pelanggan dan daftar admin (3.9).
 * Tanpa id_user (CONTRIBUTING 7.2 no. 7).
 */
export type TransaksiTampilan = Omit<
  BarisTransaksi,
  "userId" | "status" | "totalHarga"
> & {
  status: StatusTransaksi;
  totalHarga: number;
};

/** Satu baris isi pesanan. hargaBeli adalah harga satuan saat checkout. */
export type DetailTransaksiTampilan = Omit<
  BarisDetailTransaksi,
  "hargaBeli"
> & {
  hargaBeli: number;
};

/**
 * Satu permintaan produk untuk riwayat pelanggan dan halaman admin (3.7).
 * Tanpa id_user (CONTRIBUTING 7.2 no. 7).
 */
export type PermintaanProdukTampilan = Omit<
  BarisPermintaan,
  "idUser" | "status" | "jumlahKg"
> & {
  status: StatusPermintaan;
  jumlahKg: number;
};
