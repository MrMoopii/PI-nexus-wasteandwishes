# features/langganan

Alur langganan baru: pengajuan oleh pelanggan, review dan penawaran harga oleh admin, negosiasi, pengaktifan pembayaran, lalu pembayaran lewat Midtrans. Aturan bisnisnya ada di `CONTRIBUTING.md` bagian 9.7.

## Peta file

Kode tugas mengikuti rencana kerja tim. Satu file dipegang pemilik kode tugasnya (`CONTRIBUTING.md` bagian 4.3).

| File                                                               | Isi                                                                                   | Kode tugas |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------- |
| `types.ts`                                                         | Daftar status pengajuan, tipe data untuk tampilan, `LABEL_STATUS_PENGAJUAN` (label status untuk tampilan, ditambahkan di 1.1)                                     | 0.2, 1.1        |
| `aturan.ts`                                                        | Transisi status yang diizinkan, `bolehBayar()`                                        | 0.2        |
| `queries/pelanggan.ts`                                             | `getPengajuanSaya()`: pengajuan terbaru milik pelanggan yang login. `getAkunLanggananSaya()`: syarat boleh mengajukan (peran `user`, profil lengkap), isian awal dari profil, dan keadaan langganan yang sudah dibayar | 1.1        |
| `actions/pelanggan.ts`                                             | `kirimPengajuan()` dan `batalkanPengajuan()` untuk `useActionState` (1.1)             | 1.1        |
| `actions/negosiasi.ts`                                             | `setujuiPenawaran()`, `tawarHarga()`, `kirimPesan()` untuk pelanggan negosiasi; tipe `HasilNegosiasi`. Gagal jika status sudah berubah atau bukan milik akun (1.3)     | 1.3        |
| `validasi/pelanggan.ts`                                            | `skemaPengajuan` dan `skemaBatalPengajuan` (1.1)                                      | 1.1        |
| `validasi/negosiasi.ts`                                            | `skemaIdPengajuan`, `skemaTawarHarga`, `skemaKirimPesan` untuk negosiasi pelanggan (1.3) | 1.3        |
| `queries/negosiasi.ts`                                             | `getRiwayatPesanNegosiasi(idPengajuan)`: riwayat pesan negosiasi pengajuan milik pelanggan, null jika bukan milik akun atau belum login (1.3) | 1.3        |
| `queries/admin.ts`                                                 | Daftar pengajuan per status, jumlah yang menunggu admin, detail pengajuan (1.4). `getPesanNegosiasi()`: riwayat pesan satu pengajuan, urut dari yang terlama, berbentuk `PesanNegosiasiTampilan` (1.5) | 1.4, 1.5   |
| `actions/admin.ts`                                                 | Aksi admin yang menulis pesan: `kirimPenawaran()` (syarat di pengajuan, harga sebagai pesan admin dengan `harga_usulan`, tanpa `harga_final`) dan `kirimPesan()`. Status dan pesan ditulis dalam satu perintah `WITH … UPDATE … INSERT`. Juga tipe `HasilAksiAdmin` dan `HasilKirimPenawaran` | 1.5        |
| `actions/admin-status.ts`                                          | Aksi admin yang hanya mengubah status: `terimaTawaran()` (`harga_final` dari tawaran pelanggan terakhir, hanya jika tawaran yang tampil masih yang terakhir), `aktifkanPembayaran()`, `tolakPengajuan()` | 1.5        |
| `validasi/admin.ts`                                                | Filter status dan ID halaman admin (1.4). `skemaPenawaran`, `skemaTerimaTawaran`, `skemaAktifkanPembayaran`, `skemaTolak`, `skemaPesanAdmin` untuk kedua file actions admin (1.5) | 1.4, 1.5   |
| `queries/pembayaran.ts`                                            | `getPengajuanSiapBayar()`: pengajuan `siap_bayar` milik pelanggan yang login beserta harga finalnya, untuk tombol bayar | 1.6        |
| `actions/pembayaran.ts`                                            | `mulaiPembayaranLangganan()`: mulai pembayaran Midtrans dari harga final. Menggantikan `app/langganan/actions.ts`, yang tidak dipakai lagi dan dihapus di PR tersendiri | 1.6        |
| `validasi/pembayaran.ts`                                           | Skema Zod ID pengajuan yang dibayar, body notifikasi Midtrans, dan data transaksi hasil verifikasi Midtrans | 1.6        |
| `app/langganan/payment-button.tsx`                                 | Tombol bayar (klien), props `idPengajuan` dan `hargaFinal`                            | 1.6        |
| `app/api/midtrans/notification/route.ts`                           | Webhook Midtrans. Kontraknya di `docs/api/midtrans.md`                                | 1.6        |
| `components/`                                                      | Hanya menerima props, tanpa query atau action, dan tidak bergantung pada peran. `badge-status-pengajuan.tsx`: `BadgeStatusPengajuan({ status })`, label dari `LABEL_STATUS_PENGAJUAN`. `kartu-penawaran.tsx`: `KartuPenawaran({ harga, hariPengambilan, jamMulai, jamSelesai, jumlahEmber, aksi? })`, `harga` dipilih pemanggil (harga usulan admin terakhir atau `harga_final`), `aksi` tempat tombol Setujui dan Tawar. `riwayat-negosiasi.tsx`: `RiwayatNegosiasi({ daftarPesan, namaPengirim })`, diurutkan dari yang terlama, `namaPengirim` diisi halaman pemakai | 1.2        |
| `app/langganan/_components/negosiasi-pelanggan.tsx`                | `NegosiasiPelanggan` (klien): tanda "Perlu tindakan Anda" saat ditawarkan, tombol Setujui dan form Tawar di kartu penawaran, form pesan tanpa harga, dan riwayat; aksi dari `actions/negosiasi.ts` (1.3) | 1.3        |
| `app/langganan/` dan `app/langganan/_components/`                  | Halaman pelanggan: `page.tsx` (mengambil riwayat negosiasi), `error.tsx`, `form-pengajuan`, `status-pengajuan` (memasang `NegosiasiPelanggan`), `rincian-pengajuan`, `tombol-batal`, `keadaan-langganan`, `kerangka-langganan`. Tombol bayar (`payment-button.tsx`, 1.6) dipasang di `status-pengajuan.tsx` dari data `getPengajuanSaya()` | 1.1, 1.3, 1.6 |
| `app/admin/langganan/` dan `app/admin/langganan/[id]/_components/` | Halaman admin: daftar dan detail (1.4). Di detail, `panel-aksi` menampilkan harga terakhir kedua pihak dan aksi yang diizinkan status: `form-penawaran`, `tombol-status` (terima tawaran, aktifkan pembayaran), `form-pesan`, `form-tolak` (1.5) | 1.4, 1.5   |
| `app/langganan/buat-jadwal-rutin/` dan `app/langganan/buat-jadwal-janjian/` | Halaman lama pembuatan jadwal pelanggan: `page.tsx` langsung mengalihkan ke `/langganan` lewat `redirect()`; Server Action di `actions.ts` (`simpanJadwalRutin()`, `ajukanJadwalJanjian()`) menolak setiap panggilan dan mengalihkan ke `/langganan` (pelanggan tidak lagi membuat jadwal sendiri, jadwal hanya ditentukan WW) | 1.7        |

Tabel database (`lib/db/schema.ts` dan migrasinya) hanya diubah pemilik skema (kode tugas 0.2), sesuai `CONTRIBUTING.md` bagian 6.3.

## Memasang tombol bayar

Tombol bayar hanya dipasang untuk pengajuan yang `bolehBayar(status)`. Jumlah yang ditagih tetap dihitung ulang di Server Action dari `harga_final`, jadi `hargaFinal` di props hanya label.

```tsx
import PaymentButton from "@/app/langganan/payment-button";
import { getPengajuanSiapBayar } from "@/features/langganan/queries/pembayaran";

const siapBayar = await getPengajuanSiapBayar();

{
  siapBayar && (
    <PaymentButton
      idPengajuan={siapBayar.idPengajuan}
      hargaFinal={siapBayar.hargaFinal}
    />
  );
}
```

Halaman yang sudah membaca pengajuan lewat `getPengajuanSaya()` boleh memakai datanya langsung: `bolehBayar(pengajuan.status) && pengajuan.hargaFinal !== null`.

## Yang dipakai dari luar fitur ini

- `requireLogin()` dan `requireAdmin()` dari `lib/`.
- `kondisiLanggananAktif()` dan `keadaanLangganan()` dari `lib/langganan.ts` untuk keadaan langganan yang sudah dibayar.
- `getMidtransSnap()` dari `lib/midtrans.ts`.
- Komponen umum dari `components/ui/`.

## Catatan antar-tugas

Catatan untuk tugas lain yang belum di-merge. Format entri dan cara menulisnya ada di `CONTRIBUTING.md` bagian 4.7. Hapus entri di PR yang mengerjakannya.

Belum ada.
