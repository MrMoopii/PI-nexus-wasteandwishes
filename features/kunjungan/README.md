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
| `queries/admin.ts`             | `getKunjunganPerTanggal()`: daftar kunjungan satu tanggal beserta nama instansi      | 2.3        |
| `actions/pencatatan.ts`        | `catatEmber()`, `catatBerat()`, `ubahPencatatan()`                                     | 2.3        |
| `actions/tertunda.ts`          | `tandaiTertunda()`, `ubahTertunda()`, `batalkanTertunda()`                             | 2.3        |
| `validasi/pencatatan.ts`       | `skemaFilterTanggal`, `skemaCatatEmber`, `skemaCatatBerat`, `skemaUbahPencatatan`, `skemaTandaiTertunda`, `skemaUbahTertunda`, `skemaBatalkanTertunda` | 2.3 |
| `queries/pelanggan.ts`         | Status hari ini, jadwal berikutnya, riwayat, total ember dan kg milik pelanggan        | 2.4        |
| `actions/lapor-kendala.ts`     | Pelanggan melaporkan kendala                                                           | 2.4        |
| `validasi/lapor-kendala.ts`    | Skema Zod isi laporan kendala                                                          | 2.4        |
| `components/`                  | Komponen tracker (hanya menerima props)                                                | 2.4        |
| `queries/kendala.ts`           | Daftar laporan kendala yang masih terbuka                                              | 2.6        |
| `actions/tanggapi-kendala.ts`  | Admin menanggapi laporan kendala                                                       | 2.6        |
| `validasi/tanggapi-kendala.ts` | Skema Zod tanggapan admin                                                              | 2.6        |
| `app/admin/hari-libur/`        | Halaman admin hari libur: tambah, daftar mendatang, ubah, hapus                        | 2.2        |
| `app/admin/buat-kunjungan/`    | Halaman admin buat kunjungan: form rentang, ringkasan hasil, hari libur dihitung       | 2.2        |
| `app/admin/kunjungan/`         | Halaman admin pencatatan harian: daftar per tanggal, catat ember/foto, catat berat, tandai tertunda | 2.3 |
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

## Tabel

Didefinisikan di `lib/db/schema-kunjungan.ts` (2.1) dan diekspor ulang dari `lib/db/schema.ts`, jadi impor tetap dari `@/lib/db/schema`. Tabel hanya diubah pemilik skema, sesuai `CONTRIBUTING.md` bagian 6.3. Nama constraint di bawah muncul di pesan error Postgres saat isian ditolak.

| Tabel                   | Aturan yang dijaga database                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hari_libur`            | Satu baris per `tanggal` (`hari_libur_tanggal_unique`). `aturan` `geser` (bawaan) atau `lewati`.                                                                                                                                                                                                                                                                                                                                |
| `kunjungan_pengambilan` | Satu baris per pelanggan per `tanggal` (`kunjungan_pengambilan_user_tanggal_unique`), termasuk baris `batal` dan `dilewati`. `pengajuan_id` wajib dan harus milik pelanggan yang sama (`kunjungan_pengambilan_pengajuan_user_fkey`). `tanggal` hanya Senin–Jumat. Jam kosong keduanya, atau terisi keduanya dengan jam mulai lebih awal. `jumlah_ember` dan `berat_kg` tidak negatif. Syarat lain ada di daftar di bawah tabel. |
| `laporan_kendala`       | `jenis` `kendala` atau `lewati`. `status` `menunggu` (bawaan) atau `ditanggapi`. `pesan` wajib dan tidak boleh kosong. `tanggal_pengganti` hanya untuk `lewati`. Kunjungan yang dilaporkan harus milik pelapor (`laporan_kendala_kunjungan_user_fkey`).                                                                                                                                                                         |
| `perubahan_jadwal`      | `hari_pengambilan` minimal satu hari, setiap hari 1–5. Rentang jam seperti kunjungan. `berlaku_mulai`, `alasan`, dan `diubah_oleh` wajib.                                                                                                                                                                                                                                                                                       |

Syarat lain di `kunjungan_pengambilan`:

- `tertunda`: `alasan_kendala` dan `tanggal_paling_lambat` wajib terisi. Database hanya mewajibkan `tanggal_paling_lambat >= tanggal`; aplikasi (2.3) lebih ketat, yaitu harus **setelah** tanggal kunjungan.
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

## Pencatatan harian (2.3)

`/admin/kunjungan` dipakai admin untuk mencatat hasil pengambilan dari laporan kurir dan petugas pengolah sampah. Tidak ada status "dalam perjalanan". Tanggal dibaca dari `?tanggal=` (kosong berarti hari ini WIB; diisi tetapi bukan tanggal kalender berarti 404).

### Alur status

| Aksi | Status asal yang diterima | Status akhir | Isian wajib |
| --- | --- | --- | --- |
| `catatEmber()` | `dijadwalkan`, `tertunda` | `diambil` | jumlah ember, foto bukti (url + fileId) |
| `catatBerat()` | `diambil` | `ditimbang` | berat kg (`ditimbang_pada` diisi `now()`) |
| `ubahPencatatan()` | `diambil` | `diambil` | jumlah ember; foto opsional (kosong = foto lama) |
| `ubahPencatatan()` | `ditimbang` | `ditimbang` | jumlah ember, berat kg; foto opsional (kosong = foto lama) |
| `tandaiTertunda()` | `dijadwalkan` | `tertunda` | alasan, tanggal paling lambat |
| `ubahTertunda()` | `tertunda` | `tertunda` | alasan, tanggal paling lambat |
| `batalkanTertunda()` | `tertunda` | `dijadwalkan` | — (alasan dan tanggal dikosongkan) |

- Setiap aksi memakai satu `UPDATE … WHERE status IN (…) RETURNING …` (CONTRIBUTING 6.2). `RETURNING` kosong berarti status sudah berubah di tab lain; pesannya "Status kunjungan sudah berubah…" dan tidak ada data yang ditimpa.
- `catatEmber()` dari status `tertunda` mengosongkan `alasan_kendala` dan `tanggal_paling_lambat`, karena kunjungan itu akhirnya diambil. Kedua status asal belum punya foto, jadi tidak ada file ImageKit lama yang perlu dihapus.
- Tombol simpan `catatEmber()` dan `ubahPencatatan()` baru aktif jika jumlah ember terisi (dan foto untuk langkah 1). Isian jumlah ember sengaja kosong, bukan `0`: skema memvalidasi teks lalu mengubahnya ke angka, karena `z.coerce.number("")` menghasilkan `0` sehingga isian kosong lolos.
- Tombol **Edit** muncul setelah kunjungan tersimpan. Status `diambil` menampilkan Edit jumlah ember + foto; status `ditimbang` menampilkan Edit jumlah ember + foto + berat. Foto baru yang menggantikan foto lama dihapus dari ImageKit lewat `deleteImageKitFile()`; foto kosong berarti foto lama dipertahankan. Berat hanya boleh diubah saat status `ditimbang` (dicek di `WHERE`), dan `ditimbang_pada` tidak ditulis ulang karena itu waktu penimbangan asli, bukan waktu koreksi.
- `tandaiTertunda()` menerima banyak ID sekaligus. Syarat `tanggal <= tanggal_paling_lambat` ikut di `WHERE`, supaya satu baris yang tanggalnya sesudah tanggal paling lambat tidak membuat seluruh `UPDATE` gagal karena CHECK. Baris yang dilewati dilaporkan jumlahnya.
- Hanya kunjungan `dijadwalkan` yang bisa dicentang. Saat dicentang, **hanya** dropdown **Tandai tertunda** (alasan + tanggal paling lambat) yang tampil; aksi pencatatan lain disembunyikan sampai centang dilepas. Status baru berubah saat form disimpan.
- Tanggal paling lambat **harus setelah tanggal kunjungan**. Contoh: kunjungan 7 Des 2026, tanggal paling lambat paling cepat 8 Des 2026. Batas bawah form memakai `tanggalPalingLambatMin()` di `validasi/pencatatan.ts` (tanggal kunjungan + 1 hari), dan Server Action memakai syarat `tanggal < tanggal_paling_lambat` di `WHERE`, jadi aturan ini tetap berlaku walau form dilewati.
- Setelah tersimpan menjadi `tertunda`, checkbox baris itu **selalu tampil tercentang tetapi nonaktif**. Satu-satunya jalan membatalkan adalah tombol **Batalkan penundaan** di baris tersebut, yang mengembalikan status ke `dijadwalkan`, mengosongkan alasan/tanggal paling lambat, dan mereset centang.
- Hasil pembatalan (berhasil maupun gagal) ditampilkan sebagai notifikasi in-app (`toast` sonner lewat `ToastProvider` di root layout), bukan dialog `window.confirm`.
- Baris `tertunda` juga punya **Edit penundaan** (alasan dan tanggal) di luar mode centang.
- Tidak ada lagi form tandai tertunda massal di bawah tabel; penundaan dilakukan per baris.
- Kunjungan `batal` dan `dilewati` tetap tampil di daftar, tanpa aksi.
- Foto diunggah lebih dulu lewat `ImageKitReportUpload` (memakai `/api/admin/imagekit-auth` dan `getImageKitAuthParams()`), lalu url dan fileId dikirim sebagai hidden input. Server hanya menerima URL `https`.

## Yang dipakai dari luar fitur ini

- `kondisiLanggananAktif()` dari `lib/langganan.ts`: tracker hanya untuk pelanggan yang langganannya aktif, dan "Buat kunjungan" hanya membuat kunjungan untuk pelanggan aktif.
- `tanggalHariIniJakarta()` dan fungsi format dari `lib/format-tanggal.ts`.
- Data pola hari dan rentang jam pelanggan dibaca langsung dari tabelnya lewat `lib/db/schema.ts`, bukan dengan mengimpor dari `features/langganan/`.

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

Belum ada.
