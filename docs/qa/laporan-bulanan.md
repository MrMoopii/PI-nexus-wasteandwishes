# Skenario uji: laporan bulanan

Nomor `LPR-01` ke atas disediakan untuk halaman laporan bulanan admin (kode tugas 2.5).

Data uji diisi lewat SQL Editor Neon di branch pribadi (`CONTRIBUTING.md` bagian 6.5). Ganti `<bulan ini>` dengan `YYYY-MM` bulan ini, `<bulan kemarin>` dengan `YYYY-MM` bulan kemarin, dan ID-nya dengan nilai sebenarnya.

## LPR-01: Total berat per instansi sama dengan jumlah berat kunjungannya

- **Kode tugas:** 2.5
- **Peran:** admin
- **Persiapan data:** dua pelanggan dengan pengajuan, masing-masing punya dua kunjungan berstatus `ditimbang` di bulan yang sama, berat berbeda-beda.
- **Langkah:**
  1. Login sebagai admin, buka `/admin/laporan-bulanan?bulan=<bulan ini>`.
  2. Cocokkan total berat di kartu masing-masing instansi dengan jumlah berat baris-barisnya di tabel.
- **Hasil yang diharapkan:** total di kartu dan total di baris "Total semua instansi" sama dengan jumlah berat per instansinya di bulan itu. Kunjungan di bulan lain tidak ikut terhitung. Kolom jam tampil seperti "08.00–10.00 WIB", atau "Jam menyesuaikan WW" untuk kunjungan tanpa jam.
- **Keadaan gagal yang dicek:** bulan berbeda, kunjungan di luar bulan yang difilter.
- **Hasil uji terakhir:** belum diuji

## LPR-02: Kunjungan yang belum ditimbang, dilewati, atau batal tidak ikut

- **Kode tugas:** 2.5
- **Peran:** admin
- **Persiapan data:** kunjungan milik pelanggan dengan status `dijadwalkan`, `diambil`, `tertunda`, `batal`, dan `dilewati`, masing-masing satu.
- **Langkah:** buka `/admin/laporan-bulanan?bulan=<bulan ini>` (atau bulan yang sesuai tanggal kunjungannya).
- **Hasil yang diharapkan:** hanya kunjungan berstatus `ditimbang` yang tampil. Baris status lain tidak muncul sama sekali, dan tidak ikut dalam total.
- **Keadaan gagal yang dicek:** status selain `ditimbang`.
- **Hasil uji terakhir:** belum diuji

## LPR-03: Hasil cetak rapi di kertas A4, tanpa menu dan tombol

- **Kode tugas:** 2.5
- **Peran:** admin
- **Persiapan data:** data LPR-01.
- **Langkah:**
  1. Buka `/admin/laporan-bulanan?bulan=<bulan ini>`.
  2. Klik tombol **Cetak** (atau `Ctrl+P`).
  3. Pilih "Save as PDF" dengan ukuran kertas A4, lalu buka PDF-nya.
- **Hasil yang diharapkan:** PDF berisi judul laporan dengan nama bulan dan tahun (misalnya "Laporan Bulanan November 2026", bukan "1 November 2026"), tabel per instansi, dan baris total saja. Sidebar admin, header admin, form filter, dan tombol cetak tidak ikut tercetak.
- **Keadaan gagal yang dicek:** elemen UI layar ikut masuk ke hasil cetak, judul memakai tanggal alih-alih nama bulan.
- **Hasil uji terakhir:** belum diuji

## LPR-04: Akun bukan admin ditolak

- **Kode tugas:** 2.5
- **Peran:** pelanggan, publik
- **Persiapan data:** akun `user` biasa, dan keadaan logout.
- **Langkah:**
  1. Login sebagai `user`, buka `/admin/laporan-bulanan`.
  2. Logout, buka `/admin/laporan-bulanan` lagi.
- **Hasil yang diharapkan:** langkah 1 dialihkan keluar dari halaman admin (sesuai pemeriksaan admin di `AdminLayoutClient`). Langkah 2 dialihkan ke halaman login.
- **Keadaan gagal yang dicek:** bukan admin, belum login.
- **Hasil uji terakhir:** belum diuji

## LPR-05: Bulan atau instansi di URL tidak valid menjadi 404

- **Kode tugas:** 2.5
- **Peran:** admin
- **Persiapan data:** tidak ada.
- **Langkah:**
  1. Buka `/admin/laporan-bulanan?bulan=2026-13`.
  2. Buka `/admin/laporan-bulanan?bulan=abc`.
  3. Buka `/admin/laporan-bulanan?instansi=abc`.
  4. Buka `/admin/laporan-bulanan?instansi=0`.
- **Hasil yang diharapkan:** keempatnya menampilkan halaman 404, bukan tabel kosong.
- **Keadaan gagal yang dicek:** format bulan salah, instansi bukan angka positif.
- **Hasil uji terakhir:** belum diuji

## LPR-06: Filter instansi tertentu

- **Kode tugas:** 2.5
- **Peran:** admin
- **Persiapan data:** dua pelanggan berbeda pengajuan, masing-masing punya kunjungan `ditimbang` di bulan yang sama.
- **Langkah:**
  1. Buka `/admin/laporan-bulanan?bulan=<bulan ini>&instansi=<id pengajuan A>`.
- **Hasil yang diharapkan:** hanya kartu instansi A yang tampil, total "semua instansi" hanya menghitung instansi A.
- **Keadaan gagal yang dicek:** instansi tidak ada di bulan itu, instansi milik pelanggan lain.
- **Hasil uji terakhir:** belum diuji

## LPR-07: Halaman terbuka dan tombol Cetak membuka dialog cetak

- **Kode tugas:** 2.5 (#185)
- **Peran:** admin
- **Persiapan data:** data LPR-01.
- **Langkah:**
  1. Login sebagai admin, buka `/admin/laporan-bulanan`.
  2. Klik tombol **Cetak**, lalu tutup dialognya.
  3. Ulangi langkah 1–2 di Preview Vercel, lalu buka Runtime Logs deployment itu.
- **Hasil yang diharapkan:** halaman menampilkan form filter, tombol **Cetak**, dan tabel laporan, bukan "This page couldn't load". Klik **Cetak** membuka dialog cetak browser. Runtime Logs tidak berisi error baru untuk `/admin/laporan-bulanan`, misalnya "Event handlers cannot be passed to Client Component props".
- **Keadaan gagal yang dicek:** isi halaman gagal dirender di server karena tombol yang memasang `onClick` tanpa `"use client"` (bug #185).
- **Hasil uji terakhir:** belum diuji

## LPR-08: Isian filter kosong tidak menjadi 404

- **Kode tugas:** 2.5 (#185)
- **Peran:** admin
- **Persiapan data:** data LPR-06.
- **Langkah:**
  1. Buka `/admin/laporan-bulanan?bulan=<bulan ini>&instansi=<id pengajuan A>`, pilih **Semua instansi**, lalu klik **Tampilkan**.
  2. Kosongkan isian bulan, lalu klik **Tampilkan**.
  3. Buka `/admin/laporan-bulanan?bulan=&instansi=<id pengajuan A>`.
  4. Buka `/admin/laporan-bulanan?bulan=2026-13`, lalu `/admin/laporan-bulanan?instansi=abc`.
- **Hasil yang diharapkan:** langkah 1 menampilkan semua instansi di bulan itu, dengan URL `?bulan=<bulan ini>&instansi=`. Langkah 2 (URL `?bulan=&instansi=`) menampilkan bulan ini (WIB) untuk semua instansi, dan isian bulan kembali terisi bulan ini. Langkah 3 menampilkan bulan ini untuk instansi A saja. Langkah 4 tetap menampilkan halaman 404.
- **Keadaan gagal yang dicek:** isian kosong dari form GET dianggap tidak difilter, isian yang diisi tetapi salah tetap ditolak.
- **Hasil uji terakhir:** belum diuji

## LPR-09: Dropdown instansi tetap lengkap dan sesuai filter

- **Kode tugas:** 2.5 (#185)
- **Peran:** admin
- **Persiapan data:** instansi A dan B masing-masing punya kunjungan `ditimbang` di bulan ini, hanya A yang punya kunjungan `ditimbang` di bulan kemarin, dan instansi C punya kunjungan tetapi belum ada yang `ditimbang`. `<bulan tanpa data>` adalah bulan tanpa kunjungan `ditimbang` sama sekali.
- **Langkah:**
  1. Buka `/admin/laporan-bulanan?bulan=<bulan ini>`, lalu buka dropdown instansi.
  2. Pilih instansi A, klik **Tampilkan**, lalu buka dropdown lagi.
  3. Buka `/admin/laporan-bulanan?bulan=<bulan kemarin>`.
  4. Buka `/admin/laporan-bulanan?bulan=<bulan tanpa data>&instansi=<id pengajuan B>`.
- **Hasil yang diharapkan:** di setiap langkah dropdown berisi **Semua instansi**, A, dan B (urut nama), tidak berisi C, dan tidak menyempit. Pilihan yang terpilih mengikuti URL: langkah 2 memilih A; langkah 3 tetap **Semua instansi** walaupun hanya A yang punya data di bulan itu; langkah 4 memilih B, dengan pesan "Belum ada kunjungan ditimbang di bulan ini untuk filter yang dipilih."
- **Keadaan gagal yang dicek:** setelah satu instansi dipilih, bulan tanpa data, hanya satu instansi yang punya data, instansi yang belum pernah ditimbang.
- **Hasil uji terakhir:** belum diuji

## LPR-10: Instansi yang tidak ada di pilihan menjadi 404

- **Kode tugas:** 2.5 (#185)
- **Peran:** admin
- **Persiapan data:** instansi C dari LPR-09, satu pengajuan tanpa kunjungan sama sekali (misalnya masih `menunggu_review`), dan satu ID yang tidak ada: `SELECT max(id_pengajuan) + 1 FROM pengajuan_langganan;`.
- **Langkah:**
  1. Buka `/admin/laporan-bulanan?instansi=<id pengajuan C>`.
  2. Buka `/admin/laporan-bulanan?instansi=<id pengajuan tanpa kunjungan>`.
  3. Buka `/admin/laporan-bulanan?instansi=<id yang tidak ada>`.
  4. Catat satu kunjungan C sampai ditimbang di `/admin/kunjungan` (ember, lalu berat), lalu ulangi langkah 1.
- **Hasil yang diharapkan:** langkah 1–3 menampilkan halaman 404, bukan tabel kosong dengan dropdown **Semua instansi**. Setelah langkah 4, C muncul di dropdown dan langkah 1 tidak lagi 404 (berat C tampil jika kunjungannya di bulan ini).
- **Keadaan gagal yang dicek:** ID instansi tidak ditemukan, pengajuan tanpa kunjungan, instansi yang belum pernah ditimbang (`CONTRIBUTING.md` bagian 9.3).
- **Hasil uji terakhir:** belum diuji

## LPR-11: Menu Laporan Bulanan dan menu admin lain

- **Kode tugas:** 2.5 (#185)
- **Peran:** admin
- **Persiapan data:** satu pengajuan apa pun untuk langkah 4.
- **Langkah:**
  1. Login sebagai admin, buka `/admin`.
  2. Klik **Laporan Bulanan** di sidebar (kategori Navigation, di bawah **Pencatatan Kunjungan**). Pilih bulan, lalu klik **Tampilkan**.
  3. Klik setiap menu sidebar satu per satu: Dashboard, Data Pengguna, Langganan, Buat Kunjungan, Hari Libur, Pencatatan Kunjungan, Laporan Bulanan, Data Event, Peserta Event, Produk, Laporan.
  4. Buka halaman di bawah salah satu menu, misalnya `/admin/langganan/<id pengajuan>`.
- **Hasil yang diharapkan:** di langkah 2 menu **Laporan Bulanan** aktif, juga setelah URL berisi `?bulan=` dan `?instansi=`. Di langkah 3 setiap menu membuka halamannya dan hanya menu itu yang aktif; **Laporan** (`/admin/reports`) dan **Laporan Bulanan** tidak pernah aktif bersamaan. Berpindah lewat sidebar tidak memuat ulang seluruh halaman: sidebar tetap di tempat dan layar memuat admin tidak muncul lagi. Di langkah 4 menu **Langganan** aktif.
- **Keadaan gagal yang dicek:** menu tidak aktif karena ada query string, dua menu aktif bersamaan, menu tidak bisa diklik setelah impor diganti ke `next/link` dan `next/navigation`.
- **Hasil uji terakhir:** belum diuji

## LPR-12: Halaman error saat laporan gagal dimuat

- **Kode tugas:** 2.5 (#185)
- **Peran:** admin
- **Persiapan data:** sudah login sebagai admin di `pnpm dev`.
- **Langkah:**
  1. Ubah sementara password di `DATABASE_URL` pada `.env.local` (file ini tidak ikut Git), lalu jalankan ulang `pnpm dev`.
  2. Buka `/admin/laporan-bulanan` dengan sesi admin yang masih aktif. Tutup overlay error Next.js jika muncul.
  3. Klik **Coba lagi**.
  4. Kembalikan `DATABASE_URL`, jalankan ulang `pnpm dev`, lalu muat ulang halaman.
- **Hasil yang diharapkan:** langkah 2 dan 3 menampilkan "Laporan bulanan gagal dimuat" dengan tombol **Coba lagi** di dalam tampilan admin (sidebar tetap ada), bukan "This page couldn't load". Log server berisi error koneksi database. Setelah langkah 4, laporan tampil lagi.
- **Keadaan gagal yang dicek:** query database gagal (`CONTRIBUTING.md` bagian 9.4).
- **Hasil uji terakhir:** belum diuji
