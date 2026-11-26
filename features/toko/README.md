# features/toko

Toko online WW. Produk dibeli dengan dua cara: lewat keranjang lalu checkout dan pembayaran Midtrans, atau lewat form permintaan (produk by request) tanpa pembayaran online. Pelanggan dan admin melihat riwayat pesanan dan permintaan. Ongkir dan pengiriman diatur WW di luar sistem.

## Peta file

Kode tugas mengikuti issue Tahap 3. Satu file dipegang pemilik kode tugasnya (`CONTRIBUTING.md` bagian 4.3).

| File                                                   | Isi                                                                                                                                                                          | Kode tugas |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `types.ts`                                             | `CARA_BELI`, `STATUS_TRANSAKSI`, dan `STATUS_PERMINTAAN` dengan tipe, `is…()`, dan `LABEL_…`; tipe tampilan per tabel                                                        | 3.1        |
| `actions/permintaan.ts`                                | Pelanggan mengajukan permintaan produk (3.6) dan membatalkannya selama status masih `baru` (3.7)                                                                             | 3.6, 3.7   |
| `validasi/permintaan.ts`                               | Skema Zod form permintaan: jumlah kg, nama dan telepon PIC, alamat, catatan (3.6), serta pembatalan oleh pelanggan (3.7)                                                     | 3.6, 3.7   |
| `queries/permintaan.ts`                                | Riwayat permintaan milik pelanggan, serta daftar dan detail permintaan untuk admin dengan filter status                                                                      | 3.7        |
| `actions/admin-permintaan.ts`                          | Admin mengubah status permintaan beserta catatan admin                                                                                                                       | 3.7        |
| `validasi/admin-permintaan.ts`                         | Skema Zod ubah status, catatan admin, filter status, dan ID permintaan di halaman admin                                                                                      | 3.7        |
| `actions/checkout.ts`                                  | Checkout dalam satu perintah SQL: transaksi, detail dengan `harga_beli`, pengurangan stok, pengosongan keranjang, dan `pembayaran_toko`. Lalu membuat transaksi Midtrans     | 3.8        |
| `validasi/checkout.ts`                                 | Skema Zod form penerima: nama, telepon, alamat, catatan                                                                                                                      | 3.8        |
| `queries/pesanan.ts`                                   | Riwayat pesanan milik pelanggan dan daftar pesanan admin dengan filter status                                                                                                | 3.9        |
| `validasi/pesanan.ts`                                  | Skema Zod filter status dan ID pesanan dari URL                                                                                                                              | 3.9        |
| `actions/admin-pesanan.ts`                             | Admin menandai pesanan `dibayar` sebagai `selesai`                                                                                                                           | 3.9        |
| `validasi/admin-pesanan.ts`                            | Skema Zod aksi tandai selesai                                                                                                                                                | 3.9        |
| `app/admin/produk/`                                    | Isian "Cara beli" di form admin produk. Form-nya ada di `components/admin/ProdukForm.tsx`                                                                                    | 3.6        |
| `app/toko/etalase-produk.tsx`, `app/toko/detail/[id]/` | Produk `permintaan` menampilkan tombol "Ajukan permintaan", bukan tombol keranjang. Form permintaan ada di detail produk                                                     | 3.6        |
| `app/toko/keranjang/actions.ts`                        | `tambahKeKeranjang()` menolak produk `permintaan` di server                                                                                                                  | 3.6        |
| `app/admin/permintaan-produk/`, `app/toko/permintaan/` | Halaman admin permintaan produk dan riwayat permintaan pelanggan                                                                                                             | 3.7        |
| `app/toko/checkout/`                                   | Halaman checkout: ringkasan keranjang dengan harga terkini, form penerima, tombol Bayar                                                                                      | 3.8        |
| `app/toko/keranjang/keranjang-client.tsx`              | Tombol Checkout diaktifkan dan mengarah ke `/toko/checkout`                                                                                                                  | 3.8        |
| `app/api/midtrans/notification/route.ts`               | Cabang baru untuk `pembayaran_toko`. Kontraknya di `docs/api/midtrans.md`                                                                                                    | 3.8        |
| `app/toko/pesanan/`, `app/admin/pesanan-toko/`         | Riwayat pesanan pelanggan dan daftar pesanan admin                                                                                                                           | 3.9        |

`types.ts` berisi `CARA_BELI`, `STATUS_TRANSAKSI`, dan `STATUS_PERMINTAAN`, masing-masing dengan tipe, `LABEL_…`, dan pemeriksa `is…()` tanpa `as`. Tipe tampilannya `ProdukTampilan`, `TransaksiTampilan`, `DetailTransaksiTampilan`, dan `PermintaanProdukTampilan`, diturunkan dari skema: kolom `numeric` menjadi `number`, kolom status dan cara beli menjadi tipe sempitnya, dan `id_user` tidak ikut.

Menu Permintaan Produk dan Pesanan Toko di `app/admin/AdminNav.tsx` ditambahkan 3.10. Skema Zod untuk input lain ditaruh di `validasi/<nama>.ts` yang namanya sama dengan file `actions/` atau `queries/` pemakainya (`CONTRIBUTING.md` bagian 9.8).

## Tabel

Didefinisikan di `lib/db/schema-toko.ts` (3.1) dan diekspor ulang dari `lib/db/schema.ts`, jadi impor tetap dari `@/lib/db/schema`. `toko_mitra` dan `produk_toko` ada di file yang sama dan dijelaskan di `features/toko-mitra/README.md`. Tabel hanya diubah pemilik skema, sesuai `CONTRIBUTING.md` bagian 6.3. Nama constraint di bawah muncul di pesan error Postgres saat isian ditolak.

| Tabel                           | Aturan yang dijaga database                                                                                                                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `produk`                        | `cara_beli` berisi `keranjang` (bawaan) atau `permintaan` (`produk_cara_beli_valid`). `jumlah_stok` tidak boleh negatif (`produk_jumlah_stok_tidak_negatif`).                                                                                     |
| `foto_produk`                   | Tidak berubah. Ikut terhapus saat produknya dihapus.                                                                                                                                                                                              |
| `keranjang`, `detail_keranjang` | Satu keranjang per akun. Isi keranjang ikut terhapus saat produknya dihapus (`ON DELETE CASCADE` di `detail_keranjang_produk_id_produk_id_produk_fkey`, sejak 3.1).                                                                               |
| `transaksi`                     | `status` berisi `menunggu_bayar` (bawaan), `dibayar`, `selesai`, `kedaluwarsa`, atau `dibatalkan` (`transaksi_status_valid`). `total_harga`, `nama_penerima`, `telp_penerima`, `alamat_pengiriman`, dan kolom lama `metode_pembayaran` wajib. `catatan` boleh kosong. |
| `detail_transaksi`              | `harga_beli` wajib. Satu baris per produk per transaksi (`detail_transaksi_transaksi_produk_unique`).                                                                                                                                             |
| `pembayaran_toko`               | `order_id` unik (`pembayaran_toko_order_id_key`). `transaksi_id`, `jumlah`, `status_pembayaran`, dan `tanggal_kedaluwarsa` wajib. Tanpa CHECK dan tanpa nilai bawaan untuk `status_pembayaran`, sama dengan `pembayaran_event`.                  |
| `permintaan_produk`             | `status` berisi `baru` (bawaan), `diproses`, `selesai`, atau `dibatalkan` (`permintaan_produk_status_valid`). `jumlah_kg` lebih dari 0 (`permintaan_produk_jumlah_kg_positif`), `numeric(10,2)`. `nama_pic`, `telp_pic`, dan `alamat_pengiriman` wajib; `catatan` dan `catatan_admin` boleh kosong. |

Cara memakainya:

- Daftar cara beli dan status di `types.ts` harus sama dengan CHECK di skema. Mengubahnya berarti migrasi baru lewat pemilik skema.
- Kolom `numeric` (`harga_produk`, `total_harga`, `harga_beli`, `jumlah`, `jumlah_kg`) dikembalikan Drizzle sebagai string. Ubah dengan `Number(...)` (`CONTRIBUTING.md` bagian 9.2).
- `total_harga`, `harga_beli`, dan `pembayaran_toko.jumlah` dihitung di server dari harga di database, tidak pernah dari form (`CONTRIBUTING.md` bagian 9.7).
- Checkout mengurangi stok di perintah SQL yang sama dengan pembuatan transaksi. Stok yang kurang membuat `produk_jumlah_stok_tidak_negatif` menggagalkan seluruh perintah dengan kode `23514`. Kode itu juga dipakai CHECK lain, jadi tampilkan "Stok tidak cukup" hanya jika nama constraint di error sama dengan `produk_jumlah_stok_tidak_negatif`. Drizzle membungkus error driver dalam `DrizzleQueryError`, jadi `code` dan `constraint` ada di `error.cause`. Contoh membacanya ada di `readNestedErrorValue()` di `app/event/actions.ts`, tetapi fungsi itu memakai `as`, jadi tulis ulang tanpa `as` (`CONTRIBUTING.md` bagian 9.1).
- `metode_pembayaran` adalah kolom lama yang wajib diisi tanpa nilai bawaan, jadi checkout harus mengisinya sendiri.
- `pembayaran_toko.order_id` hanya unik di tabel ini. Webhook mencari `order_id` di beberapa tabel pembayaran, jadi awalannya harus berbeda dari `event-` dan `lang-` yang sudah dipakai.
- Stok dikembalikan saat pembayaran kedaluwarsa atau dibatalkan hanya jika status masih `menunggu_bayar` (`UPDATE … WHERE status = 'menunggu_bayar'`), supaya notifikasi ganda tidak mengembalikan stok dua kali.
- `permintaan_produk.diperbarui_pada` tidak diisi otomatis. Setiap `UPDATE` wajib menulis `diperbarui_pada = now()` sendiri. Perubahan status memakai satu `UPDATE … WHERE status IN (…) RETURNING` (`CONTRIBUTING.md` bagian 6.2).
- `jumlah_kg` dengan lebih dari dua angka di belakang koma dibulatkan Postgres, bukan ditolak. Isian `0.004` menjadi `0.00` lalu ditolak CHECK. Batas dua desimal tetap dicek skema Zod (3.6).
- Database tidak memeriksa apakah produk yang diminta aktif dan ber-`cara_beli = 'permintaan'`, atau apakah produk di keranjang ber-`cara_beli = 'keranjang'`. Keduanya dicek Server Action (3.6, 3.8).
- Menghapus produk ikut menghapus foto, isi keranjang, dan baris `produk_toko`-nya. Produk yang sudah punya permintaan atau transaksi tidak bisa dihapus, karena `permintaan_produk` dan `detail_transaksi` merujuk `produk` tanpa cascade supaya riwayatnya tetap ada. `DELETE` produk seperti itu gagal dengan kode `23503`.

## Yang dipakai dari luar fitur ini

- `requireLogin()` dan `requireAdmin()` dari `lib/`.
- `getMidtransSnap()` dari `lib/midtrans.ts`. Alur pembayarannya mengikuti pola `features/langganan/actions/pembayaran.ts` (order ID, verifikasi ke Midtrans, `gross_amount`), tanpa mengimpor dari fitur itu.
- `formatRupiah()` dari `lib/format-angka.ts` dan `GambarProduk` dari `components/GambarProduk.tsx`.
- Komponen umum dari `components/ui/`.

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

Belum ada.
