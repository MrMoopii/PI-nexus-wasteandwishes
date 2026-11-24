# features/langganan

Alur langganan baru: pengajuan oleh pelanggan, review dan penawaran harga oleh admin, negosiasi, pengaktifan pembayaran, lalu pembayaran lewat Midtrans. Aturan bisnisnya ada di `CONTRIBUTING.md` bagian 9.7.

## Peta file

Kode tugas mengikuti rencana kerja tim. Satu file dipegang pemilik kode tugasnya (`CONTRIBUTING.md` bagian 4.3).

| File                                                               | Isi                                                                                   | Kode tugas |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------- |
| `types.ts`                                                         | Daftar status pengajuan, tipe data untuk tampilan                                     | 0.2        |
| `aturan.ts`                                                        | Transisi status yang diizinkan, `bolehBayar()`                                        | 0.2        |
| `queries/pelanggan.ts`                                             | Pengajuan dan riwayat negosiasi milik pelanggan yang login                            | 1.1        |
| `actions/pelanggan.ts`                                             | Kirim dan batalkan pengajuan, setujui harga, tawar, kirim pesan                       | 1.1, 1.3   |
| `queries/admin.ts`                                                 | Daftar pengajuan per status, jumlah yang menunggu admin, detail pengajuan             | 1.4        |
| `actions/admin.ts`                                                 | Kirim penawaran, terima tawaran, aktifkan pembayaran, tolak, kirim pesan              | 1.5        |
| `actions/pembayaran.ts`                                            | Mulai pembayaran Midtrans dari harga final (pindahan dari `app/langganan/actions.ts`) | 1.6        |
| `components/`                                                      | Badge status pengajuan, kartu penawaran, riwayat negosiasi (hanya menerima props)     | 1.2        |
| `app/langganan/` dan `app/langganan/_components/`                  | Halaman pelanggan                                                                     | 1.1        |
| `app/admin/langganan/` dan `app/admin/langganan/[id]/_components/` | Halaman admin                                                                         | 1.4, 1.5   |

Tabel database (`lib/db/schema.ts` dan migrasinya) hanya diubah pemilik skema (kode tugas 0.2), sesuai `CONTRIBUTING.md` bagian 6.3.

## Yang dipakai dari luar fitur ini

- `requireLogin()` dan `requireAdmin()` dari `lib/`.
- `kondisiLanggananAktif()` dan `keadaanLangganan()` dari `lib/langganan.ts` untuk keadaan langganan yang sudah dibayar.
- `getMidtransSnap()` dari `lib/midtrans.ts`.
- Komponen umum dari `components/ui/`.
