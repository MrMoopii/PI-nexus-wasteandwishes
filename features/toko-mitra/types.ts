import type { produk, tokoMitra } from "@/lib/db/schema";

// Bentuk data untuk tampilan. Nama kolom diambil dari skema (CONTRIBUTING 9.2),
// lalu kolom numeric diubah menjadi number. Kolom timestamp tetap Date.
// Produk dibaca dari tabelnya lewat lib/db/schema.ts, tidak dari features/toko/.
type BarisTokoMitra = typeof tokoMitra.$inferSelect;
type BarisProduk = typeof produk.$inferSelect;

/**
 * Satu toko mitra untuk halaman admin (3.4) dan /toko-terdekat (3.5).
 * latitude dan longitude dikembalikan Drizzle sebagai string, jadi query mengubahnya
 * dengan Number() sebelum dikirim ke komponen.
 */
export type TokoMitraTampilan = Omit<
  BarisTokoMitra,
  "latitude" | "longitude"
> & {
  latitude: number;
  longitude: number;
};

/**
 * Produk yang dijual di toko mitra (tabel produk_toko), untuk daftar centang admin
 * (3.4) dan daftar produk di /toko-terdekat (3.5). Tanpa stok, karena toko mitra
 * tidak punya stok.
 */
export type ProdukTokoTampilan = Pick<BarisProduk, "idProduk" | "namaProduk">;
