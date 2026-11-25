## Issue

Closes #

<!-- Tulis nomor issue tepat setelah tanda #, misalnya "Closes #136". Untuk beberapa issue: "Closes #136, closes #137". Issue tertutup otomatis saat PR ini di-merge ke development (CONTRIBUTING.md bagian 3.7). -->

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
- [ ] File baru diletakkan sesuai struktur folder, dan tidak ada file kode lebih dari 300 baris (CONTRIBUTING.md bagian 4)
- [ ] Tidak ada sisa penanda konflik, `console.log`, atau placeholder
- [ ] Server Action dan route `/api/admin/*` baru memeriksa sesi atau peran di awal (lihat CONTRIBUTING.md bagian 7)
- [ ] Input dari form, URL, atau body divalidasi dengan skema Zod (CONTRIBUTING.md bagian 9.8)
- [ ] Fungsi dan komponen baru diberi komentar singkat, dan alur penting diberi komentar langkah (CONTRIBUTING.md bagian 9.9)
- [ ] Dokumen yang terkena perubahan sudah diperbarui (CONTRIBUTING.md bagian 4.6), atau alasannya ditulis di ringkasan
- [ ] Tidak ada nilai rahasia (kunci API, password, connection string) di kode
- [ ] Jika mengubah skema database: file migrasi ikut di-commit, kolom yang berubah disebut di ringkasan, dan tim diingatkan menjalankan `pnpm db:migrate`
- [ ] Jika mengubah file milik anggota lain: pemiliknya sudah dikabari
- [ ] Jika mengubah kode status atau bentuk respons route API: semua pemanggilnya sudah dicari dan diuji (CONTRIBUTING.md bagian 9.5)
- [ ] Untuk perubahan tampilan: sertakan tangkapan layar
