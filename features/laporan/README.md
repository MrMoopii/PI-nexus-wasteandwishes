# features/laporan

Laporan bulanan untuk admin: pilih bulan dan satu instansi atau semua, tampilkan berat per pengambilan, lalu cetak.

## Peta file

| File                         | Isi                                                                           | Kode tugas |
| ---------------------------- | ----------------------------------------------------------------------------- | ---------- |
| `types.ts`                   | Bentuk baris laporan, rekap per instansi, hasil laporan bulanan (beserta filter bulan dan instansi yang dipakai), dan pilihan instansi | 2.5        |
| `queries/admin.ts`           | `getLaporanBulanan(bulanMentah, instansiMentah)`: kunjungan berstatus "ditimbang" dalam satu bulan, dikelompokkan per instansi dengan total ember dan berat, beserta filter yang dipakai. `getPilihanInstansi()`: pilihan dropdown instansi, yaitu pengajuan yang pernah punya kunjungan "ditimbang", urut nama | 2.5        |
| `validasi/admin.ts`          | `skemaBulan`, `skemaInstansi`, `skemaFilterLaporan`: skema Zod filter `?bulan=` dan `?instansi=` dari URL. String kosong dari form dianggap tidak diisi (`z.preprocess`) | 2.5        |
| `components/`                | Belum dipakai (tabel laporan hanya untuk satu halaman, jadi masuk `app/admin/laporan-bulanan/_components/`); dibiarkan untuk tugas lain | —          |
| `app/admin/laporan-bulanan/` | `page.tsx` (halaman tipis: memanggil kedua query, 404 jika `?instansi=` tidak ada di pilihan), `_components/pemilih-laporan-bulanan.tsx` (kerangka Suspense dan form filter GET), `_components/tabel-laporan-bulanan.tsx` (tabel + total), `_components/tombol-cetak.tsx` (`"use client"`, tombol `window.print()`) | 2.5        |

## Catatan

- Semua angka berasal dari database. Tidak ada angka tulisan tangan.
- Data kunjungan dibaca langsung dari tabelnya lewat `lib/db/schema.ts`, bukan dengan mengimpor dari `features/kunjungan/`.
- Emisi karbon belum dihitung sistem. Rumusnya menunggu dari WW.
- Dropdown instansi hanya berisi pengajuan yang pernah punya kunjungan "ditimbang" (keputusan di #185), karena hanya kunjungan itu yang masuk laporan. Instansi baru muncul setelah timbangan pertamanya; sebelum itu `?instansi=<id>` menghasilkan 404.
- Menu "Laporan Bulanan" ada di `AdminNav.tsx`, kategori NAVIGATION, setelah "Pencatatan Kunjungan" (#185). Menu "Laporan" lama (`/admin/reports`) dihapus bersama halaman lamanya setelah rilis.

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

Belum ada.
