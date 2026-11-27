# features/event

Event pihak lain yang dihadiri WW sebagai narasumber, peserta, atau mitra. Event hanya informasi: tidak ada pendaftaran dan pembayaran, dan halaman publiknya bisa dibuka tanpa login.

## Peta file

Kode tugas mengikuti issue Tahap 3. Satu file dipegang pemilik kode tugasnya (`CONTRIBUTING.md` bagian 4.3).

| File                       | Isi                                                                                                                                      | Kode tugas |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `types.ts`                 | `PERAN_WW` dengan `PeranWw`, `isPeranWw()`, dan `LABEL_PERAN_WW`; tipe tampilan `EventTampilan`                                          | 3.1        |
| `queries/publik.ts`        | `getEventPublik()` dan `getEventDetailPublik()` untuk publik tanpa login: hanya status yang boleh tampil (bukan `draft`/`hidden`), yang akan datang lebih dulu | 3.2        |
| `validasi/publik.ts`       | Skema Zod `skemaIdEventPublik` untuk ID event dari URL `/event/detail/[id]`                                                             | 3.2        |
| `actions/admin.ts`         | Tambah dan ubah event, dipindah dari `page.tsx` admin, dengan `requireAdmin()` di awal                                                   | 3.3        |
| `validasi/admin.ts`        | Skema Zod form event admin: penyelenggara dan peran WW wajib, tautan info opsional dan harus `https://`                                  | 3.3        |
| `app/event/`               | Halaman publik daftar dan detail event, tanpa tombol daftar atau bayar. `/event/checkout/*` dan `/event/bukti/*` dialihkan ke `/event`  | 3.2        |
| `app/admin/events/`        | Form tambah dan ubah event dengan isian penyelenggara, peran WW, dan tautan info. Daftar event menampilkan penyelenggara dan peran WW    | 3.3        |
| `app/admin/peserta-event/` | Dialihkan ke `/admin/events`, dan action-nya menolak setiap panggilan                                                                    | 3.3        |

`types.ts` berisi `PERAN_WW` beserta tipe, `LABEL_PERAN_WW`, dan pemeriksa `isPeranWw()` tanpa `as`. Tipe tampilannya `EventTampilan`, diturunkan dari skema: `peran_ww` menjadi `PeranWw | null`, sedangkan `kuota_peserta`, `biaya_event`, dan `gambar_file_id` tidak ikut.

Di luar folder ini, 3.2 menghapus `/event` dari daftar halaman wajib login di `auth.config.ts` dan menampilkan menu Event serta Toko Terdekat tanpa login di `components/header/Header.tsx`. Menu admin diatur 3.10 di `app/admin/AdminNav.tsx`.

Skema Zod untuk input lain ditaruh di `validasi/<nama>.ts` yang namanya sama dengan file `actions/` atau `queries/` pemakainya (`CONTRIBUTING.md` bagian 9.8).

## Tabel

Didefinisikan di `lib/db/schema-event.ts` (3.1) dan diekspor ulang dari `lib/db/schema.ts`, jadi impor tetap dari `@/lib/db/schema`. Tabel hanya diubah pemilik skema, sesuai `CONTRIBUTING.md` bagian 6.3. Nama constraint di bawah muncul di pesan error Postgres saat isian ditolak.

| Tabel                                   | Aturan yang dijaga database                                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `events`                                | `peran_ww` berisi `narasumber`, `peserta`, atau `mitra` (`events_peran_ww_valid`). `penyelenggara`, `peran_ww`, dan `tautan_info` boleh kosong. |
| `pendaftaran_event`, `pembayaran_event` | Tidak berubah. Dibiarkan sampai rilis karena masih berisi data alur lama.                                                                    |

Cara memakainya:

- Database tidak mewajibkan `penyelenggara` dan `peran_ww`, dan tidak memeriksa format `tautan_info`, karena event lama tidak punya isiannya. Kewajiban untuk event baru dan syarat `https://` dicek skema Zod di `validasi/admin.ts` (3.3).
- Daftar peran di `types.ts` harus sama dengan CHECK di skema. Mengubahnya berarti migrasi baru lewat pemilik skema.
- `kuota_peserta` dan `biaya_event` tidak dihapus dulu, tetapi tidak dipakai lagi, jadi keduanya tidak ada di `EventTampilan`.
- `tautan_info` dibuka di tab baru dengan `rel="noopener noreferrer"` (3.2).
- Cabang event di webhook Midtrans tetap membaca `pembayaran_event` untuk data lama. Tabel lama dihapus di PR tersendiri setelah rilis.

## Yang dipakai dari luar fitur ini

- `requireAdmin()` dari `lib/require-admin.ts` untuk aksi admin.
- `components/GambarEvent.tsx` untuk poster dari URL database (`CONTRIBUTING.md` bagian 8 no. 6).
- `components/admin/ImageKitEventUpload.tsx` untuk mengunggah poster. File ini sudah 601 baris, jadi tidak boleh bertambah panjang.

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

Belum ada.
