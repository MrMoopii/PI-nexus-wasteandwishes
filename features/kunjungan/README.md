# features/kunjungan

Kunjungan pengambilan sampah per pelanggan per tanggal: pembuatan jadwal dari pola hari dan hari libur, pencatatan ember dan berat oleh admin, tracker untuk pelanggan, serta laporan kendala dua arah.

## Peta file

File dipisah per proses supaya setiap pemilik kode tugas memegang file sendiri (`CONTRIBUTING.md` bagian 4.3).

| File                           | Isi                                                                                    | Kode tugas |
| ------------------------------ | -------------------------------------------------------------------------------------- | ---------- |
| `types.ts`                     | Daftar status, jenis, dan aturan (label dan `is…()`), tipe tampilan per tabel          | 2.1        |
| `jadwal.ts`                    | Fungsi murni: tanggal kunjungan dari pola hari, aturan hari libur (`geser` / `lewati`) | 2.2        |
| `queries/hari-libur.ts`        | Daftar hari libur                                                                      | 2.2        |
| `actions/jadwal.ts`            | Buat kunjungan untuk rentang tanggal, kelola hari libur                                | 2.2        |
| `validasi/jadwal.ts`           | Skema Zod rentang tanggal dan isian hari libur                                         | 2.2        |
| `queries/admin.ts`             | Daftar kunjungan per tanggal untuk pencatatan                                          | 2.3        |
| `actions/pencatatan.ts`        | Catat ember dan foto, catat berat (kg), tandai tertunda dengan tanggal paling lambat   | 2.3        |
| `validasi/pencatatan.ts`       | Skema Zod jumlah ember, berat (kg), dan tanggal paling lambat                          | 2.3        |
| `queries/pelanggan.ts`         | Status hari ini, jadwal berikutnya, riwayat, total ember dan kg milik pelanggan        | 2.4        |
| `actions/lapor-kendala.ts`     | Pelanggan melaporkan kendala                                                           | 2.4        |
| `validasi/lapor-kendala.ts`    | Skema Zod isi laporan kendala                                                          | 2.4        |
| `components/`                  | Komponen tracker (hanya menerima props)                                                | 2.4        |
| `queries/kendala.ts`           | Daftar laporan kendala yang masih terbuka                                              | 2.6        |
| `actions/tanggapi-kendala.ts`  | Admin menanggapi laporan kendala                                                       | 2.6        |
| `validasi/tanggapi-kendala.ts` | Skema Zod tanggapan admin                                                              | 2.6        |
| `app/admin/hari-libur/`        | Halaman admin hari libur                                                               | 2.2        |
| `app/admin/kunjungan/`         | Halaman admin pencatatan harian                                                        | 2.3        |
| `app/tracker/`                 | Halaman tracker pelanggan                                                              | 2.4        |
| `app/admin/kendala/`           | Halaman admin laporan kendala                                                          | 2.6        |

`types.ts` berisi `STATUS_KUNJUNGAN`, `JENIS_LAPORAN`, `STATUS_LAPORAN`, dan `ATURAN_HARI_LIBUR`, masing-masing dengan tipe, `LABEL_…`, dan pemeriksa `is…()` tanpa `as`. Tipe tampilannya `KunjunganTampilan`, `LaporanKendalaTampilan`, `HariLiburTampilan`, dan `PerubahanJadwalTampilan`, diturunkan dari skema (kolom `numeric` menjadi `number`, `id_user` tidak ikut).

## Tabel

Didefinisikan di `lib/db/schema-kunjungan.ts` (2.1) dan diekspor ulang dari `lib/db/schema.ts`, jadi impor tetap dari `@/lib/db/schema`. Tabel hanya diubah pemilik skema, sesuai `CONTRIBUTING.md` bagian 6.3. Nama constraint di bawah muncul di pesan error Postgres saat isian ditolak.

| Tabel                   | Aturan yang dijaga database                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hari_libur`            | Satu baris per `tanggal` (`hari_libur_tanggal_unique`). `aturan` `geser` (bawaan) atau `lewati`.                                                                                                                                                                                                                                                                                                                                |
| `kunjungan_pengambilan` | Satu baris per pelanggan per `tanggal` (`kunjungan_pengambilan_user_tanggal_unique`), termasuk baris `batal` dan `dilewati`. `pengajuan_id` wajib dan harus milik pelanggan yang sama (`kunjungan_pengambilan_pengajuan_user_fkey`). `tanggal` hanya Senin–Jumat. Jam kosong keduanya, atau terisi keduanya dengan jam mulai lebih awal. `jumlah_ember` dan `berat_kg` tidak negatif. Syarat lain ada di daftar di bawah tabel. |
| `laporan_kendala`       | `jenis` `kendala` atau `lewati`. `status` `menunggu` (bawaan) atau `ditanggapi`. `pesan` wajib dan tidak boleh kosong. `tanggal_pengganti` hanya untuk `lewati`. Kunjungan yang dilaporkan harus milik pelapor (`laporan_kendala_kunjungan_user_fkey`).                                                                                                                                                                         |
| `perubahan_jadwal`      | `hari_pengambilan` minimal satu hari, setiap hari 1–5. Rentang jam seperti kunjungan. `berlaku_mulai`, `alasan`, dan `diubah_oleh` wajib.                                                                                                                                                                                                                                                                                       |

Syarat lain di `kunjungan_pengambilan`:

- `tertunda`: `alasan_kendala` dan `tanggal_paling_lambat` wajib terisi. `tanggal_paling_lambat` tidak boleh sebelum `tanggal`.
- `diambil` dan `ditimbang`: `jumlah_ember` wajib terisi.
- `ditimbang`: `berat_kg` dan `ditimbang_pada` wajib terisi.
- `foto_bukti` dan `foto_bukti_file_id` diisi atau dikosongkan bersama (`kunjungan_pengambilan_foto_berpasangan`).

Cara memakainya:

- `pengajuan_id` menunjuk kesepakatan yang berlaku, yaitu pengajuan `siap_bayar` milik pelanggan: pola hari, jam, jumlah ember, instansi, dan harga. Keadaan aktif tidak disimpan di kunjungan, tetapi dibaca dari `data_langganan` lewat `kondisiLanggananAktif()` dan digabung lewat `id_user` (satu baris `data_langganan` per pelanggan).
- Daftar status, jenis, dan aturan di `types.ts` harus sama dengan CHECK di skema. Mengubahnya berarti migrasi baru lewat pemilik skema.
- Unique (`id_user`, `tanggal`) berlaku untuk semua status. Membuat ulang kunjungan dari pola atau hari libur memperbarui baris yang sudah ada, misalnya `INSERT … ON CONFLICT (id_user, tanggal) DO UPDATE … WHERE kunjungan_pengambilan.status IN (…)`, bukan menyisipkan baris kedua.
- Lewati dengan tanggal pengganti: kunjungan asal menjadi `dilewati`, dan usulan pelanggan disimpan di `laporan_kendala.tanggal_pengganti`. Tanggal yang disetujui admin, yang boleh berbeda dari usulan, menjadi kunjungan baru dengan `pengganti_dari` berisi id kunjungan asal. Kunjungan asal harus milik pelanggan yang sama (`kunjungan_pengambilan_pengganti_dari_fkey`).
- `foto_bukti_file_id` disimpan bersama `foto_bukti`, karena `deleteImageKitFile()` di `lib/imagekit.ts` butuh fileId saat foto diganti atau dihapus. Mengganti foto berarti menulis keduanya di `UPDATE` yang sama, dan menghapus foto berarti mengosongkan keduanya.
- `berat_kg` adalah kolom `numeric`, jadi Drizzle mengembalikannya sebagai string. Ubah dengan `Number(...)` (`CONTRIBUTING.md` bagian 9.2).
- Tabel ini tidak punya `diperbarui_pada`.
- Data lama di `riwayat_pengambilan` tidak dipindahkan (keputusan 2.1, tabel lama kosong). Tracker dan laporan hanya membaca `kunjungan_pengambilan`.

## Yang dipakai dari luar fitur ini

- `kondisiLanggananAktif()` dari `lib/langganan.ts`: tracker hanya untuk pelanggan yang langganannya aktif.
- `tanggalHariIniJakarta()` dan fungsi format dari `lib/format-tanggal.ts`.
- Data pola hari dan rentang jam pelanggan dibaca langsung dari tabelnya lewat `lib/db/schema.ts`, bukan dengan mengimpor dari `features/langganan/`.

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

Belum ada.
