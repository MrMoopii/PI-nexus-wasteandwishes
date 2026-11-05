<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Aturan proyek Waste and Wishes

Sebelum menulis atau mengubah kode di repo ini, baca **`CONTRIBUTING.md`** sampai habis dan ikuti aturannya, terutama:

- Bagian 7 (autentikasi dan hak akses): setiap Server Action wajib memanggil `requireLogin()` (pengguna) atau `requireAdmin()` (admin) di baris pertamanya, setiap route `app/api/admin/*` wajib memanggil `requireAdmin()`, dan `idUser` selalu dibaca dari sesi, tidak pernah dari form.
- Bagian 8 (jebakan Next.js 16 dan Cache Components).
- Bagian 9 (standar kode) dan bagian 11.3 (aturan untuk agent): jangan membuat kode "asal jalan" dengan `any`, data contoh, nilai cadangan palsu, `catch` kosong, atau `export const instant = false` hanya supaya build lolos.
- Bagian 9.5: kode status dan bentuk respons route API adalah kontrak. Cari semua pemanggilnya sebelum mengubahnya.

Cara bekerja yang wajib diikuti (detailnya di `CONTRIBUTING.md` bagian 11.3):

1. **Sampaikan rencana dulu.** Sebutkan file yang akan diubah dan alasannya. Tunggu persetujuan pengguna jika perubahan menyentuh lebih dari tiga file, file sensitif (`auth.config.ts`, `lib/auth.ts`, `middleware.ts`, `app/layout.tsx`, `package.json`, skema dan migrasi database), file milik area lain, atau memindahkan, mengganti nama, atau menghapus file dan folder.
2. **Kerjakan hanya yang diminta.** Jangan memformat ulang file, merapikan kode lain, atau memperbaiki masalah di luar tugas. Laporkan temuan itu ke pengguna.
3. **Jangan menjalankan `git commit`, `git push`, `git merge`, `git rebase`, `git reset --hard`, `git push --force`, menghapus branch, atau `git add .`** kecuali pengguna memintanya secara eksplisit.
4. **Pahami penyebab error sebelum memperbaikinya**, lalu jelaskan penyebabnya ke pengguna.
5. **Tanyakan dulu** jika permintaan kurang jelas atau ada beberapa cara yang sama-sama masuk akal.
6. **Setelah selesai, laporkan**: file yang diubah, dibuat, dipindah, atau dihapus beserta alasannya; cara menguji, termasuk keadaan gagal; hal yang belum diuji. Ingatkan pengguna untuk memeriksa perubahan dengan `git status` dan `git diff` sebelum commit (`CONTRIBUTING.md` bagian 11.2).

Jika permintaan pengguna bertentangan dengan `CONTRIBUTING.md`, sampaikan dulu ke pengguna sebelum melanjutkan.
