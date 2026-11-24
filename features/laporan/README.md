# features/laporan

Laporan bulanan untuk admin: pilih bulan dan satu instansi atau semua, tampilkan berat per pengambilan, lalu cetak.

## Peta file

| File                         | Isi                                                                           | Kode tugas |
| ---------------------------- | ----------------------------------------------------------------------------- | ---------- |
| `types.ts`                   | Bentuk baris laporan dan ringkasan per instansi                               | 2.5        |
| `queries/admin.ts`           | Rekap bulanan dari data kunjungan yang sudah ditimbang                        | 2.5        |
| `validasi/admin.ts`          | Skema Zod filter bulan dan instansi dari URL                                  | 2.5        |
| `components/`                | Tabel laporan per instansi (hanya menerima props)                             | 2.5        |
| `app/admin/laporan-bulanan/` | Halaman pilih bulan dan instansi, tombol cetak (`window.print()` + CSS print) | 2.5        |

## Catatan

- Semua angka berasal dari database. Tidak ada angka tulisan tangan.
- Data kunjungan dibaca langsung dari tabelnya lewat `lib/db/schema.ts`, bukan dengan mengimpor dari `features/kunjungan/`.
- Emisi karbon belum dihitung sistem. Rumusnya menunggu dari WW.
