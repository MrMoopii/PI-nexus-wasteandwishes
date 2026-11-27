# features/laporan

Laporan bulanan untuk admin: pilih bulan dan satu instansi atau semua, tampilkan berat per pengambilan, lalu cetak.

## Peta file

| File                         | Isi                                                                           | Kode tugas |
| ---------------------------- | ----------------------------------------------------------------------------- | ---------- |
| `types.ts`                   | Bentuk baris laporan, rekap per instansi, dan hasil laporan bulanan          | 2.5        |
| `queries/admin.ts`           | `getLaporanBulanan(bulanMentah, instansiMentah)`: kunjungan berstatus "ditimbang" dalam satu bulan, dikelompokkan per instansi dengan total ember dan berat | 2.5        |
| `validasi/admin.ts`          | `skemaBulan`, `skemaInstansi`, `skemaFilterLaporan`: skema Zod filter `?bulan=` dan `?instansi=` dari URL | 2.5        |
| `components/`                | Belum dipakai (tabel laporan hanya untuk satu halaman, jadi masuk `app/admin/laporan-bulanan/_components/`); dibiarkan untuk tugas lain | —          |
| `app/admin/laporan-bulanan/` | `page.tsx` (halaman tipis), `_components/pemilih-laporan-bulanan.tsx` (kerangka Suspense dan form filter GET), `_components/tabel-laporan-bulanan.tsx` (tabel + total), `_components/tombol-cetak.tsx` (tombol `window.print()`) | 2.5        |

## Catatan

- Semua angka berasal dari database. Tidak ada angka tulisan tangan.
- Data kunjungan dibaca langsung dari tabelnya lewat `lib/db/schema.ts`, bukan dengan mengimpor dari `features/kunjungan/`.
- Emisi karbon belum dihitung sistem. Rumusnya menunggu dari WW.
- Menu admin ke `/admin/laporan-bulanan` belum ada di `AdminNav.tsx` (milik ketua tim, `CONTRIBUTING.md` bagian 4.3); diminta lewat komentar di issue 2.5, bukan dengan mengedit `AdminNav.tsx` sendiri.

## Meminta menu admin

Teks komentar untuk issue 2.5 (dikirim anggota tim, bukan agent):

```text
Butuh menu "Laporan Bulanan" di AdminNav.tsx (kategori APPLICATION) mengarah ke
/admin/laporan-bulanan. File itu milik ketua tim (bagian 4.3), jadi tolong
dambahkan di PR-nya masing-masing. Halaman lapornya sudah siap di PR 2.5.
```

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

Belum ada.
