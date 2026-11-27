# features/kunjungan

Kunjungan pengambilan sampah per pelanggan per tanggal: pembuatan jadwal dari pola hari dan hari libur, pencatatan ember dan berat oleh admin, tracker untuk pelanggan, serta laporan kendala dua arah.

## Peta file

File dipisah per proses supaya setiap pemilik kode tugas memegang file sendiri (`CONTRIBUTING.md` bagian 4.3).

| File                           | Isi                                                                                    | Kode tugas |
| ------------------------------ | -------------------------------------------------------------------------------------- | ---------- |
| `types.ts`                     | Daftar status, jenis, dan aturan (label dan `is…()`), tipe tampilan tabel dan tracker  | 2.1, 2.4, 2.6 |
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
| `queries/pelanggan.ts`         | Status hari ini, jadwal berikutnya, riwayat, total ember dan kg milik pelanggan. `akhirLanggananAktif()` untuk batas usulan tanggal pengganti (2.6) | 2.4, 2.6 |
| `actions/lapor-kendala.ts`     | Pelanggan melaporkan kendala dan meminta lewati. Batas usulan tanggal sampai akhir langganan ditambahkan 2.6 | 2.4, 2.6 |
| `validasi/lapor-kendala.ts`    | Skema Zod isi laporan kendala                                                          | 2.4        |
| `components/`                  | Komponen tracker (hanya menerima props)                                                | 2.4        |
| `queries/kendala.ts`           | `getHalamanKendala()`: kotak masuk dan 20 tanggapan terakhir. `bacaLaporanPengganti()` dan `bacaBentrokTanggal()` untuk aksi. Hanya admin | 2.6 |
| `actions/tanggapi-kendala.ts`  | `tanggapiLaporan()` (kendala, lewati tanpa pengganti), `putuskanPengganti()` (setujui, tanggal lain, tolak) | 2.6 |
| `validasi/tanggapi-kendala.ts` | `skemaTanggapiLaporan`, `skemaPutusanPengganti`, `tanggalPenggantiMin()`, `syaratTanggalPengganti()` | 2.6 |
| `app/admin/hari-libur/`        | Halaman admin hari libur: tambah, daftar mendatang, ubah, hapus                        | 2.2        |
| `app/admin/buat-kunjungan/`    | Halaman admin buat kunjungan: form rentang, ringkasan hasil, hari libur dihitung       | 2.2        |
| `app/admin/kunjungan/`         | Halaman admin pencatatan harian: daftar per tanggal, catat ember/foto, catat berat, tandai tertunda | 2.3 |
| `app/tracker/`                 | Halaman tracker pelanggan                                                              | 2.4        |
| `app/admin/kendala/`           | Halaman admin laporan kendala: kotak masuk tiga kelompok dengan form tanggapan, riwayat "Terakhir ditanggapi" | 2.6 |

`types.ts` berisi `STATUS_KUNJUNGAN`, `JENIS_LAPORAN`, `STATUS_LAPORAN`, dan `ATURAN_HARI_LIBUR`, masing-masing dengan tipe, `LABEL_…`, dan pemeriksa `is…()` tanpa `as`. Tipe tampilannya `KunjunganTampilan`, `LaporanKendalaTampilan`, `HariLiburTampilan`, dan `PerubahanJadwalTampilan`, diturunkan dari skema (kolom `numeric` menjadi `number`, `id_user` tidak ikut).

Tambahan 2.4 di `types.ts`: `LABEL_HARI` dan `namaHari()` (1 = Senin sampai 5 = Jumat), `PANJANG_PESAN_LAPORAN_MAKS` (1000, dipakai skema dan form), serta tipe tracker yang diturunkan dari tipe tampilan di atas: `KunjunganTracker`, `PilihanKunjungan`, `PilihanLewati`, `JadwalTetap`, `PemberitahuanLibur`, `PerubahanPolaTracker`, `LaporanTracker`, `IsiTracker`, dan `DataTracker`. Tambahan 2.6: `IsiTracker.akhirLangganan`, tanggal akhir langganan aktif untuk batas usulan tanggal pengganti di form lewati.

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
- `isHariKerja(tanggal): boolean`: Senin sampai Jumat. Dipakai 2.4 dan 2.6 untuk memeriksa tanggal pengganti.
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

## Tracker pelanggan (2.4)

### Akses

- Login dijaga middleware (`/tracker` ada di `authorized()` di `auth.config.ts`) dan `getTrackerSaya()` (`requireLogin()`, gagal dialihkan ke `/auth/login`).
- Langganan aktif dicek dengan `kondisiLanggananAktif()` di `getTrackerSaya()` dan di kedua aksi, lewat `isLanggananAktif()` (kendala) dan `akhirLanggananAktif()` (lewati, sekaligus membaca tanggal akhir langganan). Akun tanpa langganan aktif, termasuk admin, mendapat `{ aktif: false }` tanpa data apa pun. Halaman lalu menampilkan pesan dengan tautan ke `/langganan`.
- Menu **Tracker** ada di `components/header/Header.tsx` untuk semua akun yang login.

### Yang ditampilkan

Batas tampilan disepakati di 2.4:

- **Hari ini:** kunjungan tanggal hari ini (WIB). Jika tidak ada, kartu menulis Sabtu/Minggu, hari libur di hari pola, atau "Tidak ada jadwal pengambilan hari ini".
- **Jadwal mendatang:** 20 kunjungan berikutnya, semua status. "Jadwal berikutnya" adalah yang pertama berstatus `dijadwalkan`.
- **Riwayat:** 20 kunjungan terakhir sebelum hari ini.
- **Total:** dihitung dari seluruh riwayat. Ember dari status `diambil` dan `ditimbang`, kg dari status `ditimbang`.
- **Jadwal tetap:** pola, jam, dan nama instansi dari pengajuan `siap_bayar`. Tidak tampil untuk pelanggan aktif tanpa pengajuan `siap_bayar` (alur lama).
- **Pemberitahuan:**
  - kunjungan `tertunda` selain hari ini ("Ditunda: alasan. Diambil paling lambat tanggal.");
  - hari libur sampai 30 hari ke depan yang jatuh di hari pola, dengan tanggal dari `hariKerjaBerikutnya()` untuk aturan `geser`;
  - baris `perubahan_jadwal` milik pengajuan `siap_bayar` yang `berlaku_mulai`-nya 30 hari terakhir atau sesudahnya.
- **Permintaan saya:** 10 laporan terakhir dengan status, `tanggapan_admin`, dan tanggal pengganti yang disetujui. Tanggal itu adalah kunjungan dengan `pengganti_dari` berisi kunjungan yang dilewati.

Kunjungan yang dibuat sebelum hari liburnya ditambahkan tetap tampil di jadwal (keputusan 2.2), dan pemberitahuan liburnya tetap muncul. Admin yang memutuskan kunjungan itu.

### Laporan kendala dan permintaan lewati

`laporKendala()` dan `mintaLewati()` di `actions/lapor-kendala.ts` dipanggil lewat `useActionState` dari form di `/tracker`. Keduanya memanggil `requireLogin()`, memvalidasi isian dengan skema di `validasi/lapor-kendala.ts`, lalu mengecek langganan aktif. `id_user` selalu dari sesi.

- **Kendala:** boleh untuk kunjungan mana pun milik pelanggan (hari ini, mendatang, atau riwayat). Satu `INSERT … SELECT … WHERE id_kunjungan = … AND id_user = …`, jadi kunjungan akun lain diperlakukan seperti kunjungan yang tidak ada.
- **Lewati:**
  1. Alasan wajib, juga untuk lewati tanpa pengganti.
  2. Kunjungan harus milik pelanggan dan berstatus `dijadwalkan`.
  3. `bolehMintaLewati(tanggal, new Date())` harus `true` (H-1 pukul 17.00 WIB). Form hanya menawarkan kunjungan yang masih boleh, tetapi server tetap mengecek ulang.
  4. Tanggal pengganti (pilihan) harus hari kerja (skema), setelah tanggal yang dilewati, tidak setelah tanggal akhir langganan, bukan hari libur, dan belum ada kunjungan pelanggan di tanggal itu, apa pun statusnya. Batas akhir langganan ditambahkan di 2.6 (sebelumnya usulan boleh melewatinya). Form membatasi kalender sampai `IsiTracker.akhirLangganan` dan menulis tanggal itu, tetapi server tetap mengecek ulang. Tanggal ini tetap usulan; admin yang memutuskan di `/admin/kendala` (2.6).
  5. Perubahan ditulis satu perintah: `WITH … UPDATE kunjungan_pengambilan SET status = 'dilewati' WHERE … AND status = 'dijadwalkan' RETURNING …`, lalu `INSERT laporan_kendala` jenis `lewati`. Tanpa baris kembali berarti kunjungan sudah berubah di tab lain atau oleh admin.
- Form lewati meminta konfirmasi lewat `DialogKonfirmasi` (`components/ui/`) sebelum mengirim, bukan `window.confirm`. Form ini dikirim lewat `onSubmit` + `startTransition`, bukan `<form action>`; alasannya di bagian "Laporan kendala admin (2.6)".

### Data dari 2.6 dan 2.7 di tracker

Tracker hanya membaca kolom yang sudah ada sejak 2.1, jadi data dari 2.6 dan 2.7 langsung tampil tanpa perlu dipasang di file 2.4.

- `tanggapan_admin` (2.6) dan `perubahan_jadwal.alasan` (2.7) tampil apa adanya ke pelanggan.
- Laporan tetap "Menunggu tanggapan" sampai admin menanggapinya di `/admin/kendala` (status `ditanggapi`).
- Kunjungan pengganti dari `putuskanPengganti()` (2.6) dibuat dengan `pengganti_dari`, jadi muncul di jadwal mendatang dan di kartu laporan lewati.
- Pemberitahuan perubahan pola (2.7) dibaca per `pengajuan_id` pengajuan `siap_bayar` pelanggan.
- Pemberitahuan libur memakai pola di `pengajuan_langganan.hari_pengambilan`. Jika 2.7 mengganti kolom itu sebelum `berlaku_mulai`, libur di antara hari ini dan `berlaku_mulai` dihitung dengan pola baru.

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

## Laporan kendala admin (2.6)

`/admin/kendala` (menu **Laporan Kendala**) dipakai admin untuk menanggapi laporan dari tracker pelanggan (2.4). Akses dijaga middleware, `getHalamanKendala()` (`requireAdmin()`; belum login dialihkan ke login, bukan admin ke beranda), dan `requireAdmin()` di baris pertama setiap aksi. Tipe tampilannya (`LaporanAdmin`, `LaporanUsulan`, `HalamanKendala`) ada di `queries/kendala.ts`, seperti `KunjunganHarian` di 2.3.

### Tampilan

Halaman bekerja seperti kotak masuk:

- **Menunggu tanggapan:** semua laporan `menunggu`, terlama dulu, tanpa batas jumlah, dalam tiga kelompok:
  1. lewati dengan usulan tanggal pengganti, dengan form keputusan;
  2. laporan kendala, dengan form tanggapan;
  3. lewati tanpa tanggal pengganti, yang sudah berlaku sejak pelanggan mengirimnya, dengan form tanggapan.
- **Terakhir ditanggapi:** 20 laporan `ditanggapi` terbaru, hanya untuk dibaca, tertutup saat halaman dibuka. Diurut menurut waktu kirim pelanggan, karena `laporan_kendala` tidak punya kolom waktu ditanggapi. Mengurutkan menurut waktu tanggapan butuh kolom baru lewat pemilik skema.
- Setiap kartu menampilkan instansi, PIC, kunjungan yang dilaporkan beserta statusnya sekarang, isi laporan, usulan tanggal, dan waktu kirim.
- Pesan gagal tampil di form, dan teks yang diketik tetap ada. Pesan sukses tampil sebagai notifikasi (`toast` sonner), karena kartunya langsung pindah ke riwayat.
- Form keputusan dikirim lewat `onSubmit` + `startTransition`, bukan `<form action>`. Action bawaan React me-reset form setelah selesai (`form.reset()`), dan radio terkontrol kembali ke pilihan awalnya, karena React hanya mengisi `defaultChecked` saat radio pertama dirender. Isian teks dan tanggal tidak terkena, karena nilai bawaannya ikut diperbarui setiap render. Form lewati di tracker (2.4) memakai cara yang sama. Form tanpa radio (`form-tanggapan.tsx`) tetap memakai `<form action>`.

### Aksi

| Aksi | Laporan yang diterima (status `menunggu`) | Hasil |
| --- | --- | --- |
| `tanggapiLaporan()` | kendala, atau lewati tanpa usulan tanggal | `ditanggapi` dan `tanggapan_admin` |
| `putuskanPengganti()` setujui | lewati dengan usulan tanggal | `ditanggapi` dan kunjungan pengganti di tanggal usulan (dibaca dari database, bukan dari form) |
| `putuskanPengganti()` tanggal lain | lewati dengan usulan tanggal | `ditanggapi` dan kunjungan pengganti di tanggal pilihan admin |
| `putuskanPengganti()` tolak | lewati dengan usulan tanggal | `ditanggapi` tanpa kunjungan pengganti; kunjungan asal tetap `dilewati` |

- Tanggapan wajib untuk semua aksi (keputusan 2.6), paling banyak `PANJANG_PESAN_LAPORAN_MAKS` karakter, dan tampil apa adanya di tracker. Status tujuan selalu ditentukan aksi, tidak dari form.
- Setiap aksi hanya mengubah laporan yang masih `menunggu`. Laporan yang sudah ditanggapi di tab lain tidak ditimpa; pesannya "Laporan ini sudah ditanggapi atau tidak ditemukan. Muat ulang halaman."
- Syarat tanggal pengganti untuk setujui dan tanggal lain, dicek `syaratTanggalPengganti()` lalu `bacaBentrokTanggal()`:
  - hari kerja;
  - setelah tanggal yang dilewati;
  - tidak sebelum hari ini (WIB), jadi usulan yang sudah lewat harus diganti tanggal lain;
  - langganan pelanggan masih aktif (`kondisiLanggananAktif()`), dan tanggalnya tidak setelah tanggal akhir langganan;
  - bukan hari libur;
  - belum ada kunjungan pelanggan di tanggal itu, apa pun statusnya.
- Isian tanggal di form dibatasi `tanggalPenggantiMin()` dan tanggal akhir langganan. Server tetap mengecek ulang semua syarat.
- Pelanggan juga tidak bisa lagi mengusulkan tanggal setelah tanggal akhir langganannya (`mintaLewati()`, lihat bagian tracker di atas). Pemeriksaan masa langganan di sini tetap dipertahankan sebagai pengaman (keputusan 2.6), untuk usulan yang dikirim sebelum aturan itu dan untuk tanggal yang dipilih admin.

### Kunjungan pengganti

- Dibuat berstatus `dijadwalkan` dengan `pengganti_dari` = kunjungan yang dilewati. `pengajuan_id` dan jam disalin dari kunjungan itu (keputusan 2.6). Satu kunjungan asal paling banyak punya satu pengganti.
- Laporan dan kunjungan ditulis dalam satu perintah (`CONTRIBUTING.md` bagian 6.2): `WITH lap AS (UPDATE laporan_kendala … WHERE status = 'menunggu' AND … RETURNING …) INSERT INTO kunjungan_pengambilan … SELECT … FROM lap`.
  - `UPDATE` di depan, jadi dua admin yang menyetujui laporan yang sama bersamaan tidak menghasilkan dua pengganti: yang kedua tidak cocok lagi dengan `status = 'menunggu'`.
  - Syarat bukan hari libur, belum ada kunjungan di tanggal itu, dan kunjungan asal `dilewati` tanpa pengganti ikut di `WHERE`.
  - `INSERT` sengaja tanpa `ON CONFLICT`. Jika kunjungan lain masuk di tanggal yang sama tepat bersamaan, `kunjungan_pengambilan_user_tanggal_unique` menggagalkan seluruh perintah, termasuk `UPDATE`-nya. Hanya error ini (kode `23505`) yang diubah menjadi pesan; error lain naik ke `error.tsx`.
- Kunjungan pengganti tampil di `/admin/kunjungan` pada tanggalnya, dan di tracker dengan keterangan "Kunjungan pengganti". Kartu laporan di tracker tetap menampilkan usulan pelanggan beserta tanggal dari admin.
- Risiko yang diterima (keputusan 2.6): jika tanggal pengganti jatuh di hari pola pelanggan yang kunjungan rutinnya belum dibuat, "Buat kunjungan" (2.2) nanti melewati tanggal itu karena sudah terisi, sehingga pengganti dan kunjungan rutin menjadi satu. Buat kunjungan cukup jauh ke depan sebelum menyetujui, atau pilih tanggal di luar hari pola pelanggan.
- Untuk 2.7: kunjungan dengan `pengganti_dari` adalah kesepakatan satu kali dari admin, bukan hasil pola. Saat membuat ulang kunjungan dari pola baru, baris itu jangan diubah atau dibatalkan, dan baris `dilewati` jangan dikembalikan ke `dijadwalkan`.

## Yang dipakai dari luar fitur ini

- `kondisiLanggananAktif()` dari `lib/langganan.ts`: tracker hanya untuk pelanggan yang langganannya aktif, "Buat kunjungan" hanya membuat kunjungan untuk pelanggan aktif, dan kunjungan pengganti (2.6) hanya dibuat untuk pelanggan aktif.
- `requireLogin()` dari `lib/require-login.ts`: query dan aksi tracker pelanggan.
- `tanggalHariIniJakarta()` dan fungsi format dari `lib/format-tanggal.ts`.
- Data pola hari dan rentang jam pelanggan dibaca langsung dari tabelnya lewat `lib/db/schema.ts`, bukan dengan mengimpor dari `features/langganan/`.

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

Belum ada.
