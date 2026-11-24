# features/kunjungan

Kunjungan pengambilan sampah per pelanggan per tanggal: pembuatan jadwal dari pola hari dan hari libur, pencatatan ember dan berat oleh admin, tracker untuk pelanggan, serta laporan kendala dua arah.

## Peta file

File dipisah per proses supaya setiap pemilik kode tugas memegang file sendiri (`CONTRIBUTING.md` bagian 4.3).

| File                           | Isi                                                                                    | Kode tugas |
| ------------------------------ | -------------------------------------------------------------------------------------- | ---------- |
| `types.ts`                     | Daftar status kunjungan, tipe data untuk tampilan                                      | 2.1        |
| `jadwal.ts`                    | Fungsi murni: tanggal kunjungan dari pola hari, aturan hari libur (`geser` / `lewati`) | 2.2        |
| `queries/hari-libur.ts`        | Daftar hari libur                                                                      | 2.2        |
| `actions/jadwal.ts`            | Buat kunjungan untuk rentang tanggal, kelola hari libur                                | 2.2        |
| `validasi/jadwal.ts`           | Skema Zod rentang tanggal dan isian hari libur                                         | 2.2        |
| `queries/admin.ts`             | Daftar kunjungan per tanggal untuk pencatatan                                          | 2.3        |
| `actions/pencatatan.ts`        | Catat ember dan foto, catat berat (kg), tandai tertunda dengan tanggal paling lambat   | 2.3        |
| `validasi/pencatatan.ts`       | Skema Zod jumlah ember, berat (kg), dan tanggal paling lambat                          | 2.3        |
| `queries/pelanggan.ts`         | Status hari ini, jadwal berikutnya, riwayat, total ember dan kg milik pelanggan        | 2.4        |
| `actions/lapor-kendala.ts`     | Pelanggan melaporkan kendala                                                           | 2.4        |
| `validasi/lapor-kendala.ts`    | Skema Zod isi laporan kendala                                                          | 2.4        |
| `components/`                  | Komponen tracker (hanya menerima props)                                                | 2.4        |
| `queries/kendala.ts`           | Daftar laporan kendala yang masih terbuka                                              | 2.6        |
| `actions/tanggapi-kendala.ts`  | Admin menanggapi laporan kendala                                                       | 2.6        |
| `validasi/tanggapi-kendala.ts` | Skema Zod tanggapan admin                                                              | 2.6        |
| `app/admin/hari-libur/`        | Halaman admin hari libur                                                               | 2.2        |
| `app/admin/kunjungan/`         | Halaman admin pencatatan harian                                                        | 2.3        |
| `app/tracker/`                 | Halaman tracker pelanggan                                                              | 2.4        |
| `app/admin/kendala/`           | Halaman admin laporan kendala                                                          | 2.6        |

Tabel database (`lib/db/schema.ts` dan migrasinya) hanya diubah pemilik skema (kode tugas 2.1), sesuai `CONTRIBUTING.md` bagian 6.3.

## Yang dipakai dari luar fitur ini

- `kondisiLanggananAktif()` dari `lib/langganan.ts`: tracker hanya untuk pelanggan yang langganannya aktif.
- `tanggalHariIniJakarta()` dan fungsi format dari `lib/format-tanggal.ts`.
- Data pola hari dan rentang jam pelanggan dibaca langsung dari tabelnya lewat `lib/db/schema.ts`, bukan dengan mengimpor dari `features/langganan/`.
