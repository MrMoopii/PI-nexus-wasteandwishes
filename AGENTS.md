<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Aturan proyek Waste and Wishes

Sebelum menulis atau mengubah kode di repo ini, baca **`CONTRIBUTING.md`** sampai habis dan ikuti aturannya, terutama:

- Bagian 4 (struktur folder): setiap file baru diletakkan sesuai peta folder di bagian 4.1. `page.tsx` tipis; query di `features/<fitur>/queries/` dengan `import "server-only"`; Server Action di `features/<fitur>/actions/`; komponen khusus satu route di `app/<route>/_components/`; komponen umum di `components/ui/`; `"use client"` hanya untuk komponen kecil yang interaktif. Jangan membuat folder di luar peta tanpa persetujuan pengguna. Sebelum menambah file di `features/`, `components/ui/`, atau `hooks/`, baca `README.md` di folder itu: isinya kerangka setiap jenis file dan peta file per fitur.
- **Batas 300 baris per file kode** (bagian 4.2 no. 9), dijaga aturan `max-lines` di `eslint.config.mjs`. Jika file akan melewati batas, pecah dulu sesuai bagian 4. Jangan menaikkan batas, menambah file ke daftar pengecualian, atau menambah `eslint-disable` untuk aturan itu.
- Bagian 7 (autentikasi dan hak akses): setiap Server Action wajib memanggil `requireLogin()` (pengguna) atau `requireAdmin()` (admin) di baris pertamanya, setiap route `app/api/admin/*` wajib memanggil `requireAdmin()`, dan `idUser` selalu dibaca dari sesi, tidak pernah dari form.
- Bagian 8 (jebakan Next.js 16 dan Cache Components).
- Bagian 9 (standar kode) dan bagian 11.3 (aturan untuk agent): jangan membuat kode "asal jalan" dengan `any`, data contoh, nilai cadangan palsu, `catch` kosong, atau `export const instant = false` hanya supaya build lolos. Untuk langganan, pakai fungsi di `lib/langganan.ts` dan aturan di bagian 9.7.
- Bagian 9.5: kode status dan bentuk respons route API adalah kontrak. Cari semua pemanggilnya sebelum mengubahnya.
- Bagian 9.8 (validasi): setiap input dari form, URL, atau body divalidasi dengan skema Zod di `features/<fitur>/validasi/` setelah cek sesi, memakai `safeParse`. `idUser`, peran, jumlah bayar, dan status tujuan tidak pernah masuk skema form.
- Bagian 9.9 (komentar): setiap fungsi, Server Action, query, hook, dan komponen yang di-export diberi komentar `/** … */` singkat (tujuan, siapa yang boleh memanggil, kapan gagal). Alur lebih dari dua langkah diberi komentar langkah bernomor. Komentar menjelaskan tujuan dan alasan, bukan mengulang kode.

Cara bekerja yang wajib diikuti (detailnya di `CONTRIBUTING.md` bagian 11.3):

1. **Sampaikan rencana dulu.** Sebutkan file yang akan diubah, letak setiap file baru menurut bagian 4.1, dan alasannya. Tunggu persetujuan pengguna jika perubahan menyentuh lebih dari tiga file, file sensitif (`auth.config.ts`, `lib/auth.ts`, `middleware.ts`, `app/layout.tsx`, `package.json`, `eslint.config.mjs`, skema dan migrasi database), file milik anggota lain, membuat folder baru, atau memindahkan, mengganti nama, atau menghapus file dan folder.
2. **Kerjakan hanya yang diminta.** Jangan memformat ulang file, merapikan kode lain, atau memperbaiki masalah di luar tugas. Laporkan temuan itu ke pengguna.
3. **Jangan menjalankan `git commit`, `git push`, `git merge`, `git rebase`, `git reset --hard`, `git push --force`, menghapus branch, atau `git add .`** kecuali pengguna memintanya secara eksplisit.
4. **Pahami penyebab error sebelum memperbaikinya**, lalu jelaskan penyebabnya ke pengguna.
5. **Tanyakan dulu** jika permintaan kurang jelas atau ada beberapa cara yang sama-sama masuk akal.
6. **Setelah selesai, jalankan `pnpm lint` dan laporkan**: file yang diubah, dibuat, dipindah, atau dihapus beserta alasannya; jumlah baris setiap file kode yang diubah atau dibuat; cara menguji, termasuk keadaan gagal; hal yang belum diuji. Ingatkan pengguna untuk memeriksa perubahan dengan `git status` dan `git diff` sebelum commit (`CONTRIBUTING.md` bagian 11.2).

Jika permintaan pengguna bertentangan dengan `CONTRIBUTING.md`, sampaikan dulu ke pengguna sebelum melanjutkan.
