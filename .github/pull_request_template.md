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

## Bantuan AI agent

<!-- Bagian mana yang dibuat atau diubah dengan bantuan AI agent? Tulis "tidak ada" jika tidak memakai agent. Reviewer akan membaca bagian ini lebih teliti. -->

## Daftar periksa

- [ ] Branch sudah diperbarui dari `development` terbaru sebelum PR dibuka
- [ ] `pnpm lint` dan `pnpm build` berhasil di laptop saya
- [ ] Tidak ada sisa penanda konflik, `console.log`, atau placeholder
- [ ] Server Action dan route `/api/admin/*` baru memeriksa sesi atau peran di awal (lihat CONTRIBUTING.md bagian 7)
- [ ] Tidak ada nilai rahasia (kunci API, password, connection string) di kode
- [ ] Jika mengubah skema database: file migrasi ikut di-commit, kolom yang berubah disebut di ringkasan, dan tim diingatkan menjalankan `pnpm db:migrate`
- [ ] Jika mengubah file milik anggota lain: pemiliknya sudah dikabari
- [ ] Jika mengubah kode status atau bentuk respons route API: semua pemanggilnya sudah dicari dan diuji (CONTRIBUTING.md bagian 9.5)
- [ ] Jika memakai AI agent: saya sudah membaca seluruh `git diff`, hanya file yang relevan yang berubah, dan saya memahami setiap perubahannya (CONTRIBUTING.md bagian 11.2)
- [ ] Untuk perubahan tampilan: sertakan tangkapan layar
