# docs/qa

Skenario uji per fitur. Tujuannya supaya siapa pun di tim, termasuk yang tidak menulis kodenya, bisa menguji fitur dengan langkah yang sama, dan supaya bug yang pernah ditemukan diuji ulang sebelum rilis ke `main`.

## Template

Satu file per fitur, misalnya `langganan.md`. Setiap skenario ditulis dengan pola ini:

```md
## <KODE-NN>: <judul singkat>

- **Kode tugas:** <misalnya 1.1>
- **Peran:** publik | pelanggan | admin
- **Persiapan data:** <data uji di branch Neon pribadi (CONTRIBUTING.md bagian 6.5)>
- **Langkah:**
  1. <langkah pertama>
  2. <langkah berikutnya>
- **Hasil yang diharapkan:** <yang terlihat di layar dan yang berubah di database>
- **Keadaan gagal yang dicek:** <misalnya belum login, sesi idle, bukan pemilik data, ID salah di URL, isian tidak valid>
- **Hasil uji terakhir:** <tanggal>, <akun GitHub penguji>, lolos | gagal (<tautan issue jika gagal>)
```

- Kode skenario memakai awalan fitur dan nomor urut, misalnya `LGN-01` untuk langganan dan `KJG-01` untuk kunjungan. Nomor tidak dipakai ulang walaupun skenarionya dihapus.
- Bug yang ditemukan saat pengujian ditambahkan sebagai skenario baru, supaya ikut diuji ulang.
- Skenario yang butuh pembayaran memakai Midtrans sandbox lewat ngrok (`CONTRIBUTING.md` bagian 5.1).
