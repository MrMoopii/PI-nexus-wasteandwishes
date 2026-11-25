# features/langganan

Alur langganan baru: pengajuan oleh pelanggan, review dan penawaran harga oleh admin, negosiasi, pengaktifan pembayaran, lalu pembayaran lewat Midtrans. Aturan bisnisnya ada di `CONTRIBUTING.md` bagian 9.7.

## Peta file

Kode tugas mengikuti rencana kerja tim. Satu file dipegang pemilik kode tugasnya (`CONTRIBUTING.md` bagian 4.3).

| File                                                               | Isi                                                                                   | Kode tugas |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------- |
| `types.ts`                                                         | Daftar status pengajuan, tipe data untuk tampilan, `LABEL_STATUS_PENGAJUAN` (label status untuk tampilan, ditambahkan di 1.1)                                     | 0.2, 1.1        |
| `aturan.ts`                                                        | Transisi status yang diizinkan, `bolehBayar()`                                        | 0.2        |
| `queries/pelanggan.ts`                                             | `getPengajuanSaya()`: pengajuan terbaru milik pelanggan yang login. `getAkunLanggananSaya()`: syarat boleh mengajukan (peran `user`, profil lengkap), isian awal dari profil, dan keadaan langganan yang sudah dibayar. Riwayat negosiasi belum ada                            | 1.1        |
| `actions/pelanggan.ts`                                             | `kirimPengajuan()` dan `batalkanPengajuan()` untuk `useActionState` (1.1). Setujui harga, tawar, kirim pesan menyusul (1.3)                       | 1.1, 1.3   |
| `validasi/pelanggan.ts`                                            | `skemaPengajuan` dan `skemaBatalPengajuan` (1.1). Skema tawaran harga dan pesan menyusul (1.3)                    | 1.1, 1.3   |
| `queries/admin.ts`                                                 | Daftar pengajuan per status, jumlah yang menunggu admin, detail pengajuan             | 1.4        |
| `actions/admin.ts`                                                 | Kirim penawaran, terima tawaran, aktifkan pembayaran, tolak, kirim pesan              | 1.5        |
| `validasi/admin.ts`                                                | Skema Zod harga penawaran, alasan penolakan, dan pesan dari admin                     | 1.5        |
| `actions/pembayaran.ts`                                            | Mulai pembayaran Midtrans dari harga final (pindahan dari `app/langganan/actions.ts`) | 1.6        |
| `validasi/pembayaran.ts`                                           | Skema Zod ID pengajuan yang dibayar dan data notifikasi Midtrans yang dipakai         | 1.6        |
| `components/`                                                      | Badge status pengajuan, kartu penawaran, riwayat negosiasi (hanya menerima props)     | 1.2        |
| `app/langganan/` dan `app/langganan/_components/`                  | Halaman pelanggan: `page.tsx`, `error.tsx`, `form-pengajuan`, `status-pengajuan`, `rincian-pengajuan`, `tombol-batal`, `keadaan-langganan`, `kerangka-langganan`. Tombol bayar dipasang 1.6 di `status-pengajuan.tsx`                                                                     | 1.1        |
| `app/admin/langganan/` dan `app/admin/langganan/[id]/_components/` | Halaman admin                                                                         | 1.4, 1.5   |

Tabel database (`lib/db/schema.ts` dan migrasinya) hanya diubah pemilik skema (kode tugas 0.2), sesuai `CONTRIBUTING.md` bagian 6.3.

## Yang dipakai dari luar fitur ini

- `requireLogin()` dan `requireAdmin()` dari `lib/`.
- `kondisiLanggananAktif()` dan `keadaanLangganan()` dari `lib/langganan.ts` untuk keadaan langganan yang sudah dibayar.
- `getMidtransSnap()` dari `lib/midtrans.ts`.
- Komponen umum dari `components/ui/`.
