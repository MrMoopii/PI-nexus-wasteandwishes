@AGENTS.md

## Catatan khusus Claude Code

Claude Code membaca `CLAUDE.md`, bukan `AGENTS.md`. Baris `@AGENTS.md` di atas memuat aturan bersama untuk semua AI agent, jadi jangan dihapus.

- Di awal setiap sesi, baca `CONTRIBUTING.md` sampai habis seperti yang diminta `AGENTS.md`, sebelum menulis kode apa pun.
- Sebelum mengedit file, sampaikan rencana: file yang diubah, letak setiap file baru menurut peta folder di `CONTRIBUTING.md` bagian 4.1, dan alasannya. Tunggu persetujuan pengguna.
- Setelah mengubah file, jalankan `pnpm lint`. Error `max-lines` berarti file harus dipecah sesuai bagian 4, bukan batasnya yang dinaikkan.
