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
3. Ekstensi VS Code yang disarankan: ESLint, Prettier, Tailwind CSS IntelliSense.

**Gunakan pnpm saja.** Jangan menjalankan `npm install` atau `yarn`, dan jangan meng-commit `package-lock.json` atau `yarn.lock`. Commit `pnpm-lock.yaml` setiap kali menambah atau mengubah library.

## 2. Next.js 16: baca dokumentasinya dulu

Versi Next.js di proyek ini berbeda dari banyak tutorial di internet. Sebelum menulis kode untuk fitur baru, baca panduan yang relevan di `node_modules/next/dist/docs/` (tersedia setelah `pnpm install`). Perhatikan juga peringatan deprecation di terminal saat `pnpm dev`. Aturan yang sama berlaku untuk AI agent (lihat `AGENTS.md`).

## 3. Alur kerja Git

- Branch `main` dan `development` dilindungi. Tidak ada yang push langsung ke keduanya.
- Semua pekerjaan membangun web dikerjakan lewat branch `development`. Isinya baru dirilis ke `main` (Production di Vercel) setelah web benar-benar jadi.
- Setiap pekerjaan dikerjakan di branch sendiri, dibuat dari `development` yang terbaru:
  ```bash
  git checkout development && git pull
  git checkout -b feat/halaman-event
  ```
- Penamaan branch: `feat/...` (fitur), `fix/...` (perbaikan), `chore/...` (konfigurasi, dokumen), `docs/...`.
- Pesan commit singkat dan jelas dalam Bahasa Indonesia atau Inggris (pilih satu dan konsisten), contoh: `feat: tambah halaman daftar event`.
- Buka Pull Request ke `development`, isi template PR, dan minta **minimal 1 reviewer**. Penulis PR tidak bisa menyetujui PR-nya sendiri, dan persetujuan lama gugur kalau ada push baru.
- Sebelum membuka PR, jalankan `pnpm lint` dan `pnpm build`. PR yang gagal build tidak di-merge.
- Jaga PR tetap kecil (satu fitur atau satu perbaikan). PR kecil lebih cepat direview dan jarang konflik.
- Setelah PR di-merge, hapus branch-nya.

## 4. Pembagian area kerja

Pembagian folder mengurangi konflik saat merge. Pembagian ini awal dan bisa disesuaikan tim.

| Tim | Anggota | Area utama |
|---|---|---|
| Tampilan (frontend) | 2 orang | `components/`, halaman publik di `app/`, styling (Tailwind), `public/` |
| Backend | 3 orang | `app/api/`, `lib/`, skema database dan migrasi (`lib/db/` dan `drizzle/`), autentikasi, pembayaran |

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
- Jangan menaruh data asli pelanggan di database pengembangan.

### 6.1 Istilah singkat

- **Neon**: tempat database PostgreSQL kita berjalan (di internet).
- **Drizzle ORM**: library untuk berbicara ke database lewat kode TypeScript.
- **drizzle-kit**: alat di terminal untuk membuat dan menerapkan **file migrasi** (catatan perubahan struktur tabel dalam bentuk SQL).
- **Connection string**: alamat lengkap database beserta username dan password. Ini rahasia.
  - **Pooled** (host berisi `-pooler`): dipakai aplikasi saat berjalan, disimpan di `DATABASE_URL`.
  - **Direct** (tanpa `-pooler`): dipakai untuk migrasi, disimpan di `DIRECT_URL`. Migrasi lewat koneksi pooled bisa error.

### 6.2 Pemasangan awal Drizzle (dikerjakan sekali oleh anggota backend)

Setelah file-file di bawah ada di `development`, anggota lain cukup `git pull` dan `pnpm install`, lalu lanjut ke bagian 6.3.

Contoh kode di bawah disusun dari dokumentasi resmi Drizzle, Neon, dan Next.js 16, tetapi **belum dijalankan**. Jika ada error (misalnya tipe atau versi), jangan memaksa: catat pesan errornya dan tanyakan ke agent atau tim.

1. Buat branch kerja dari `development`:
   ```bash
   git checkout development && git pull
   git checkout -b feat/pasang-drizzle
   ```

2. Pasang paket (hanya pnpm):
   ```bash
   pnpm add drizzle-orm@rc @neondatabase/serverless @next/env
   pnpm add -D drizzle-kit@rc
   ```
   Tim memutuskan memakai versi **rc** (1.0 rilis kandidat), sesuai dokumentasi resmi Drizzle saat ini. `drizzle-orm` dan `drizzle-kit` harus sama-sama rc, jangan dicampur dengan versi stabil (0.x). Cek dengan `pnpm list drizzle-orm drizzle-kit`. Karena rc belum final, hindari memperbarui versinya sembarangan: perubahan versi dilakukan lewat PR tersendiri.

   Jika pnpm menampilkan `ERR_PNPM_IGNORED_BUILDS` untuk `esbuild`, jalankan `pnpm approve-builds`, centang `esbuild` (spasi), lalu Enter. Pilihan itu tercatat di `pnpm-workspace.yaml` (`allowBuilds`), jadi file itu ikut di-commit.

   Commit `package.json`, `pnpm-lock.yaml`, dan `pnpm-workspace.yaml`. Paket `tsx` yang muncul di contoh dokumentasi Drizzle tidak diperlukan di proyek ini.

3. Isi `.env.local` dengan connection string branch Neon pribadi (di dashboard Neon: tombol **Connect**, pilih branch milikmu, nyalakan atau matikan *Connection pooling* untuk mendapat kedua versinya):
   ```bash
   DATABASE_URL="postgresql://...-pooler...?sslmode=require"
   DIRECT_URL="postgresql://...(tanpa -pooler)...?sslmode=require"
   ```

4. Buat `lib/db/schema.ts` dengan satu tabel uji:
   ```ts
   import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

   // Tabel uji. Hapus lewat migrasi baru setelah skema asli dibuat.
   export const tesKoneksi = pgTable("tes_koneksi", {
     id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
     pesan: text("pesan").notNull(),
     dibuatPada: timestamp("dibuat_pada", { withTimezone: true })
       .notNull()
       .defaultNow(),
   });
   ```

5. Buat `lib/db/index.ts` untuk koneksi. Koneksi dibuat saat `getDb()` dipanggil, bukan saat file di-import, supaya `pnpm build` tidak gagal di mesin yang belum punya `DATABASE_URL`:
   ```ts
   import { neon } from "@neondatabase/serverless";
   import { drizzle } from "drizzle-orm/neon-http";

   // Hanya untuk kode server. Jangan di-import dari file "use client".
   let dbTersimpan: ReturnType<typeof buatDb> | undefined;

   function buatDb() {
     const databaseUrl = process.env.DATABASE_URL;
     if (!databaseUrl) {
       throw new Error("DATABASE_URL belum diisi di .env.local");
     }
     return drizzle({ client: neon(databaseUrl) });
   }

   export function getDb() {
     dbTersimpan ??= buatDb();
     return dbTersimpan;
   }
   ```
   Pada versi rc, `drizzle()` tidak lagi menerima opsi `schema`. Jika nanti memakai *relations* (query relasi), definisikan dengan `defineRelations` dan kirim lewat opsi `relations`: `drizzle({ client, relations })`. Tabel biasa untuk `select`, `insert`, dan `update` tidak membutuhkannya.
   Berhati-hati saat mengetik `DATABASE_URL`: salah satu huruf (misalnya `DATABASSE_URL`) tidak menimbulkan error di editor, tetapi nilainya akan kosong saat dijalankan.

6. Buat `drizzle.config.ts` di root repo. `drizzle-kit` berjalan di luar Next.js sehingga tidak otomatis membaca `.env.local`. `loadEnvConfig` dari `@next/env` memuat file `.env*` dengan aturan yang sama seperti Next.js:
   ```ts
   import { loadEnvConfig } from "@next/env";
   import { defineConfig } from "drizzle-kit";

   loadEnvConfig(process.cwd());

   if (!process.env.DIRECT_URL) {
     throw new Error("DIRECT_URL belum diisi di .env.local");
   }

   export default defineConfig({
     dialect: "postgresql",
     schema: "./lib/db/schema.ts",
     out: "./drizzle",
     dbCredentials: {
       url: process.env.DIRECT_URL,
     },
   });
   ```

7. Tambahkan dua script di `package.json` (bagian `scripts`). Sengaja tidak ada script `push`:
   ```json
   "db:generate": "drizzle-kit generate",
   "db:migrate": "drizzle-kit migrate"
   ```

8. Buat dan terapkan migrasi pertama:
   ```bash
   pnpm db:generate   # membuat folder drizzle/ berisi file SQL
   pnpm db:migrate    # menerapkan ke branch Neon pribadimu
   ```
   Cek di dashboard Neon (menu Tables) bahwa tabel `tes_koneksi` muncul.

9. Buat halaman uji sementara `app/cek-database/page.tsx`. Next.js 16 dengan Cache Components mewajibkan akses data yang berubah-ubah dibungkus `<Suspense>`, dan `connection()` membuatnya dijalankan saat ada permintaan (bukan saat build):
   ```tsx
   import { count } from "drizzle-orm";
   import { connection } from "next/server";
   import { Suspense } from "react";
   import { getDb } from "@/lib/db";
   import { tesKoneksi } from "@/lib/db/schema";

   // HALAMAN SEMENTARA. Hapus folder app/cek-database/ sebelum rilis ke main.
   async function HasilTes() {
     await connection();
     try {
       const [baris] = await getDb().select({ jumlah: count() }).from(tesKoneksi);
       return <p>Koneksi berhasil. Jumlah baris: {baris.jumlah}</p>;
     } catch {
       return <p>Koneksi gagal. Cek .env.local dan pastikan migrasi sudah jalan.</p>;
     }
   }

   export default function CekDatabasePage() {
     return (
       <>
         <h1>Cek koneksi database</h1>
         <Suspense fallback={<p>Memeriksa koneksi...</p>}>
           <HasilTes />
         </Suspense>
       </>
     );
   }
   ```
   Jalankan `pnpm dev`, lalu buka `http://localhost:3000/cek-database`.

10. Rapikan sisa Prisma di repo:

    | Berkas | Yang diubah |
    |---|---|
    | `.env.example` | Komentar "dipakai Prisma untuk migrasi" menjadi "dipakai untuk migrasi" |
    | `.prettierignore` | Ganti `prisma/migrations` dengan `drizzle` |
    | `.vscode/extensions.json` | Hapus `Prisma.prisma` |

11. Jalankan `pnpm lint` dan `pnpm build`, lalu buka PR ke `development`.

Setelah di-merge, isi `DATABASE_URL` dan `DIRECT_URL` di pengaturan Vercel, **terpisah** untuk Preview dan Production. Jangan mengisi Production dengan database pengembangan.

Catatan untuk dibahas tim sebelum membangun fitur stok toko dan kuota event: driver `neon-http` yang dipakai di atas cocok untuk query biasa di Vercel, tetapi setahu kami tidak mendukung transaksi interaktif. Jika nanti butuh transaksi, pertimbangkan driver lain (WebSocket atau `node-postgres`) dan cek dokumentasi Drizzle dan Neon dulu.

### 6.3 Alur mengubah struktur tabel

| Berkas | Fungsi |
|---|---|
| `lib/db/schema.ts` | Definisi tabel |
| `lib/db/index.ts` | Koneksi (`getDb()`), hanya untuk kode server |
| `drizzle.config.ts` | Pengaturan drizzle-kit (membaca `.env.local`) |
| `drizzle/` | File migrasi hasil `generate`. Di-commit, jangan diedit manual |

Langkah:
1. `git pull`, lalu terapkan migrasi baru dari rekan: `pnpm db:migrate`.
2. Ubah `lib/db/schema.ts`.
3. `pnpm db:generate` untuk membuat file migrasi, lalu baca isi file SQL-nya.
4. `pnpm db:migrate` untuk menerapkannya ke branch Neon pribadi.
5. Commit `lib/db/schema.ts` dan folder `drizzle/` dalam PR yang sama.

Jangan memakai `drizzle-kit push` pada database bersama, karena `push` mengubah database tanpa meninggalkan file migrasi. Jangan mengedit file migrasi yang sudah di-merge. Kalau salah, buat migrasi baru.

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
