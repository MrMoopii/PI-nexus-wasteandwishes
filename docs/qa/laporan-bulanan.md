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
- **Hasil yang diharapkan:** total di kartu dan total di baris "Total semua instansi" sama dengan jumlah berat per instansinya di bulan itu. Kunjungan di bulan lain tidak ikut terhitung.
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
- **Hasil yang diharapkan:** PDF berisi judul laporan, tabel per instansi, dan baris total saja. Sidebar admin, header admin, form filter, dan tombol cetak tidak ikut tercetak.
- **Keadaan gagal yang dicek:** elemen UI layar ikut masuk ke hasil cetak.
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
