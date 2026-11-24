# docs/api

Kontrak setiap route di `app/api/`. Kontrak adalah janji ke pemanggilnya (halaman, komponen klien, atau Midtrans): kode status dan bentuk respons tidak boleh berubah diam-diam (`CONTRIBUTING.md` bagian 9.5).

## Template

Satu file per kelompok route, misalnya `admin-users.md` untuk semua route di `app/api/admin/users/`. Setiap route ditulis dengan pola ini:

```md
## <METHOD> /api/<alamat>

- **File:** `app/api/<alamat>/route.ts`
- **Siapa yang boleh memanggil:** publik | pelanggan yang login (`requireLogin()`) | admin (`requireAdmin()`) | Midtrans
- **Dipanggil dari:** <file halaman atau komponen yang memanggilnya>
- **Input:** <parameter URL, query string, atau body beserta skema Zod-nya di `features/<fitur>/validasi/`>
- **Respons sukses:** `<kode>` dengan bentuk `<contoh JSON>`
- **Respons gagal:**
  - `400` input tidak valid
  - `401` belum login atau sesi idle
  - `403` sudah login tetapi tidak berhak
  - `404` data tidak ditemukan
  - `500` kesalahan server
```

Hapus baris respons gagal yang memang tidak mungkin terjadi di route itu, dan tambahkan yang khusus (misalnya `409` jika status sudah berubah).

## Route yang sudah ada

Daftar ini diambil dari `app/api/` saat folder `docs/` dibuat. Kontraknya belum ditulis. Tulis kontrak sebuah route di PR berikutnya yang menyentuh route itu, lalu beri tautan ke filenya di kolom terakhir.

| Method       | Route                                           | Kontrak          |
| ------------ | ----------------------------------------------- | ---------------- |
| GET          | `/api/admin/imagekit-auth`                      | belum            |
| GET          | `/api/admin/jadwal-pengambilan`                 | belum            |
| PATCH DELETE | `/api/admin/jadwal-pengambilan/[id]`            | belum            |
| POST         | `/api/admin/jadwal-pengambilan/[id]/collection` | belum            |
| GET          | `/api/admin/jadwal-pengambilan/stats`           | belum            |
| GET          | `/api/admin/pelanggan`                          | belum            |
| GET          | `/api/admin/recent-users`                       | belum            |
| GET          | `/api/admin/reports`                            | belum            |
| PATCH DELETE | `/api/admin/reports/[id]`                       | belum            |
| GET          | `/api/admin/reports/users`                      | belum            |
| GET          | `/api/admin/stats`                              | belum            |
| GET          | `/api/admin/users`                              | belum            |
| PATCH DELETE | `/api/admin/users/[id]`                         | belum            |
| GET          | `/api/admin/users/stats`                        | belum            |
| POST         | `/api/auth/activity`                            | belum            |
| GET          | `/api/auth/me`                                  | belum            |
| POST         | `/api/midtrans/notification`                    | belum            |
| GET POST     | `/api/auth/[...nextauth]`                       | dikelola Auth.js |
