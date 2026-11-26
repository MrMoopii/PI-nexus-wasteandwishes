# Skenario uji: langganan

Nomor `LGN-01` sampai `LGN-19` disediakan untuk alur pengajuan, negosiasi dari sisi pelanggan, dan daftar admin (kode tugas 1.1–1.4). Nomor `LGN-20` sampai `LGN-39` untuk pembayaran (kode tugas 1.6). Nomor `LGN-40` ke atas untuk aksi admin di halaman detail pengajuan (kode tugas 1.5), dan `LGN-49` sampai `LGN-50` untuk halaman jadwal lama yang sudah dialihkan (kode tugas 1.7).

Data uji diisi lewat SQL Editor Neon di branch pribadi (`CONTRIBUTING.md` bagian 6.5). Siapkan:

- akun `user` A dengan profil lengkap, tanpa pengajuan dan tanpa baris `data_langganan`;
- akun `user` B dengan profil lengkap;
- akun `admin` (bagian 6.4).

Ganti `<id A>` dan `<id pengajuan>` dengan nilai sebenarnya dari tabel `users` dan `pengajuan_langganan`.

## LGN-01: Kirim pengajuan baru

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** akun A tanpa pengajuan.
- **Langkah:**
  1. Login sebagai A, buka `/langganan`.
  2. Pastikan alamat pengambilan, nama PIC, dan telepon PIC sudah terisi dari profil.
  3. Isi nama instansi, pilih "Hotel", isi perkiraan ember `10`, lalu klik **Kirim pengajuan**.
- **Hasil yang diharapkan:** form berganti menjadi kartu "Pengajuan langganan" berstatus **Menunggu review**, rincian isian tampil, dan ada tombol **Batalkan pengajuan**. Di database ada satu baris baru di `pengajuan_langganan` dengan `status = 'menunggu_review'`, `id_user = <id A>`, `jenis_instansi_lain`, `jenis_limbah`, dan `catatan_pelanggan` bernilai `NULL`. Telepon PIC tersimpan tanpa spasi dan strip.
- **Keadaan gagal yang dicek:** lihat LGN-03 sampai LGN-08.
- **Hasil uji terakhir:** belum diuji

## LGN-02: Isian Instansi Lain

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** akun A tanpa pengajuan berjalan.
- **Langkah:**
  1. Pilih jenis instansi "Instansi Lain". Isian "Tulis jenis instansi" muncul.
  2. Kosongkan isian itu, isi yang lain dengan benar, lalu kirim.
  3. Isi "Sekolah", lalu kirim.
  4. Ulangi dengan pengajuan baru: pilih "Instansi Lain", isi "Sekolah", lalu ganti ke "Restoran" dan kirim.
- **Hasil yang diharapkan:** langkah 2 menampilkan "Tulis jenis instansi Anda." di bawah isian itu. Langkah 3 tersimpan dengan `jenis_instansi = 'lainnya'`, `jenis_instansi_lain = 'Sekolah'`, dan rincian menampilkan "Sekolah". Langkah 4 tersimpan dengan `jenis_instansi = 'restoran'` dan `jenis_instansi_lain = NULL`.
- **Keadaan gagal yang dicek:** isian Instansi Lain kosong.
- **Hasil uji terakhir:** belum diuji

## LGN-03: Pesan error per isian

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** akun A tanpa pengajuan berjalan.
- **Langkah:**
  1. Kosongkan semua isian, lalu kirim.
  2. Isi nama instansi `A`, telepon `12ab`, perkiraan ember `0`, lalu kirim.
  3. Isi perkiraan ember `201`, lalu `2.5`, lalu kirim masing-masing.
  4. Isi jenis limbah lebih dari 100 karakter (hapus atribut `maxlength` lewat DevTools), lalu kirim.
- **Hasil yang diharapkan:** pesan "Periksa kembali isian yang ditandai." tampil di atas form, dan setiap isian yang salah punya pesannya sendiri: "… wajib diisi.", "Nama instansi minimal 2 karakter.", "Nomor telepon 9–15 angka, boleh diawali (+)!", "Isi perkiraan jumlah ember, minimal 1.", "Perkiraan jumlah ember paling banyak 200.", "Perkiraan jumlah ember harus bilangan bulat.", "Jenis limbah paling banyak 100 karakter.". Tidak ada baris baru di database.
- **Keadaan gagal yang dicek:** isian kosong, terlalu pendek, terlalu panjang, bukan angka, desimal, di luar batas.
- **Hasil uji terakhir:** belum diuji

## LGN-04: Isian tidak hilang saat gagal

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** akun A tanpa pengajuan berjalan.
- **Langkah:**
  1. Isi semua isian, pilih "Instansi Lain" dan isi "Sekolah", tetapi isi perkiraan ember `0`.
  2. Kirim.
- **Hasil yang diharapkan:** hanya isian perkiraan ember yang diberi pesan error. Semua teks lain, pilihan "Instansi Lain", dan isian "Sekolah" tetap terisi seperti yang diketik.
- **Keadaan gagal yang dicek:** form dikosongkan setelah gagal.
- **Hasil uji terakhir:** belum diuji

## LGN-05: Pengajuan kedua ditolak selagi ada yang berjalan

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** akun A tanpa pengajuan berjalan.
- **Langkah:**
  1. Buka `/langganan` di dua tab.
  2. Kirim pengajuan dari tab pertama.
  3. Tanpa memuat ulang tab kedua, kirim pengajuan dari tab kedua.
- **Hasil yang diharapkan:** tab kedua menampilkan "Anda masih punya pengajuan yang sedang berjalan. Muat ulang halaman untuk melihat statusnya." Tidak ada error 500, dan di database tetap hanya satu pengajuan berjalan untuk A.
- **Keadaan gagal yang dicek:** unique index sebagian `pengajuan_langganan_satu_berjalan_per_user` menolak baris kedua. Penolakan itu harus menjadi pesan, bukan error.
- **Hasil uji terakhir:** belum diuji

## LGN-06: Admin tidak bisa mengajukan

- **Kode tugas:** 1.1
- **Peran:** admin
- **Persiapan data:** akun admin.
- **Langkah:**
  1. Login sebagai admin, buka `/langganan`.
  2. Login sebagai A di tab lain, buka `/langganan` sampai form tampil. Di SQL Editor ubah `peran` A menjadi `'admin'` tanpa login ulang, lalu kirim form dari tab itu.
  3. Kembalikan `peran` A menjadi `'user'`.
- **Hasil yang diharapkan:** langkah 1 menampilkan "Akun admin tidak dapat mengajukan langganan." tanpa form. Langkah 2 menampilkan "Hanya akun pelanggan yang dapat mengajukan langganan." dan tidak ada baris baru. Peran dibaca dari database, bukan dari token.
- **Keadaan gagal yang dicek:** bukan peran `user`, termasuk token yang perannya usang.
- **Hasil uji terakhir:** belum diuji

## LGN-07: Profil belum lengkap

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** akun A tanpa pengajuan berjalan.
- **Langkah:**
  1. Buka `/langganan` sebagai A sampai form tampil.
  2. Di SQL Editor: `UPDATE users SET tanggal_lahir = NULL WHERE id_user = <id A>;`
  3. Kirim form dari tab yang sudah terbuka.
  4. Muat ulang `/langganan`.
  5. Isi kembali tanggal lahir lewat link **Lengkapi profil**.
- **Hasil yang diharapkan:** langkah 3 menampilkan "Lengkapi profil Anda terlebih dahulu sebelum mengajukan langganan." tanpa baris baru. Langkah 4 menampilkan pesan yang sama beserta link **Lengkapi profil**, tanpa form.
- **Keadaan gagal yang dicek:** profil tidak lengkap menurut `isProfilLengkap()`.
- **Hasil uji terakhir:** belum diuji

## LGN-08: Belum login dan sesi idle

- **Kode tugas:** 1.1
- **Peran:** publik
- **Persiapan data:** tidak ada.
- **Langkah:**
  1. Logout, buka `/langganan`.
  2. Login sebagai A, buka `/langganan`, biarkan sampai sesi idle, lalu kirim form dan klik **Batalkan pengajuan** (jika ada).
- **Hasil yang diharapkan:** langkah 1 dialihkan ke halaman login. Langkah 2 menampilkan "Sesi Anda telah berakhir. Silakan untuk login ulang." dan database tidak berubah.
- **Keadaan gagal yang dicek:** belum login, sesi idle.
- **Hasil uji terakhir:** belum diuji

## LGN-09: Batalkan pengajuan sebelum siap_bayar

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** pengajuan A berstatus `menunggu_review`. Ulangi dengan `ditawarkan`, `negosiasi`, dan `disetujui_pelanggan` lewat `UPDATE pengajuan_langganan SET status = '<status>' WHERE id_pengajuan = <id pengajuan>;`
- **Langkah:**
  1. Klik **Batalkan pengajuan**, pilih **Cancel** di konfirmasi.
  2. Klik lagi, pilih **OK**.
- **Hasil yang diharapkan:** langkah 1 tidak mengubah apa pun. Langkah 2 mengubah kartu menjadi **Dibatalkan**, dengan form pengajuan baru di bawahnya. Di database `status = 'dibatalkan'` dan `diperbarui_pada` berubah.
- **Keadaan gagal yang dicek:** konfirmasi dibatalkan.
- **Hasil uji terakhir:** belum diuji

## LGN-10: Batal ditolak setelah siap_bayar

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** pengajuan A berstatus `menunggu_review`.
- **Langkah:**
  1. Buka `/langganan` sebagai A sampai tombol **Batalkan pengajuan** tampil.
  2. Di SQL Editor: `UPDATE pengajuan_langganan SET status = 'siap_bayar', harga_final = 150000 WHERE id_pengajuan = <id pengajuan>;`
  3. Klik **Batalkan pengajuan** di tab yang sudah terbuka, pilih **OK**.
  4. Muat ulang halaman.
- **Hasil yang diharapkan:** langkah 3 menampilkan "Pengajuan tidak dapat dibatalkan karena statusnya sudah berubah. Muat ulang halaman." dan status tetap `siap_bayar`. Langkah 4 menampilkan status **Siap bayar**, harga Rp150.000 / 30 hari, dan tombol **Bayar Rp 150.000**, tanpa tombol batal dan tanpa form baru.
- **Keadaan gagal yang dicek:** status berubah di tempat lain sebelum aksi dijalankan.
- **Hasil uji terakhir:** belum diuji

## LGN-11: Batal dengan ID salah atau milik akun lain

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** A dan B masing-masing punya pengajuan berstatus `menunggu_review`.
- **Langkah:**
  1. Login sebagai A. Lewat DevTools, ubah nilai input tersembunyi `idPengajuan` di form batal menjadi ID pengajuan B, lalu klik **Batalkan pengajuan**.
  2. Ulangi dengan nilai `abc`, `0`, `2.5`, dan kosong.
- **Hasil yang diharapkan:** langkah 1 menampilkan "Pengajuan tidak dapat dibatalkan karena statusnya sudah berubah. Muat ulang halaman." dan pengajuan B tetap `menunggu_review`. Langkah 2 menampilkan "Pengajuan tidak valid.".
- **Keadaan gagal yang dicek:** bukan pemilik data, ID tidak valid.
- **Hasil uji terakhir:** belum diuji

## LGN-12: Pengajuan ditolak, lalu mengajukan lagi

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** `UPDATE pengajuan_langganan SET status = 'ditolak', alasan_ditolak = 'Lokasi di luar jangkauan' WHERE id_pengajuan = <id pengajuan>;`
- **Langkah:**
  1. Buka `/langganan` sebagai A.
  2. Kirim pengajuan baru.
- **Hasil yang diharapkan:** langkah 1 menampilkan kartu **Ditolak** dengan "Alasan penolakan: Lokasi di luar jangkauan", tanpa tombol batal, dan form pengajuan baru di bawahnya. Langkah 2 tersimpan sebagai baris baru berstatus `menunggu_review`, dan halaman menampilkan pengajuan baru itu.
- **Keadaan gagal yang dicek:** pengajuan yang sudah selesai tidak menghalangi pengajuan baru.
- **Hasil uji terakhir:** belum diuji

## LGN-13: Keadaan langganan yang sudah dibayar

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** baris `data_langganan` untuk A, diganti per langkah:
  - aktif: `status_langganan = 'aktif'`, `tanggal_mulai_langganan = (now() AT TIME ZONE 'Asia/Jakarta')::date - 5`, `tanggal_akhir_langganan = (now() AT TIME ZONE 'Asia/Jakarta')::date`;
  - berakhir: seperti di atas, tetapi `tanggal_akhir_langganan = (now() AT TIME ZONE 'Asia/Jakarta')::date - 1`;
  - dihentikan: `status_langganan = 'dihentikan'`.
- **Langkah:** buka `/langganan` untuk setiap keadaan.
- **Hasil yang diharapkan:** kartu "Status langganan" tampil di atas, dengan badge **Aktif** (masih aktif pada hari terakhir), **Berakhir**, atau **Dihentikan** beserta tanggal mulai dan berakhir. Akun tanpa baris `data_langganan` tidak menampilkan kartu ini.
- **Keadaan gagal yang dicek:** batas tanggal hari ini dan kemarin, tanpa baris langganan.
- **Hasil uji terakhir:** belum diuji

## LGN-14: Pengajuan siap_bayar tanpa harga final

- **Kode tugas:** 1.1
- **Peran:** pelanggan
- **Persiapan data:** pengajuan A berstatus `menunggu_review`, lalu `UPDATE pengajuan_langganan SET status = 'siap_bayar', harga_final = NULL WHERE id_pengajuan = <id pengajuan>;`
- **Langkah:** buka `/langganan` sebagai A.
- **Hasil yang diharapkan:** halaman error "Data langganan gagal dimuat" dengan tombol **Coba lagi**, bukan halaman tanpa tombol bayar. Log server berisi "Pengajuan <id> berstatus siap_bayar tanpa harga_final."
- **Keadaan gagal yang dicek:** data rusak dibedakan dari data yang memang tidak ada (`CONTRIBUTING.md` bagian 8 no. 4).
- **Hasil uji terakhir:** belum diuji

## Data uji bersama untuk negosiasi

Jalankan di SQL Editor branch Neon pribadimu. Ganti `<id pengajuan>` dan `<id A>` dengan nilai sebenarnya.

```sql
-- Pengajuan A berstatus ditawarkan, harga usulan admin terakhir Rp100.000.
UPDATE pengajuan_langganan
SET status = 'ditawarkan', harga_final = NULL
WHERE id_pengajuan = <id pengajuan>;

INSERT INTO pesan_negosiasi (pengajuan_id, pengirim, id_pengirim, harga_usulan, pesan)
VALUES
  (<id pengajuan>, 'admin', <id A_admin>, 100000, 'Penawaran 100 ribu per 30 hari.');
```

## LGN-15: Setujui penawaran

- **Kode tugas:** 1.3
- **Peran:** pelanggan
- **Persiapan data:** pengajuan A `ditawarkan`, ada usulan admin Rp100.000.
- **Langkah:**
  1. Buka `/langganan` sebagai A.
  2. Pastikan kartu penawaran menampilkan `Rp 100.000 / 30 hari` dan tombol **Setujui harga**.
  3. Klik **Setujui harga**.
- **Hasil yang diharapkan:** kartu penawaran menampilkan tanda **"Perlu tindakan Anda"**, harga `Rp 100.000 / 30 hari`, dan tombol **Setujui harga**. Setelah klik **Setujui harga**, status menjadi **Disetujui pelanggan** dan `harga_final = 100000`. Halaman tidak lagi menampilkan tombol Setujui/Tawar maupun tanda "Perlu tindakan Anda". Riwayat negosiasi menampilkan pesan admin Rp100.000.
- **Keadaan gagal yang dicek:** lihat LGN-18.
- **Hasil uji terakhir:** belum diuji

## LGN-16: Tawar dengan harga valid

- **Kode tugas:** 1.3
- **Peran:** pelanggan
- **Persiapan data:** pengajuan A `ditawarkan`.
- **Langkah:**
  1. Isi "Tawarkan harga" `80000`, isi "Pesan" `Bisa 80 ribu?`, lalu klik **Tawar harga**.
- **Hasil yang diharapkan:** status menjadi **Negosiasi**, baris baru di `pesan_negosiasi` dengan `pengirim='pelanggan'`, `harga_usulan=80000`, `pesan='Bisa 80 ribu?'`. `harga_final` tetap NULL. Halaman menampilkan status Negosiasi dan riwayat pesan terbaru.
- **Keadaan gagal yang dicek:** lihat LGN-17.
- **Hasil uji terakhir:** belum diuji

## LGN-17: Tawar dengan harga 0, negatif, atau bukan angka

- **Kode tugas:** 1.3
- **Peran:** pelanggan
- **Persiapan data:** pengajuan A `ditawarkan`.
- **Langkah:**
  1. Isi harga `0`, klik **Tawar harga**.
  2. Isi harga `-50000`, klik.
  3. Isi harga `abc`, klik.
  4. Isi harga `123456.789` (lebih dari 2 desimal), klik.
- **Hasil yang diharapkan:** setiap langkah menampilkan pesan error di bawah form (misalnya "Harga harus lebih dari 0." / "Isian tidak valid.") dan status tetap `ditawarkan`, tidak ada baris baru di `pesan_negosiasi`.
- **Keadaan gagal yang dicek:** harga 0, negatif, bukan angka, desimal berlebih.
- **Hasil uji terakhir:** belum diuji

## LGN-18: Setuju di dua tab sekaligus / setujui tanpa usulan harga

- **Kode tugas:** 1.3
- **Peran:** pelanggan
- **Persiapan data:** pengajuan A `ditawarkan` dengan satu pesan admin berisi `harga_usulan`.
- **Langkah:**
  1. Buka `/langganan` sebagai A di dua tab.
  2. Klik **Setujui harga** di tab pertama.
  3. Tanpa memuat ulang tab kedua, klik **Setujui harga** di tab kedua.
  4. Siapkan lagi pengajuan `ditawarkan` dengan pesan admin berisi harga. Buka `/langganan` sampai tombol **Setujui harga** tampil, lalu di SQL Editor jalankan `UPDATE pesan_negosiasi SET harga_usulan = NULL WHERE pengajuan_id = <id pengajuan> AND pengirim = 'admin';` dan klik **Setujui harga** tanpa memuat ulang halaman.
  5. Muat ulang halaman.
- **Hasil yang diharapkan:**
  - Langkah 3: "Status pengajuan sudah berubah. Muat ulang halaman." (pesan gagal, bukan error 500). Status tetap `disetujui_pelanggan` dan `harga_final` tidak berubah.
  - Langkah 4: pesan yang sama. `WHERE EXISTS` di server tidak menemukan usulan admin berisi harga, sehingga status tetap `ditawarkan` dan `harga_final` tetap NULL.
  - Langkah 5: tidak ada tombol **Setujui harga**, dan yang tampil adalah "Penawaran harga tidak ditemukan. Silakan muat ulang halaman."
- **Keadaan gagal yang dicek:** dua tab menyetujui penawaran yang sama; setujui saat usulan admin berisi harga tidak ada, dicek di server dan di tampilan.
- **Hasil uji terakhir:** belum diuji

## LGN-19: Aksi ke pengajuan milik akun lain ditolak

- **Kode tugas:** 1.3
- **Peran:** pelanggan
- **Persiapan data:** A dan B masing-masing punya pengajuan `ditawarkan`.
- **Langkah:**
  1. Login sebagai A. Lewat DevTools, ubah nilai tersembunyi `idPengajuan` di form Setujui menjadi ID pengajuan B, lalu klik **Setujui harga**.
  2. Ulangi dengan form Tawar (harga `90000`) dan form pesan (`Halo`).
- **Hasil yang diharapkan:** ketiga aksi menampilkan pesan gagal (status berubah / tidak dapat dikirim) dan tidak ada perubahan di pengajuan B maupun di `pesan_negosiasi`. Pengajuan A tetap `ditawarkan`.
- **Keadaan gagal yang dicek:** bukan pemilik data.
- **Hasil uji terakhir:** belum diuji

## Data uji bersama untuk pembayaran

Jalankan di SQL Editor branch Neon pribadimu (`CONTRIBUTING.md` bagian 6.5). Ganti `<email akun uji>` dengan email akun berperan `user` yang profilnya sudah lengkap.

```sql
-- Batalkan pengajuan berjalan milik akun uji (satu pengajuan berjalan per akun).
UPDATE pengajuan_langganan
SET status = 'dibatalkan', diperbarui_pada = now()
WHERE id_user = (SELECT id_user FROM users WHERE email = '<email akun uji>')
  AND status NOT IN ('ditolak', 'dibatalkan');

-- Pengajuan yang sudah disepakati dan diaktifkan admin, harga final Rp150.000.
INSERT INTO pengajuan_langganan
  (id_user, nama_instansi, jenis_instansi, alamat_pengambilan, nama_pic, telp_pic,
   estimasi_ember, jenis_pelanggan, hari_pengambilan, jumlah_ember, harga_final, status)
VALUES
  ((SELECT id_user FROM users WHERE email = '<email akun uji>'),
   'Hotel Uji', 'hotel', 'Jl. Uji No. 1', 'PIC Uji', '081200000000',
   3, 'reguler', ARRAY[1, 3, 5], 3, 150000, 'siap_bayar');

-- Periksa hasil setelah membayar.
SELECT p.order_id, p.jumlah, p.status_pembayaran, l.status_langganan,
       l.tanggal_mulai_langganan, l.tanggal_akhir_langganan
FROM pembayaran_langganan p
JOIN data_langganan l ON l.id_langganan = p.langganan_id
WHERE l.id_user = (SELECT id_user FROM users WHERE email = '<email akun uji>')
ORDER BY p.tanggal_dibuat DESC;
```

Skenario yang menunggu notifikasi Midtrans memakai `pnpm build`, `pnpm start`, dan ngrok, dengan URL notifikasi di dashboard Midtrans sandbox diarahkan ke `https://<domain-ngrok>/api/midtrans/notification` (`CONTRIBUTING.md` bagian 5.1). Permintaan yang masuk dan responsnya bisa dilihat di `http://127.0.0.1:4040`.

## LGN-20: Membayar pengajuan siap_bayar sebagai langganan baru

- **Kode tugas:** 1.6
- **Peran:** pelanggan
- **Persiapan data:** data uji bersama. Akun uji belum punya baris `data_langganan`, atau tanggal akhirnya kemarin: `UPDATE data_langganan SET status_langganan = 'aktif', tanggal_akhir_langganan = (now() AT TIME ZONE 'Asia/Jakarta')::date - 1 WHERE id_user = …`.
- **Langkah:**
  1. Login dengan akun uji, buka `/langganan`.
  2. Pastikan tertulis `Rp 150.000 / 30 hari` dan tombol `Bayar Rp 150.000`.
  3. Klik tombol, selesaikan pembayaran di halaman Snap sandbox.
  4. Tunggu notifikasi masuk (cek `http://127.0.0.1:4040`), lalu muat ulang `/langganan`.
- **Hasil yang diharapkan:** Snap menagih Rp150.000. Notifikasi dijawab `200 {"received":true}`. Baris `pembayaran_langganan` terbaru: `jumlah` 150000.00, `status_pembayaran` `berhasil`. `data_langganan`: `aktif`, tanggal mulai hari ini, tanggal akhir hari ini + 29. Halaman menampilkan status Aktif.
- **Keadaan gagal yang dicek:** pembayaran dibatalkan di Snap tidak mengaktifkan langganan (lihat LGN-31).
- **Hasil uji terakhir:** belum diuji

## LGN-21: Perpanjangan langganan yang masih aktif

- **Kode tugas:** 1.6
- **Peran:** pelanggan
- **Persiapan data:** data uji bersama, lalu `data_langganan` akun uji `aktif` dengan tanggal akhir hari ini (kasus batas) atau hari ini + 5.
- **Langkah:** sama dengan LGN-20 langkah 1–4.
- **Hasil yang diharapkan:** tanggal mulai tetap, tanggal akhir bertambah 30 hari dari tanggal akhir lama (`CONTRIBUTING.md` bagian 9.7). Sebelum dan sesudah membayar, kartu "Status langganan" tampil di atas, dan tombol bayar tampil di kartu pengajuan karena status pengajuan tetap **Siap bayar**.
- **Keadaan gagal yang dicek:** tanggal akhir kemarin dihitung sebagai langganan baru, bukan perpanjangan (LGN-20).
- **Hasil uji terakhir:** belum diuji

## LGN-22: Tombol bayar tidak tampil sebelum siap_bayar

- **Kode tugas:** 1.6
- **Peran:** pelanggan
- **Persiapan data:** data uji bersama, lalu ubah status pengajuan menjadi `disetujui_pelanggan` (dan ulangi dengan `ditawarkan`).
- **Langkah:** buka `/langganan`.
- **Hasil yang diharapkan:** tidak ada tombol bayar. Kartu pengajuan menampilkan status **Disetujui pelanggan** dengan teks "Anda sudah menyetujui harga. Tim Waste and Wishes akan mengaktifkan pembayaran." (atau **Ditawarkan** dengan teks "Tim Waste and Wishes sudah mengirim penawaran harga untuk pengajuan Anda."). Harga disepakati tetap tampil karena `harga_final` di data uji sudah terisi.
- **Keadaan gagal yang dicek:** akun tanpa pengajuan sama sekali juga tidak melihat tombol.
- **Hasil uji terakhir:** belum diuji

## LGN-23: Server Action menolak ID pengajuan yang diubah atau sudah tidak siap_bayar

- **Kode tugas:** 1.6
- **Peran:** pelanggan
- **Persiapan data:** data uji bersama, dan satu pengajuan `siap_bayar` milik akun lain.
- **Langkah:**
  1. Buka `/langganan`. Di DevTools, ubah nilai `<input type="hidden" name="idPengajuan">` lalu klik tombol bayar. Ulangi untuk: ID pengajuan akun lain, `3abc`, kosong, `0`, `1.5`.
  2. Muat ulang halaman, lalu ubah status pengajuan akun uji menjadi `disetujui_pelanggan` lewat SQL tanpa memuat ulang halaman, dan klik tombol bayar.
- **Hasil yang diharapkan:** ID akun lain dan pengajuan yang statusnya sudah berubah: "Pengajuan belum siap dibayar. Muat ulang halaman." Isian `3abc`, kosong, `0`, `1.5`: "Pengajuan tidak valid." Tidak ada baris baru di `pembayaran_langganan` dan Snap tidak terbuka.
- **Keadaan gagal yang dicek:** ID salah, bukan pemilik data, status berubah di tab lain.
- **Hasil uji terakhir:** belum diuji

## LGN-24: Admin ditolak di Server Action

- **Kode tugas:** 1.6
- **Peran:** admin
- **Persiapan data:** data uji bersama.
- **Langkah:**
  1. Login dengan akun uji dan buka `/langganan` sampai tombol bayar tampil.
  2. Tanpa logout, ubah `users.peran` akun uji menjadi `'admin'` lewat SQL, lalu klik tombol bayar.
  3. Kembalikan `peran` menjadi `'user'` setelah selesai.
- **Hasil yang diharapkan:** "Hanya akun pelanggan yang dapat membayar langganan." Peran dibaca dari database, jadi penolakan berlaku walaupun token sesi masih membawa peran lama. Tidak ada baris baru di `pembayaran_langganan`.
- **Keadaan gagal yang dicek:** bukan akun `user`.
- **Hasil uji terakhir:** belum diuji

## LGN-25: Pelanggan yang dihentikan ditolak di Server Action

- **Kode tugas:** 1.6
- **Peran:** pelanggan
- **Persiapan data:** data uji bersama, lalu `UPDATE data_langganan SET status_langganan = 'dihentikan' WHERE id_user = …`.
- **Langkah:** buka `/langganan`, klik tombol bayar.
- **Hasil yang diharapkan:** "Langganan Anda dihentikan. Silakan hubungi admin." Tidak ada baris baru di `pembayaran_langganan`.
- **Keadaan gagal yang dicek:** status `dihentikan`.
- **Hasil uji terakhir:** belum diuji

## LGN-26: Notifikasi pembayaran tidak menimpa status dihentikan

- **Kode tugas:** 1.6
- **Peran:** pelanggan
- **Persiapan data:** data uji bersama, `data_langganan` akun uji bukan `dihentikan`.
- **Langkah:**
  1. Klik tombol bayar sampai halaman Snap terbuka, tetapi jangan bayar dulu.
  2. Ubah `status_langganan` akun uji menjadi `'dihentikan'` lewat SQL.
  3. Selesaikan pembayaran di Snap dan tunggu notifikasi.
- **Hasil yang diharapkan:** notifikasi dijawab `200 {"received":true}`. `pembayaran_langganan` menjadi `berhasil`, `data_langganan` tetap `dihentikan` dengan tanggal yang tidak berubah. Log server (`pnpm start`) berisi "Pembayaran lang-… berhasil, tetapi langganan dihentikan sehingga tidak diaktifkan."
- **Keadaan gagal yang dicek:** status berubah antara checkout dan notifikasi.
- **Hasil uji terakhir:** belum diuji

## LGN-27: Harga final tidak bulat ditolak

- **Kode tugas:** 1.6
- **Peran:** pelanggan
- **Persiapan data:** data uji bersama, lalu `UPDATE pengajuan_langganan SET harga_final = 150000.50 WHERE …`.
- **Langkah:** buka `/langganan`, klik tombol bayar.
- **Hasil yang diharapkan:** "Pembayaran belum dapat dibuat. Silakan hubungi admin." Log server berisi `harga_final pengajuan <id> tidak valid untuk Midtrans`. Tidak ada baris baru di `pembayaran_langganan`. Setelah `harga_final` dikembalikan ke 150000, tombol bisa dipakai lagi.
- **Keadaan gagal yang dicek:** data harga rusak.
- **Hasil uji terakhir:** belum diuji

## LGN-28: Belum login dan sesi idle

- **Kode tugas:** 1.6
- **Peran:** publik, pelanggan
- **Persiapan data:** data uji bersama.
- **Langkah:**
  1. Logout, buka `/langganan`.
  2. Login, buka `/langganan`, biarkan sampai melewati batas idle (`SESSION_IDLE_TIMEOUT_MS` di `lib/session.ts`), lalu klik tombol bayar.
- **Hasil yang diharapkan:** langkah 1 dialihkan ke halaman login. Langkah 2 menampilkan pesan sesi berakhir dari `requireLogin()`, atau halaman dialihkan ke login lebih dulu oleh pemantau idle. Tidak ada baris baru di `pembayaran_langganan`.
- **Keadaan gagal yang dicek:** belum login, sesi idle.
- **Hasil uji terakhir:** belum diuji

## LGN-29: Webhook menolak notifikasi yang tidak valid atau palsu

- **Kode tugas:** 1.6
- **Peran:** publik (siapa pun yang tahu URL webhook)
- **Persiapan data:** server uji berjalan lewat ngrok.
- **Langkah:** kirim permintaan berikut dari terminal:
  ```bash
  curl -i -X POST https://<domain-ngrok>/api/midtrans/notification -H "Content-Type: application/json" --data "bukan json"
  curl -i -X POST https://<domain-ngrok>/api/midtrans/notification -H "Content-Type: application/json" --data "{}"
  curl -i -X POST https://<domain-ngrok>/api/midtrans/notification -H "Content-Type: application/json" --data "{\"transaction_id\":\"palsu-123\",\"transaction_status\":\"settlement\"}"
  ```
- **Hasil yang diharapkan:** dua permintaan pertama dijawab `400 {"error":"Payload tidak valid."}`. Permintaan ketiga dijawab `500 {"error":"Notifikasi belum dapat diproses."}` karena Midtrans tidak mengenal transaksi itu. Tidak ada data yang berubah.
- **Keadaan gagal yang dicek:** body rusak, body tanpa `transaction_id`, notifikasi palsu yang mengaku `settlement`.
- **Hasil uji terakhir:** belum diuji

## LGN-30: Nominal yang tidak cocok ditolak webhook

- **Kode tugas:** 1.6
- **Peran:** pelanggan
- **Persiapan data:** data uji bersama.
- **Langkah:**
  1. Klik tombol bayar sampai Snap terbuka.
  2. Ubah `jumlah` baris `pembayaran_langganan` terbaru menjadi 1000 lewat SQL.
  3. Selesaikan pembayaran dan tunggu notifikasi.
- **Hasil yang diharapkan:** notifikasi dijawab `400 {"error":"Nominal transaksi tidak cocok."}`. Pembayaran tetap `pending`, langganan tidak berubah.
- **Keadaan gagal yang dicek:** jumlah tercatat berbeda dengan yang dibayar.
- **Hasil uji terakhir:** belum diuji

## LGN-31: Transaksi dibatalkan atau kedaluwarsa

- **Kode tugas:** 1.6
- **Peran:** pelanggan
- **Persiapan data:** data uji bersama.
- **Langkah:**
  1. Klik tombol bayar, pilih metode virtual account, jangan dibayar.
  2. Batalkan transaksi itu dari dashboard Midtrans sandbox (atau tunggu sampai kedaluwarsa).
- **Hasil yang diharapkan:** `pembayaran_langganan` menjadi `dibatalkan` (atau `kedaluwarsa`). `data_langganan` tidak berubah. Tombol bayar tetap tampil karena pengajuan masih `siap_bayar`.
- **Keadaan gagal yang dicek:** pembayaran tidak selesai.
- **Hasil uji terakhir:** belum diuji

## Data uji bersama untuk aksi admin

Login dengan akun `admin`, lalu buka `/admin/langganan/<id pengajuan>`. Pengajuan dibuat dari akun `user` A lewat `/langganan` (LGN-01). Aksi pelanggan (setujui harga, tawar) belum ada di aplikasi (kode tugas 1.3), jadi tawaran pelanggan disiapkan lewat SQL:

```sql
-- Tawaran pelanggan Rp150.000 setelah admin mengirim penawaran.
INSERT INTO pesan_negosiasi (pengajuan_id, pengirim, id_pengirim, harga_usulan, pesan)
VALUES (<id pengajuan>, 'pelanggan', <id A>, 150000, 'Bisa kurang sedikit?');
UPDATE pengajuan_langganan SET status = 'negosiasi', diperbarui_pada = now()
WHERE id_pengajuan = <id pengajuan>;

-- Periksa pesan dan status.
SELECT id_pesan, pengirim, id_pengirim, harga_usulan, pesan, dibuat_pada
FROM pesan_negosiasi WHERE pengajuan_id = <id pengajuan> ORDER BY dibuat_pada, id_pesan;
SELECT status, jenis_pelanggan, hari_pengambilan, jam_mulai, jam_selesai,
       jumlah_ember, harga_final, alasan_ditolak, diperbarui_pada
FROM pengajuan_langganan WHERE id_pengajuan = <id pengajuan>;
```

## LGN-40: Admin mengirim penawaran

- **Kode tugas:** 1.5
- **Peran:** admin
- **Persiapan data:** pengajuan A berstatus `menunggu_review`, belum ada pesan.
- **Langkah:**
  1. Buka detail pengajuan. Pastikan panel "Tindakan admin" menampilkan "Belum ada" di kedua harga terakhir, dan hari Senin, Rabu, Jumat sudah tercentang.
  2. Isi harga `175000`, pilih Reguler, kosongkan jam, isi jumlah ember `3` dan catatan "Harga termasuk ember.", lalu klik **Kirim penawaran**.
- **Hasil yang diharapkan:** badge berubah menjadi **Ditawarkan**, form penawaran hilang, "Penawaran terakhir admin" menampilkan Rp 175.000 / 30 hari beserta catatannya, dan "Rentang jam" menampilkan "Jam menyesuaikan WW". Di database: `status = 'ditawarkan'`, `jenis_pelanggan = 'reguler'`, `hari_pengambilan = {1,3,5}`, jam `NULL`, `jumlah_ember = 3`, **`harga_final` tetap `NULL`**, dan ada satu pesan baru `pengirim = 'admin'`, `id_pengirim` = id admin, `harga_usulan = 175000`. Halaman `/langganan` milik A menampilkan status **Ditawarkan**.
- **Keadaan gagal yang dicek:** lihat LGN-41 dan LGN-42.
- **Hasil uji terakhir:** belum diuji

## LGN-41: Isian penawaran tidak valid

- **Kode tugas:** 1.5
- **Peran:** admin
- **Persiapan data:** pengajuan berstatus `menunggu_review`.
- **Langkah:** kirim form penawaran dengan isian berikut satu per satu:
  1. Pilih MOU, kosongkan kedua jam.
  2. Isi jam mulai `08:00` saja.
  3. Isi jam `22:00` sampai `02:00`, lalu `08:00` sampai `08:00`.
  4. Harga `0`, `150000.5`, dan kosong.
  5. Hilangkan semua centang hari.
  6. Jumlah ember `0` dan `201`.
  7. Pilih MOU dengan jam `08:00` sampai `23:00`, isian lain benar.
- **Hasil yang diharapkan:** langkah 1–6 menampilkan "Periksa kembali isian yang ditandai." dan pesan di isian masing-masing: "Pelanggan MOU wajib punya rentang jam.", "Isi jam mulai dan jam selesai, atau kosongkan keduanya.", "Jam selesai harus setelah jam mulai.", "Harga harus lebih dari 0.", "Harga harus bilangan bulat rupiah.", "Pilih minimal satu hari pengambilan.", "Isi jumlah ember, minimal 1.", "Jumlah ember paling banyak 200.". Isian lain tetap terisi seperti yang diketik, dan database tidak berubah. Langkah 7 berhasil seperti LGN-40.
- **Keadaan gagal yang dicek:** MOU tanpa jam, jam tidak berpasangan, rentang lewat tengah malam, harga nol/desimal/kosong, tanpa hari, ember di luar batas.
- **Hasil uji terakhir:** belum diuji

## LGN-42: Penawaran ulang dan status yang sudah berubah

- **Kode tugas:** 1.5
- **Peran:** admin
- **Persiapan data:** pengajuan berstatus `negosiasi` dengan tawaran pelanggan (data uji bersama).
- **Langkah:**
  1. Buka detail. Form penawaran terisi syarat sebelumnya dan harga penawaran admin terakhir. Ubah harga menjadi `160000`, kirim.
  2. Buka detail pengajuan lain berstatus `menunggu_review` di dua tab. Kirim penawaran di tab pertama, lalu kirim lagi dari tab kedua tanpa memuat ulang.
- **Hasil yang diharapkan:** langkah 1 mengubah status menjadi `ditawarkan` dan menambah satu pesan admin `harga_usulan = 160000`; `harga_final` tetap `NULL`. Langkah 2: tab kedua menampilkan "Status pengajuan sudah berubah. Muat ulang halaman.", dan **tidak ada pesan admin kedua** di database.
- **Keadaan gagal yang dicek:** status berubah di tab lain; status dan pesan tidak boleh tersimpan sebagian.
- **Hasil uji terakhir:** belum diuji

## LGN-43: Admin menerima tawaran pelanggan

- **Kode tugas:** 1.5
- **Peran:** admin
- **Persiapan data:** pengajuan berstatus `negosiasi` dengan tawaran pelanggan Rp150.000 (data uji bersama).
- **Langkah:**
  1. Buka detail. "Tawaran terakhir pelanggan" menampilkan Rp 150.000 beserta pesannya, dan ada tombol **Terima tawaran Rp 150.000**.
  2. Tanpa memuat ulang halaman, sisipkan tawaran baru lewat SQL: `INSERT INTO pesan_negosiasi (pengajuan_id, pengirim, id_pengirim, harga_usulan) VALUES (<id pengajuan>, 'pelanggan', <id A>, 140000);`
  3. Klik **Terima tawaran Rp 150.000**, pilih **OK**.
  4. Muat ulang halaman, lalu klik **Terima tawaran Rp 140.000**, pilih **OK**.
  5. Ubah nilai input tersembunyi `idPesan` lewat DevTools menjadi `abc`, lalu klik tombol (ulangi di pengajuan `negosiasi` lain).
- **Hasil yang diharapkan:** langkah 3 menampilkan "Tawaran tidak bisa diterima: ada tawaran baru dari pelanggan atau status pengajuan sudah berubah. Muat ulang halaman." dan status tetap `negosiasi`. Langkah 4 mengubah status menjadi **Disetujui pelanggan**, dan `harga_final = 140000` (sama dengan tawaran pelanggan terakhir). Langkah 5 menampilkan "Tawaran tidak valid.".
- **Keadaan gagal yang dicek:** tawaran baru datang saat halaman terbuka, ID tawaran tidak valid.
- **Hasil uji terakhir:** belum diuji

## LGN-44: Admin mengaktifkan pembayaran

- **Kode tugas:** 1.5
- **Peran:** admin
- **Persiapan data:** pengajuan berstatus `disetujui_pelanggan` dengan `harga_final` terisi (hasil LGN-43).
- **Langkah:**
  1. Buka detail di dua tab. Klik **Aktifkan pembayaran** di tab pertama, pilih **OK**.
  2. Klik **Aktifkan pembayaran** di tab kedua tanpa memuat ulang.
  3. Siapkan pengajuan `disetujui_pelanggan` dengan `harga_final = NULL` lewat SQL, lalu klik **Aktifkan pembayaran**.
- **Hasil yang diharapkan:** langkah 1 mengubah status menjadi **Siap bayar**, panel menampilkan "Tidak ada tindakan admin untuk status ini.", dan `/langganan` milik A menampilkan tombol **Bayar**. Langkah 2 dan 3 menampilkan "Pembayaran tidak bisa diaktifkan: status pengajuan sudah berubah atau harga final belum ada. Muat ulang halaman." dan status tidak berubah.
- **Keadaan gagal yang dicek:** status bukan `disetujui_pelanggan`, harga final kosong.
- **Hasil uji terakhir:** belum diuji

## LGN-45: Admin menolak pengajuan

- **Kode tugas:** 1.5
- **Peran:** admin
- **Persiapan data:** satu pengajuan berstatus `menunggu_review` (ulangi dengan `ditawarkan`, `negosiasi`, `disetujui_pelanggan`) dan satu berstatus `siap_bayar`.
- **Langkah:**
  1. Kosongkan alasan, klik **Tolak pengajuan**, pilih **OK**.
  2. Isi alasan "Lokasi di luar jangkauan", klik **Tolak pengajuan**, pilih **Cancel**, lalu ulangi dan pilih **OK**.
  3. Buka pengajuan `siap_bayar` dan pastikan form tolak tidak tampil.
  4. Buka pengajuan lain berstatus `menunggu_review` sampai form tolak tampil. Tanpa memuat ulang, ubah statusnya menjadi `siap_bayar` lewat SQL (`UPDATE pengajuan_langganan SET status = 'siap_bayar', harga_final = 150000 WHERE id_pengajuan = <id pengajuan>;`), lalu isi alasan dan kirim form tolak.
- **Hasil yang diharapkan:** langkah 1 menampilkan "Alasan penolakan wajib diisi.". Langkah 2: **Cancel** tidak mengubah apa pun; **OK** mengubah status menjadi **Ditolak**, `alasan_ditolak` terisi, dan `/langganan` milik A menampilkan alasan itu beserta form pengajuan baru. Langkah 3: form tolak tidak tampil. Langkah 4 menampilkan "Pengajuan tidak bisa ditolak karena statusnya sudah berubah. Muat ulang halaman.", alasan yang diketik tetap ada, dan status tetap `siap_bayar`.
- **Keadaan gagal yang dicek:** alasan kosong, tolak setelah `siap_bayar`.
- **Hasil uji terakhir:** belum diuji

## LGN-46: Admin mengirim pesan tanpa harga

- **Kode tugas:** 1.5
- **Peran:** admin
- **Persiapan data:** pengajuan berstatus `menunggu_review` (ulangi dengan `ditawarkan` dan `negosiasi`), dan satu berstatus `ditolak`.
- **Langkah:**
  1. Kirim pesan kosong.
  2. Kirim pesan "Kami cek lokasi besok."
  3. Buka pengajuan `ditolak`.
- **Hasil yang diharapkan:** langkah 1 menampilkan "Pesan wajib diisi.". Langkah 2 menampilkan "Pesan terkirim.", status tidak berubah, dan ada pesan baru `pengirim = 'admin'` dengan `harga_usulan = NULL`. Di pengajuan `ditolak`, form pesan tidak tampil.
- **Keadaan gagal yang dicek:** pesan kosong, status yang tidak lagi menerima pesan.
- **Hasil uji terakhir:** belum diuji

## LGN-47: Bukan admin, belum login, sesi idle, dan ID salah

- **Kode tugas:** 1.5
- **Peran:** pelanggan, publik
- **Persiapan data:** pengajuan berstatus `menunggu_review`.
- **Langkah:**
  1. Login sebagai admin, buka detail pengajuan sampai semua form tampil. Di SQL Editor ubah `peran` akun admin itu menjadi `'user'` tanpa logout, lalu coba setiap aksi (kirim penawaran, kirim pesan, tolak). Kembalikan `peran` menjadi `'admin'`.
  2. Buka detail sampai form tampil, biarkan sampai sesi idle, lalu coba setiap aksi.
  3. Lewat DevTools ubah input tersembunyi `idPengajuan` menjadi `abc`, `0`, lalu ID yang tidak ada, dan kirim penawaran.
  4. Buka `/admin/langganan/abc` dan `/admin/langganan/999999`.
- **Hasil yang diharapkan:** langkah 1 menampilkan "Akses khusus admin." di setiap aksi (peran dicek ulang di database). Langkah 2 menampilkan "Sesi Anda telah berakhir. Silakan untuk login ulang." Langkah 3: `abc` dan `0` menampilkan "Pengajuan tidak valid."; ID yang tidak ada menampilkan "Status pengajuan sudah berubah. Muat ulang halaman.". Langkah 4 menampilkan halaman 404. Database tidak berubah di semua langkah.
- **Keadaan gagal yang dicek:** bukan admin, sesi idle, ID salah.
- **Hasil uji terakhir:** belum diuji

## LGN-48: Riwayat negosiasi di detail admin

- **Kode tugas:** 1.5 (komponen `RiwayatNegosiasi` dari 1.2)
- **Peran:** admin
- **Persiapan data:** pengajuan A berstatus `menunggu_review`, belum ada pesan. Untuk langkah 2, jalankan SQL ini dengan `<id admin>` diganti `id_user` akun admin:
  ```sql
  -- Tiga pesan dalam satu perintah, jadi dibuat_pada ketiganya sama dan urutannya ditentukan id_pesan.
  INSERT INTO pesan_negosiasi (pengajuan_id, pengirim, id_pengirim, harga_usulan, pesan)
  VALUES
    (<id pengajuan>, 'admin', <id admin>, 175000, 'Harga termasuk ember.'),
    (<id pengajuan>, 'pelanggan', <id A>, 150000, NULL),
    (<id pengajuan>, 'pelanggan', <id A>, NULL, E'Baris pertama\nBaris kedua');
  UPDATE pengajuan_langganan SET status = 'negosiasi', diperbarui_pada = now()
  WHERE id_pengajuan = <id pengajuan>;
  ```
- **Langkah:**
  1. Buka detail pengajuan sebelum SQL dijalankan.
  2. Jalankan SQL di atas, lalu muat ulang halaman.
  3. Kirim penawaran baru `160000` dari form penawaran.
- **Hasil yang diharapkan:**
  - Langkah 1: bagian "Riwayat negosiasi" menampilkan "Belum ada pesan negosiasi."
  - Langkah 2: tiga pesan tampil urut dari yang terlama, sesuai urutan di SQL:
    - pesan pertama dari "Admin WW", dengan "Usulan harga: Rp 175.000 / 30 hari" dan catatannya;
    - pesan kedua atas nama instansi, dengan harga saja tanpa teks pesan;
    - pesan ketiga atas nama instansi, berisi teks dua baris tanpa baris harga.
  - Ketiga pesan menampilkan waktu yang sama, dalam WIB.
  - Di panel tindakan, "Penawaran terakhir admin" Rp 175.000 dan "Tawaran terakhir pelanggan" Rp 150.000. Pesan tanpa harga tidak menggeser ringkasan ini.
  - Langkah 3: pesan admin Rp 160.000 muncul paling bawah setelah aksi selesai, dan "Penawaran terakhir admin" menjadi Rp 160.000.
- **Keadaan gagal yang dicek:** belum ada pesan, waktu simpan yang sama persis, pesan tanpa harga, pesan tanpa teks, teks bergaris baru.
- **Hasil uji terakhir:** belum diuji

## LGN-49: URL lama jadwal rutin dan janjian dialihkan ke /langganan

- **Kode tugas:** 1.7
- **Peran:** pelanggan
- **Persiapan data:** tidak ada.
- **Langkah:**
  1. Login sebagai A, buka `/langganan/buat-jadwal-rutin`.
  2. Buka `/langganan/buat-jadwal-janjian`.
  3. Logout, buka `/langganan/buat-jadwal-rutin` dan `/langganan/buat-jadwal-janjian` lagi.
- **Hasil yang diharapkan:** langkah 1 dan 2 langsung dialihkan ke `/langganan`, tanpa form jadwal, tanpa tabel permintaan, dan tanpa pesan status. Langkah 3 dulu dialihkan ke halaman login, lalu ke `/langganan`. URL tidak menampilkan form yang bisa dipakai membuat jadwal.
- **Keadaan gagal yang dicek:** belum login, sesi idle.
- **Hasil uji terakhir:** belum diuji

## LGN-50: Server Action jadwal lama menolak semua panggilan

- **Kode tugas:** 1.7
- **Peran:** pelanggan
- **Persiapan data:** tidak ada.
- **Langkah:**
  1. Login sebagai A. Lewat DevTools di `/langganan`, kirim `simpanJadwalRutin` (action `buat-jadwal-rutin`) dengan isian apa pun, misalnya `hari1=Senin`, `jam1=08:00`, `hari2=Rabu`, `jam2=09:00`, `mode=baru`.
  2. Ulangi untuk `ajukanJadwalJanjian` (action `buat-jadwal-janjian`) dengan isian `tanggalJanjian`, `jamPengambilan`, dan `keteranganTujuan` apa pun.
  3. Periksa database.
- **Hasil yang diharapkan:** kedua panggilan langsung mengalihkan ke `/langganan` tanpa menyimpan apa pun. Tidak ada baris baru di `jadwal`, `jadwal_rutin`, maupun `jadwal_janjian`.
- **Keadaan gagal yang dicek:** input valid dan tidak valid sama-sama ditolak; Server Action dipanggil langsung tanpa halaman (CONTRIBUTING 7.1).
- **Hasil uji terakhir:** belum diuji
