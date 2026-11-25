# Skenario uji: langganan

LGN-01 sampai LGN-19 untuk halaman pelanggan dan pengajuan (kode tugas 1.1 dan seterusnya). LGN-20 ke atas untuk pembayaran (kode tugas 1.6).

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
- **Hasil yang diharapkan:** langkah 3 menampilkan "Pengajuan tidak dapat dibatalkan karena statusnya sudah berubah. Muat ulang halaman." dan status tetap `siap_bayar`. Langkah 4 menampilkan status **Siap bayar** dan harga Rp150.000 / 30 hari, tanpa tombol batal dan tanpa form baru.
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
