# Skenario uji: langganan

Nomor `LGN-01` sampai `LGN-19` disediakan untuk alur pengajuan dan negosiasi (kode tugas 1.1–1.5). Nomor `LGN-20` ke atas untuk pembayaran (kode tugas 1.6).

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
- **Hasil yang diharapkan:** tanggal mulai tetap, tanggal akhir bertambah 30 hari dari tanggal akhir lama (`CONTRIBUTING.md` bagian 9.7). Tombol bayar tampil di bagian perpanjangan.
- **Keadaan gagal yang dicek:** tanggal akhir kemarin dihitung sebagai langganan baru, bukan perpanjangan (LGN-20).
- **Hasil uji terakhir:** belum diuji

## LGN-22: Tombol bayar tidak tampil sebelum siap_bayar

- **Kode tugas:** 1.6
- **Peran:** pelanggan
- **Persiapan data:** data uji bersama, lalu ubah status pengajuan menjadi `disetujui_pelanggan` (dan ulangi dengan `ditawarkan`).
- **Langkah:** buka `/langganan`.
- **Hasil yang diharapkan:** tidak ada harga dan tombol bayar. Pelanggan yang belum aktif melihat teks "Tombol bayar muncul setelah harga pengajuan Anda disepakati dan pembayaran diaktifkan admin."
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
