## Ringkasan

<!-- Jelaskan singkat apa yang dikerjakan dan kenapa. -->

## Jenis perubahan

- [ ] Fitur baru
- [ ] Perbaikan bug
- [ ] Tampilan / UI
- [ ] Database / migrasi
- [ ] Dokumentasi / konfigurasi

## Cara menguji

<!-- Langkah agar reviewer bisa mencoba hasilnya. -->

## Daftar periksa

- [ ] Branch sudah diperbarui dari `development` terbaru sebelum PR dibuka
- [ ] `pnpm lint` dan `pnpm build` berhasil di laptop saya
- [ ] Tidak ada sisa penanda konflik, `console.log`, atau placeholder
- [ ] Server Action dan route `/api/admin/*` baru memeriksa sesi atau peran di awal (lihat CONTRIBUTING.md bagian 7)
- [ ] Tidak ada nilai rahasia (kunci API, password, connection string) di kode
- [ ] Jika mengubah skema database: file migrasi ikut di-commit, kolom yang berubah disebut di ringkasan, dan tim diingatkan menjalankan `pnpm db:migrate`
- [ ] Jika mengubah file milik anggota lain: pemiliknya sudah dikabari
- [ ] Untuk perubahan tampilan: sertakan tangkapan layar
