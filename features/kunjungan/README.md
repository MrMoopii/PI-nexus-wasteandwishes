# features/kunjungan

Kunjungan pengambilan sampah per pelanggan per tanggal: pembuatan jadwal dari pola hari dan hari libur, pencatatan ember dan berat oleh admin, tracker untuk pelanggan, serta laporan kendala dua arah.

## Peta file

File dipisah per proses supaya setiap pemilik kode tugas memegang file sendiri (`CONTRIBUTING.md` bagian 4.3).

| File                           | Isi                                                                                    | Kode tugas |
| ------------------------------ | -------------------------------------------------------------------------------------- | ---------- |
| `types.ts`                     | Daftar status, jenis, dan aturan (label dan `is…()`), tipe tampilan per tabel          | 2.1        |
| `jadwal.ts`                    | Fungsi murni: tanggal kunjungan, aturan hari libur, batas minta lewati (lihat bawah)   | 2.2        |
| `queries/hari-libur.ts`        | `getDaftarHariLibur()`: hari libur mulai hari ini, urut naik. Hanya admin              | 2.2        |
| `actions/jadwal.ts`            | `buatKunjungan()`: kunjungan satu rentang dari pola pelanggan aktif dan hari libur     | 2.2        |
| `validasi/jadwal.ts`           | `skemaRentangKunjungan`, `tanggalWajib()`, `teksIsian()`, `NilaiIsian`, `GalatIsian`   | 2.2        |
| `actions/hari-libur.ts`        | `tambahHariLibur()`, `ubahHariLibur()`, `hapusHariLibur()`                             | 2.2        |
| `validasi/hari-libur.ts`       | `skemaHariLibur` (tanggal, keterangan, aturan) dan `skemaIdHariLibur`                  | 2.2        |
| `queries/jadwal-pelanggan.ts`  | `getPelangganPolaAktif()`: pelanggan aktif dengan pengajuan siap_bayar dan polanya. Hanya admin | 2.7 |
| `actions/ubah-pola.ts`         | `ubahPolaJadwal()`: catat perubahan, perbarui pola, batalkan dan buat ulang kunjungan | 2.7        |
| `validasi/ubah-pola.ts`        | `skemaUbahPola`, `IsianUbahPola`, `NilaiIsianUbahPola`, `GalatIsianUbahPola`            | 2.7        |
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
| `app/admin/hari-libur/`        | Halaman admin hari libur: tambah, daftar mendatang, ubah, hapus                        | 2.2        |
| `app/admin/buat-kunjungan/`    | Halaman admin buat kunjungan: form rentang, ringkasan hasil, hari libur dihitung       | 2.2        |
| `app/admin/jadwal-pelanggan/`  | Halaman admin ubah pola jadwal tetap pelanggan aktif                                   | 2.7        |
| `app/admin/kunjungan/`         | Halaman admin pencatatan harian                                                        | 2.3        |
| `app/tracker/`                 | Halaman tracker pelanggan                                                              | 2.4        |
| `app/admin/kendala/`           | Halaman admin laporan kendala                                                          | 2.6        |

`types.ts` berisi `STATUS_KUNJUNGAN`, `JENIS_LAPORAN`, `STATUS_LAPORAN`, dan `ATURAN_HARI_LIBUR`, masing-masing dengan tipe, `LABEL_…`, dan pemeriksa `is…()` tanpa `as`. Tipe tampilannya `KunjunganTampilan`, `LaporanKendalaTampilan`, `HariLiburTampilan`, dan `PerubahanJadwalTampilan`, diturunkan dari skema (kolom `numeric` menjadi `number`, `id_user` tidak ikut).

## Jadwal dan hari libur (2.2)

### Fungsi di `jadwal.ts`

Fungsi murni tanpa database dan sesi, jadi bisa dipakai di server maupun klien. Semua tanggal berupa teks `"YYYY-MM-DD"` (nilai kolom `date` dari Drizzle) dan dihitung di UTC, sehingga tidak bergeser antara laptop (WIB) dan Vercel (UTC).

- `type PetaHariLibur = ReadonlyMap<string, AturanHariLibur>`: tanggal libur beserta aturannya, dibaca dari tabel `hari_libur`.
- `tanggalKunjungan({ hariPengambilan, mulai, selesai, hariLibur }): string[]`: tanggal kunjungan satu pelanggan dari pola hari (`readonly number[]`, 1 = Senin sampai 5 = Jumat) untuk rentang `mulai`–`selesai` (keduanya ikut).
  - Libur `geser` pindah ke `hariKerjaBerikutnya()`, boleh jatuh setelah `selesai`.
  - Libur `lewati` tidak menghasilkan kunjungan.
  - Hasil geser yang jatuh di hari jadwal pelanggan menjadi satu kunjungan saja.
  - Hasilnya urut dan tanpa tanggal ganda. Dipakai `buatKunjungan()`, dan oleh 2.7 untuk membuat ulang kunjungan dari pola baru mulai `berlaku_mulai`.
- `hariKerjaBerikutnya(tanggal, hariLibur): string`: hari kerja pertama setelah `tanggal` yang bukan hari libur, apa pun aturan liburnya.
- `isHariKerja(tanggal): boolean`: Senin sampai Jumat. Bisa dipakai 2.4 dan 2.6 untuk memeriksa tanggal pengganti.
- `tambahHari(tanggal, jumlah): string`: tanggal ditambah sejumlah hari kalender, boleh negatif.
- `batasMintaLewati(tanggalKunjungan): Date`: batas meminta lewati, yaitu `<H-1>T17:00:00+07:00`, untuk ditampilkan tracker (2.4).
- `bolehMintaLewati(tanggalKunjungan, sekarang: Date): boolean`: `true` jika `sekarang` masih sebelum batas. Kunjungan Senin: Minggu 16.59 WIB boleh, Minggu 17.00 WIB tidak. Status kunjungan (misalnya hanya `dijadwalkan`) dicek pemanggil (2.4).

### Buat kunjungan

`buatKunjungan()` di `actions/jadwal.ts` dipanggil dari `/admin/buat-kunjungan`:

1. Rentang divalidasi `skemaRentangKunjungan`: mulai tidak sebelum hari ini (WIB), selesai tidak sebelum mulai, paling panjang `PANJANG_RENTANG_MAKS` (31) hari.
2. Pelanggan diambil dari `data_langganan` yang aktif (`kondisiLanggananAktif()`), digabung dengan pengajuan `siap_bayar` miliknya. Pelanggan aktif tanpa pengajuan `siap_bayar` atau tanpa pola hari dilewati, lalu jumlahnya dilaporkan di hasil (`tanpaPola`).
3. Tanggal dihitung dengan `tanggalKunjungan()`. Jam diambil dari pengajuan, jadi rentang jam MOU ikut berlaku di hari pengganti. Tanggal setelah `tanggal_akhir_langganan` tidak dibuat; setelah langganan diperpanjang, admin menjalankan aksi ini lagi.
4. Baris disisipkan per 500 dengan `ON CONFLICT (id_user, tanggal) DO NOTHING`, jadi aksi aman dijalankan ulang.

Keputusan 2.2: kunjungan yang sudah ada tidak diubah, apa pun statusnya, termasuk saat hari libur ditambah, diubah, atau dihapus setelah kunjungan dibuat. Karena itu kedua halaman admin meminta hari libur diisi sebelum membuat kunjungan, dan `/admin/buat-kunjungan` menampilkan hari libur yang akan dihitung.

### Hari libur

`/admin/hari-libur` memakai `tambahHariLibur()`, `ubahHariLibur()`, dan `hapusHariLibur()` di `actions/hari-libur.ts`. Tanggal libur harus hari kerja dan tidak sebelum hari ini. Aturan bawaan `geser` masih usulan dan belum dikonfirmasi WW. Daftar di kedua halaman hanya memuat libur mulai hari ini (`getDaftarHariLibur()`), karena libur yang sudah lewat tidak memengaruhi pembuatan kunjungan.

## Ubah pola jadwal (2.7)

`/admin/jadwal-pelanggan` menampilkan pelanggan dengan langganan aktif (`kondisiLanggananAktif()`) yang punya pengajuan `siap_bayar`, beserta pola jadwal tetapnya. Pola tetap ditentukan WW, jadi **hanya admin** yang bisa mengubahnya dan pelanggan tidak bisa mengajukannya.

`ubahPolaJadwal()` di `actions/ubah-pola.ts` dipanggil lewat `useActionState` dari form ubah pola:

1. `requireAdmin()`, lalu validasi `skemaUbahPola`: minimal satu hari Senin–Jumat, jam diisi berpasangan dan selesai setelah mulai, tanggal berlaku tidak sebelum hari ini (WIB), alasan wajib.
2. Pelanggan harus masih berlangganan aktif dengan pengajuan `siap_bayar`. MOU wajib punya rentang jam, dan pola yang sama dengan pola sekarang ditolak supaya tracker tidak menampilkan notifikasi palsu.
3. Tanggal kunjungan baru dihitung dengan `tanggalKunjungan()` dari 2.2, mulai `berlaku_mulai` sampai `tanggal_akhir_langganan`, memakai hari libur yang sudah ada.
4. **Satu perintah SQL** (CONTRIBUTING 6.2): `UPDATE pengajuan_langganan` (pola dan `diperbarui_pada`), `INSERT perubahan_jadwal` dengan `pengajuan_id` itu, `UPDATE kunjungan_pengambilan` menjadi `batal` untuk baris `dijadwalkan` sejak tanggal berlaku yang tidak ada di pola baru, lalu `INSERT … ON CONFLICT (id_user, tanggal) DO UPDATE` untuk kunjungan pola baru. Semuanya dalam satu `WITH`, jadi tidak ada keadaan setengah jadi.
5. Kunjungan berstatus `diambil`, `ditimbang`, `tertunda`, dan `dilewati` tidak diubah. Kunjungan pengganti (`pengganti_dari` terisi) juga tidak dibatalkan atau ditimpa, karena tanggalnya berasal dari persetujuan lewati 2.6.
6. Halaman `/admin/jadwal-pelanggan`, `/admin/kunjungan`, `/admin/buat-kunjungan`, dan `/tracker` disegarkan.

Pemberitahuan pola di tracker (2.4) membaca `perubahan_jadwal` per `pengajuan_id` pengajuan `siap_bayar`; `alasan` ditampilkan apa adanya. Sesuai issue 2.7, `pengajuan_langganan.hari_pengambilan` langsung diganti walaupun `berlaku_mulai` masih beberapa hari lagi. Akibatnya pemberitahuan hari libur 2.4 yang memakai pola dari kolom itu bisa menghitung libur di antara hari ini dan `berlaku_mulai` dengan pola baru. Kasus ini jarang dan sudah dicatat ke 2.4 (lihat "Catatan antar-tugas").

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
- Unique (`id_user`, `tanggal`) berlaku untuk semua status, jadi kunjungan tidak pernah disisipkan dua kali. "Buat kunjungan" (2.2) memakai `ON CONFLICT (id_user, tanggal) DO NOTHING` dan tidak mengubah baris yang sudah ada. Membuat ulang kunjungan dari pola baru (2.7), yang perlu memperbarui baris yang belum diambil, memakai `INSERT … ON CONFLICT (id_user, tanggal) DO UPDATE … WHERE kunjungan_pengambilan.status IN (…)`, bukan menyisipkan baris kedua.
- Lewati dengan tanggal pengganti: kunjungan asal menjadi `dilewati`, dan usulan pelanggan disimpan di `laporan_kendala.tanggal_pengganti`. Tanggal yang disetujui admin, yang boleh berbeda dari usulan, menjadi kunjungan baru dengan `pengganti_dari` berisi id kunjungan asal. Kunjungan asal harus milik pelanggan yang sama (`kunjungan_pengambilan_pengganti_dari_fkey`).
- `foto_bukti_file_id` disimpan bersama `foto_bukti`, karena `deleteImageKitFile()` di `lib/imagekit.ts` butuh fileId saat foto diganti atau dihapus. Mengganti foto berarti menulis keduanya di `UPDATE` yang sama, dan menghapus foto berarti mengosongkan keduanya.
- `berat_kg` adalah kolom `numeric`, jadi Drizzle mengembalikannya sebagai string. Ubah dengan `Number(...)` (`CONTRIBUTING.md` bagian 9.2).
- Tabel ini tidak punya `diperbarui_pada`.
- Data lama di `riwayat_pengambilan` tidak dipindahkan (keputusan 2.1, tabel lama kosong). Tracker dan laporan hanya membaca `kunjungan_pengambilan`.

## Yang dipakai dari luar fitur ini

- `kondisiLanggananAktif()` dari `lib/langganan.ts`: tracker hanya untuk pelanggan yang langganannya aktif, dan "Buat kunjungan" hanya membuat kunjungan untuk pelanggan aktif.
- `tanggalHariIniJakarta()` dan fungsi format dari `lib/format-tanggal.ts`.
- Data pola hari dan rentang jam pelanggan dibaca langsung dari tabelnya lewat `lib/db/schema.ts`, bukan dengan mengimpor dari `features/langganan/`.

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

- **Untuk 2.4 (#154, @cintasuryasakti9-svg), dari 2.7 (#157):** tracker tidak perlu diubah
  untuk menampilkan perubahan pola. `ubahPolaJadwal()` menulis satu baris `perubahan_jadwal`
  per perubahan dengan `pengajuan_id` = pengajuan `siap_bayar` pelanggan, dan `alasan`
  disimpan apa adanya. Pemberitahuan hari libur di `queries/pemberitahuan.ts` tetap memakai
  `pengajuan_langganan.hari_pengambilan`; karena 2.7 langsung mengganti kolom itu walaupun
  `berlaku_mulai` masih beberapa hari lagi, libur di antara hari ini dan `berlaku_mulai`
  dihitung dengan pola baru. Ini disepakati mengikuti issue 2.7; kalau 2.4 ingin menghitung
  libur dengan pola lama sampai `berlaku_mulai`, 2.4 perlu membaca `perubahan_jadwal` terbaru
  yang `berlaku_mulai`-nya setelah hari ini.
