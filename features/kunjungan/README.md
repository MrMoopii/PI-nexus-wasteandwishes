# features/kunjungan

Kunjungan pengambilan sampah per pelanggan per tanggal: pembuatan jadwal dari pola hari dan hari libur, pencatatan ember dan berat oleh admin, tracker untuk pelanggan, serta laporan kendala dua arah.

## Peta file

File dipisah per proses supaya setiap pemilik kode tugas memegang file sendiri (`CONTRIBUTING.md` bagian 4.3).

| File                           | Isi                                                                                    | Kode tugas |
| ------------------------------ | -------------------------------------------------------------------------------------- | ---------- |
| `types.ts`                     | Daftar status, jenis, dan aturan (label dan `is…()`), tipe tampilan tabel dan tracker  | 2.1, 2.4   |
| `jadwal.ts`                    | Fungsi murni: tanggal kunjungan, aturan hari libur, batas minta lewati (lihat bawah)   | 2.2        |
| `queries/hari-libur.ts`        | `getDaftarHariLibur()`: hari libur mulai hari ini, urut naik. Hanya admin              | 2.2        |
| `actions/jadwal.ts`            | `buatKunjungan()`: kunjungan satu rentang dari pola pelanggan aktif dan hari libur     | 2.2        |
| `validasi/jadwal.ts`           | `skemaRentangKunjungan`, `tanggalWajib()`, `teksIsian()`, `NilaiIsian`, `GalatIsian`   | 2.2        |
| `actions/hari-libur.ts`        | `tambahHariLibur()`, `ubahHariLibur()`, `hapusHariLibur()`                             | 2.2        |
| `validasi/hari-libur.ts`       | `skemaHariLibur` (tanggal, keterangan, aturan) dan `skemaIdHariLibur`                  | 2.2        |
| `queries/admin.ts`             | Daftar kunjungan per tanggal untuk pencatatan                                          | 2.3        |
| `actions/pencatatan.ts`        | Catat ember dan foto, catat berat (kg), tandai tertunda dengan tanggal paling lambat   | 2.3        |
| `validasi/pencatatan.ts`       | Skema Zod jumlah ember, berat (kg), dan tanggal paling lambat                          | 2.3        |
| `queries/pelanggan.ts`         | `getTrackerSaya()`: isi `/tracker`. `isLanggananAktif()` dipakai aksi lapor-kendala    | 2.4        |
| `queries/pemberitahuan.ts`     | `bacaPemberitahuan()`: libur di hari pola, perubahan pola, laporan pelanggan           | 2.4        |
| `actions/lapor-kendala.ts`     | `laporKendala()` dan `mintaLewati()` (lihat bagian Tracker)                            | 2.4        |
| `validasi/lapor-kendala.ts`    | `skemaKendala` dan `skemaLewati` (tanggal pengganti wajib hari kerja)                  | 2.4        |
| `components/`                  | `BadgeStatusKunjungan`, `BadgeStatusLaporan`: hanya props, bisa dipakai 2.3 dan 2.6    | 2.4        |
| `queries/kendala.ts`           | Daftar laporan kendala yang masih terbuka                                              | 2.6        |
| `actions/tanggapi-kendala.ts`  | Admin menanggapi laporan kendala                                                       | 2.6        |
| `validasi/tanggapi-kendala.ts` | Skema Zod tanggapan admin                                                              | 2.6        |
| `app/admin/hari-libur/`        | Halaman admin hari libur: tambah, daftar mendatang, ubah, hapus                        | 2.2        |
| `app/admin/buat-kunjungan/`    | Halaman admin buat kunjungan: form rentang, ringkasan hasil, hari libur dihitung       | 2.2        |
| `app/admin/kunjungan/`         | Halaman admin pencatatan harian                                                        | 2.3        |
| `app/tracker/`                 | Halaman tracker: hari ini, jadwal, riwayat, pemberitahuan, laporan ke admin            | 2.4        |
| `app/admin/kendala/`           | Halaman admin laporan kendala                                                          | 2.6        |

`types.ts` berisi `STATUS_KUNJUNGAN`, `JENIS_LAPORAN`, `STATUS_LAPORAN`, dan `ATURAN_HARI_LIBUR`, masing-masing dengan tipe, `LABEL_…`, dan pemeriksa `is…()` tanpa `as`. Tipe tampilannya `KunjunganTampilan`, `LaporanKendalaTampilan`, `HariLiburTampilan`, dan `PerubahanJadwalTampilan`, diturunkan dari skema (kolom `numeric` menjadi `number`, `id_user` tidak ikut).

Tambahan 2.4 di `types.ts`: `LABEL_HARI` dan `namaHari()` (1 = Senin sampai 5 = Jumat), `PANJANG_PESAN_LAPORAN_MAKS` (1000, dipakai skema dan form), serta tipe tracker yang diturunkan dari tipe tampilan di atas: `KunjunganTracker`, `PilihanKunjungan`, `PilihanLewati`, `JadwalTetap`, `PemberitahuanLibur`, `PerubahanPolaTracker`, `LaporanTracker`, `IsiTracker`, dan `DataTracker`.

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

## Tracker pelanggan (2.4)

### Akses

- Login dijaga middleware (`/tracker` ada di `authorized()` di `auth.config.ts`) dan `getTrackerSaya()` (`requireLogin()`, gagal dialihkan ke `/auth/login`).
- Langganan aktif dicek dengan `kondisiLanggananAktif()` di `getTrackerSaya()` dan di kedua aksi lewat `isLanggananAktif()`. Akun tanpa langganan aktif, termasuk admin, mendapat `{ aktif: false }` tanpa data apa pun. Halaman lalu menampilkan pesan dengan tautan ke `/langganan`.
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
  4. Tanggal pengganti (pilihan) harus hari kerja (skema), setelah tanggal yang dilewati, bukan hari libur, dan belum ada kunjungan pelanggan di tanggal itu, apa pun statusnya. Tanggal ini hanya usulan dan boleh setelah tanggal akhir langganan, karena admin yang memutuskan di 2.6.
  5. Perubahan ditulis satu perintah: `WITH … UPDATE kunjungan_pengambilan SET status = 'dilewati' WHERE … AND status = 'dijadwalkan' RETURNING …`, lalu `INSERT laporan_kendala` jenis `lewati`. Tanpa baris kembali berarti kunjungan sudah berubah di tab lain atau oleh admin.

### Yang perlu diketahui 2.6 dan 2.7

Tracker hanya membaca kolom yang sudah ada sejak 2.1, jadi data dari 2.6 dan 2.7 langsung tampil tanpa perlu dipasang di file 2.4.

- `tanggapan_admin` (2.6) dan `perubahan_jadwal.alasan` (2.7) tampil apa adanya ke pelanggan.
- Laporan tetap "Menunggu tanggapan" sampai `status` diubah menjadi `ditanggapi`.
- Kunjungan pengganti yang disetujui (2.6) muncul di jadwal mendatang dan di kartu laporan lewati. Syaratnya, kunjungan itu dibuat dengan `pengganti_dari`.
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
- `requireLogin()` dari `lib/require-login.ts`: query dan aksi tracker pelanggan.
- `tanggalHariIniJakarta()` dan fungsi format dari `lib/format-tanggal.ts`.
- Data pola hari dan rentang jam pelanggan dibaca langsung dari tabelnya lewat `lib/db/schema.ts`, bukan dengan mengimpor dari `features/langganan/`.

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

Belum ada.
