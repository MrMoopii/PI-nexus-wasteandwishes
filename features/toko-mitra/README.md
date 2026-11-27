# features/toko-mitra

Toko mitra yang menjual produk WW: dikelola admin, lalu ditampilkan ke pengunjung tanpa login di `/toko-terdekat`, diurutkan dari yang terdekat dengan lokasi browser.

## Peta file

Kode tugas mengikuti issue Tahap 3. Satu file dipegang pemilik kode tugasnya (`CONTRIBUTING.md` bagian 4.3).

| File                    | Isi                                                                                                                                   | Kode tugas |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `types.ts`              | Tipe tampilan `TokoMitraTampilan` (latitude dan longitude berupa `number`) dan `ProdukTokoTampilan`                                  | 3.1        |
| `queries/admin.ts`      | Daftar dan detail toko untuk admin, serta produk aktif untuk daftar centang                                                           | 3.4        |
| `actions/admin.ts`      | Tambah dan ubah toko, nonaktifkan toko, dan simpan daftar produk yang dijual dalam satu perintah SQL                                  | 3.4        |
| `validasi/admin.ts`     | Skema Zod isian toko. Koordinat ditempel sebagai satu isian dari Google Maps (`-7.7829, 110.3671`), lalu dipecah dan dicek rentangnya | 3.4        |
| `queries/publik.ts`     | Toko aktif beserta produk yang dijual. Latitude dan longitude diubah dengan `Number()` sebelum dikirim ke komponen                    | 3.5        |
| `jarak.ts`              | Fungsi murni Haversine: jarak (km) dari lokasi browser ke toko                                                                        | 3.5        |
| `app/admin/toko-mitra/` | Halaman admin: daftar toko, tambah dan ubah toko, centang produk yang dijual                                                          | 3.4        |
| `app/toko-terdekat/`    | Halaman publik: daftar toko, tombol "Gunakan lokasi saya" dan "Buka di Google Maps"                                                   | 3.5        |

Lokasi browser dibaca lewat `hooks/use-lokasi-browser.ts` (3.5), yang dicatat di `hooks/README.md`. Menu Toko Mitra di `app/admin/AdminNav.tsx` ditambahkan 3.10.

Skema Zod untuk input lain ditaruh di `validasi/<nama>.ts` yang namanya sama dengan file `actions/` atau `queries/` pemakainya (`CONTRIBUTING.md` bagian 9.8).

## Tabel

Didefinisikan di `lib/db/schema-toko.ts` (3.1) bersama tabel toko online, lalu diekspor ulang dari `lib/db/schema.ts`, jadi impor tetap dari `@/lib/db/schema`. Tabel hanya diubah pemilik skema, sesuai `CONTRIBUTING.md` bagian 6.3. Nama constraint di bawah muncul di pesan error Postgres saat isian ditolak.

| Tabel         | Aturan yang dijaga database                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `toko_mitra`  | `nama_toko`, `alamat`, `latitude`, dan `longitude` wajib. `latitude` −90 sampai 90 (`toko_mitra_latitude_valid`) dan `longitude` −180 sampai 180 (`toko_mitra_longitude_valid`), keduanya `numeric(9,6)`. `aktif` bawaan `true`. `jam_buka` (teks bebas) dan `kontak` boleh kosong. |
| `produk_toko` | Satu baris per pasangan toko dan produk (kunci gabungan `produk_toko_pkey`). Baris ikut terhapus jika tokonya atau produknya dihapus (`ON DELETE CASCADE` di kedua foreign key).                                           |

Cara memakainya:

- Toko mitra tidak punya stok, dan lokasi pengunjung tidak disimpan di database.
- `latitude` dan `longitude` dikembalikan Drizzle sebagai string. Ubah dengan `Number(...)` di query (`CONTRIBUTING.md` bagian 9.2).
- Angka di belakang koma yang lebih dari enam digit dibulatkan Postgres, bukan ditolak. Angka dengan lebih dari tiga digit di depan koma ditolak dengan `numeric field overflow` (kode `22003`), bukan oleh CHECK. Karena itu rentang dan format tetap dicek skema Zod (3.4).
- Toko dinonaktifkan dengan `aktif = false`, tidak dihapus. Query publik hanya membaca toko yang `aktif`.
- Daftar produk sebuah toko disimpan dalam satu perintah: `WITH hapus AS (DELETE … WHERE produk_id <> ALL(…)) INSERT … ON CONFLICT DO NOTHING` (`CONTRIBUTING.md` bagian 6.2). Kunci gabungan mencegah baris ganda.
- Produk dibaca dari tabelnya lewat `lib/db/schema.ts`, tidak dengan mengimpor dari `features/toko/`.

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

Belum ada.
