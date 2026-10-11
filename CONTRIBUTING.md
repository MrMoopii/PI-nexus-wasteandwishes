# Panduan Kontribusi Tim

Proyek: website Waste and Wishes (langganan pengambilan sampah, pendaftaran event, dan toko online).
Dokumen ini adalah aturan kerja bersama. Jika ada yang perlu diubah, ubah lewat Pull Request.

## 1. Persiapan di laptop

1. Pasang Node.js LTS, Git, dan **pnpm versi yang sama dengan `packageManager` di `package.json`**. Cek dengan `pnpm -v`. pnpm versi lama bisa menolak `pnpm-lock.yaml`.
2. Clone repo, lalu jalankan:
   ```bash
   pnpm install
   cp .env.example .env.local   # isi nilainya, lihat bagian 5
   pnpm dev                     # buka http://localhost:3000
   ```
3. Ekstensi VS Code yang disarankan: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma.

**Gunakan pnpm saja.** Jangan menjalankan `npm install` atau `yarn`, dan jangan meng-commit `package-lock.json` atau `yarn.lock`. Commit `pnpm-lock.yaml` setiap kali menambah atau mengubah library.

## 2. Next.js 16: baca dokumentasinya dulu

Versi Next.js di proyek ini berbeda dari banyak tutorial di internet. Sebelum menulis kode untuk fitur baru, baca panduan yang relevan di `node_modules/next/dist/docs/` (tersedia setelah `pnpm install`). Perhatikan juga peringatan deprecation di terminal saat `pnpm dev`. Aturan yang sama berlaku untuk AI agent (lihat `AGENTS.md`).

## 3. Alur kerja Git

- Branch `main` dilindungi. Tidak ada yang push langsung ke `main`.
- Setiap pekerjaan dikerjakan di branch sendiri, dibuat dari `main` yang terbaru:
  ```bash
  git checkout main && git pull
  git checkout -b feat/halaman-event
  ```
- Penamaan branch: `feat/...` (fitur), `fix/...` (perbaikan), `chore/...` (konfigurasi, dokumen), `docs/...`.
- Pesan commit singkat dan jelas dalam Bahasa Indonesia atau Inggris (pilih satu dan konsisten), contoh: `feat: tambah halaman daftar event`.
- Buka Pull Request ke `main`, isi template PR, dan minta **minimal 1 reviewer**. Jangan merge PR sendiri tanpa review.
- Sebelum membuka PR, jalankan `pnpm lint` dan `pnpm build`. PR yang gagal build tidak di-merge.
- Jaga PR tetap kecil (satu fitur atau satu perbaikan). PR kecil lebih cepat direview dan jarang konflik.
- Setelah PR di-merge, hapus branch-nya.

## 4. Pembagian area kerja

Pembagian folder mengurangi konflik saat merge. Pembagian ini awal dan bisa disesuaikan tim.

| Tim | Anggota | Area utama |
|---|---|---|
| Tampilan (frontend) | 2 orang | `components/`, halaman publik di `app/`, styling (Tailwind), `public/` |
| Backend | 3 orang | `app/api/`, `lib/`, skema database dan migrasi (`prisma/`), autentikasi, pembayaran |

Aturan:
- Jangan mengedit file milik area lain tanpa memberi tahu pemiliknya, terutama `app/layout.tsx`, `package.json`, dan skema database.
- Jika butuh perubahan di area lain, buat issue di GitHub atau kabari lewat grup tim, lalu sepakati siapa yang mengerjakan.

## 5. Variabel lingkungan dan rahasia

- Nama semua variabel terdaftar di `.env.example`. Nilai asli hanya di `.env.local` (tidak ikut Git).
- Jika menambah variabel baru, tambahkan namanya (tanpa nilai) ke `.env.example` pada PR yang sama.
- Connection string database, kunci pembayaran, dan `AUTH_SECRET` adalah rahasia. Bagikan lewat pesan privat, jangan lewat GitHub, grup publik, atau screenshot.
- Untuk pembayaran, pakai kunci **sandbox** selama pengembangan. Kunci produksi hanya dipasang di pengaturan hosting.

## 6. Database (PostgreSQL di Neon)

Database pengembangan adalah satu project Neon bersama.

- Branch `production` dibiarkan bersih. Jangan dipakai bereksperimen.
- Disarankan setiap anggota membuat **branch database sendiri** dari dashboard Neon, lalu memakai connection string branch itu di `.env.local`. Paket gratis mengizinkan jumlah branch yang terbatas, jadi hapus branch yang tidak dipakai.
- Perubahan struktur tabel hanya lewat **file migrasi** yang di-commit lewat PR. Jangan mengubah tabel langsung di dashboard.
- Sebelum menjalankan migrasi: `git pull`, dan terapkan migrasi baru dari rekan terlebih dahulu.
- Jangan menaruh data asli pelanggan di database pengembangan.

(Bagian ini akan diperbarui setelah skema Prisma dibuat.)

## 7. Standar kode

- TypeScript untuk semua kode. Hindari `any`.
- Komponen yang dipakai ulang ditaruh di `components/`. Fungsi bantu ditaruh di `lib/`.
- Komponen berjalan di server secara default. Tambahkan `"use client"` hanya jika butuh interaktivitas (state, event klik).
- Validasi semua input dari form di sisi server, bukan hanya di tampilan.
- Jangan menaruh logika harga, stok, atau pembayaran di sisi klien. Hitung dan periksa di server.
- Jalankan `pnpm lint` dan perbaiki peringatan sebelum commit.
- Format kode diatur Prettier (`.prettierrc`). Pasang ekstensi Prettier di VS Code (pengaturan proyek di `.vscode/` sudah menyalakan *Format on Save*). Jangan mengubah `.prettierrc` tanpa Pull Request dan kesepakatan tim, supaya tidak ada perubahan format massal yang membuat konflik.

## 8. Menggunakan AI agent

AI agent boleh dipakai membantu, dengan syarat:
- Hasilnya dibaca dan dipahami penulis PR sebelum dikirim.
- Penulis PR sudah menjalankan `pnpm lint` dan `pnpm build` di laptopnya sendiri.
- Tidak ada rahasia (connection string, kunci API) yang ditempel ke percakapan dengan agent.
