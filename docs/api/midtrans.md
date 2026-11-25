# Route Midtrans

Kontrak route di `app/api/midtrans/`. Pemanggilnya hanya Midtrans, jadi perubahan kode status atau bentuk respons dibicarakan dulu dengan pemegang pembayaran (`CONTRIBUTING.md` bagian 9.5).

## POST /api/midtrans/notification

- **File:** `app/api/midtrans/notification/route.ts`
- **Siapa yang boleh memanggil:** Midtrans (HTTP notification). Tidak memakai sesi. Isi body tidak dipercaya: status transaksi selalu dibaca ulang dari Midtrans lewat `getMidtransSnap().transaction.notification()`, sehingga notifikasi palsu tidak bisa mengaktifkan langganan atau pendaftaran event.
- **Dipanggil dari:** URL notifikasi pembayaran di dashboard Midtrans (sandbox diarahkan ke ngrok, `CONTRIBUTING.md` bagian 5.1). Tidak ada halaman atau komponen di repo yang memanggilnya.
- **Input:** body JSON notifikasi Midtrans.
  - Body divalidasi dengan `skemaPayloadNotifikasi` di `features/langganan/validasi/pembayaran.ts`. Hanya `transaction_id` (teks, wajib) yang dipakai.
  - Data hasil verifikasi Midtrans divalidasi dengan `skemaNotifikasiMidtrans` di file yang sama: `order_id`, `transaction_status`, `gross_amount` (teks desimal, misalnya `"150000.00"`), `transaction_id` dan `fraud_status` (boleh kosong).
- **Pemrosesan** (setelah verifikasi):
  1. `order_id` dicari di `pembayaran_event`. Jika ada, diproses sebagai pembayaran event (tabel di bawah), lalu selesai.
  2. Jika tidak ada, dicari di `pembayaran_langganan`.
  3. `gross_amount` harus sama dengan kolom `jumlah` pembayaran itu. Untuk langganan, `jumlah` diisi `mulaiPembayaranLangganan()` dari `pengajuan_langganan.harga_final`.

  | `transaction_status` dari Midtrans              | Pembayaran langganan berstatus `pending`                                                                                                                                                                                                  | Pembayaran event berstatus `pending`/`memproses`                         |
  | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
  | `settlement`, atau `capture` dengan `fraud_status` `accept` | Pembayaran menjadi `berhasil`. `data_langganan` menjadi `aktif` 30 hari: perpanjangan jika tanggal akhir ≥ hari ini (WIB), selain itu langganan baru (`CONTRIBUTING.md` bagian 9.7). Status `dihentikan` **tidak** ditimpa: pembayaran tetap `berhasil`, langganan tidak berubah, dan server mencatat `console.error` untuk ditindaklanjuti admin | `selesaikanPembayaranEvent()` di `lib/pembayaran-event.ts`               |
  | `expire` / `cancel`                             | Pembayaran menjadi `kedaluwarsa` / `dibatalkan`. Langganan tidak berubah                                                                                                                                                                  | Pembayaran menjadi `kedaluwarsa` / `dibatalkan`                          |
  | `pending`                                       | Hanya menyimpan `midtrans_transaction_id`                                                                                                                                                                                                 | Hanya menyimpan `midtrans_transaction_id`                                |
  | lainnya (`deny`, `refund`, …)                   | Diabaikan                                                                                                                                                                                                                                 | Diabaikan                                                                |

  Pembayaran yang sudah tidak `pending` (misalnya notifikasi ulang untuk transaksi yang sudah `berhasil`) tidak diubah lagi.

- **Respons sukses:** `200` dengan bentuk `{ "received": true }`. Dikirim juga untuk status yang diabaikan, notifikasi ulang, dan pembayaran langganan yang dihentikan, supaya Midtrans tidak mengirim ulang.
- **Respons gagal:**
  - `400` `{ "error": "Payload tidak valid." }`: body bukan JSON, atau tidak berisi `transaction_id` berupa teks.
  - `400` `{ "error": "Nominal transaksi tidak cocok." }`: `gross_amount` dari Midtrans berbeda dengan `jumlah` yang dicatat (event maupun langganan).
  - `404` `{ "error": "Transaksi tidak ditemukan." }`: `order_id` tidak ada di `pembayaran_event` maupun `pembayaran_langganan`.
  - `500` `{ "error": "Notifikasi belum dapat diproses." }`: pengecekan ke Midtrans gagal (misalnya `transaction_id` tidak dikenal Midtrans atau kunci server salah), data dari Midtrans tidak sesuai `skemaNotifikasiMidtrans`, atau query database gagal. Penyebabnya dicatat dengan `console.error`.
- **Catatan:** Midtrans mengirim ulang notifikasi yang dijawab selain `2xx`. Semua perubahan status memakai `WHERE status_pembayaran = 'pending'` (atau `IN ('pending', 'memproses')` untuk event), sehingga notifikasi yang dikirim ulang tidak mengubah data dua kali.
