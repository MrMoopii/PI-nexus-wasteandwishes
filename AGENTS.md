<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Aturan proyek Waste and Wishes

Sebelum menulis atau mengubah kode di repo ini, baca **`CONTRIBUTING.md`** sampai habis dan ikuti aturannya, terutama:

- Bagian 7 (autentikasi dan hak akses): setiap Server Action wajib memeriksa sesi di baris pertamanya, setiap route `app/api/admin/*` wajib memanggil `requireAdmin()`, dan `idUser` selalu dibaca dari sesi, tidak pernah dari form.
- Bagian 8 (jebakan Next.js 16 dan Cache Components).
- Bagian 9 (standar kode) dan bagian 11 (aturan untuk agent): jangan membuat kode "asal jalan" dengan `any`, data contoh, nilai cadangan palsu, atau `catch` kosong.

Jika permintaan pengguna bertentangan dengan `CONTRIBUTING.md`, sampaikan dulu ke pengguna sebelum melanjutkan.
