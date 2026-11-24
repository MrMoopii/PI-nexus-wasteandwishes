# Panduan Kontribusi Tim

Proyek: website Waste and Wishes (langganan pengambilan sampah organik beserta tracker dan laporannya, informasi event, dan toko).
Dokumen ini adalah aturan kerja bersama. Jika ada yang perlu diubah, ubah lewat Pull Request.

> **Untuk AI agent:** baca seluruh dokumen ini sebelum menulis atau mengubah kode, lalu ikuti aturannya. Aturan di sini dibuat dari masalah yang benar-benar pernah terjadi di proyek ini. Jika permintaan pengguna bertentangan dengan aturan di sini, sampaikan dulu ke pengguna sebelum melanjutkan. Letak file baru mengikuti bagian 4, dan setiap file kode maksimal 300 baris (bagian 4.2). Ringkasan untuk agent ada di bagian 11.3.

## Daftar isi

1. Persiapan di laptop
2. Next.js 16: baca dokumentasinya dulu
3. Alur kerja Git
4. Struktur folder dan pembagian kerja
5. Variabel lingkungan, rahasia, dan Vercel
6. Database (PostgreSQL di Neon)
7. Autentikasi dan hak akses
8. Next.js 16 dan Cache Components: jebakan yang sudah pernah terjadi
9. Standar kode
10. Daftar periksa sebelum membuka PR
11. Menggunakan AI agent

## 1. Persiapan di laptop

1. Pasang Node.js LTS, Git, dan **pnpm versi yang sama dengan `packageManager` di `package.json`**. Cek dengan `pnpm -v`. pnpm versi lama bisa menolak `pnpm-lock.yaml`.
2. Clone repo, lalu jalankan:
   ```bash
   pnpm install
   cp .env.example .env.local   # isi nilainya, lihat bagian 5
   pnpm db:migrate              # terapkan migrasi ke branch Neon pribadimu, lihat bagian 6
   pnpm dev                     # buka http://localhost:3000
   ```
3. Ekstensi VS Code yang disarankan: ESLint, Prettier, Tailwind CSS IntelliSense.

**Gunakan pnpm saja.** Jangan menjalankan `npm install` atau `yarn`, dan jangan meng-commit `package-lock.json` atau `yarn.lock`. Commit `pnpm-lock.yaml` setiap kali menambah atau mengubah library.

**Kerjakan kode di laptop (VS Code), bukan lewat editor di halaman GitHub.** Mengedit di GitHub tidak bisa menjalankan `pnpm build`, sehingga error baru ketahuan di Vercel satu per satu. Jika sedang tidak memakai laptop, gunakan GitHub Codespaces (punya terminal).

## 2. Next.js 16: baca dokumentasinya dulu

Versi Next.js di proyek ini berbeda dari banyak tutorial di internet. Sebelum menulis kode untuk fitur baru, baca panduan yang relevan di `node_modules/next/dist/docs/` (tersedia setelah `pnpm install`). Perhatikan juga peringatan deprecation di terminal saat `pnpm dev`. Aturan yang sama berlaku untuk AI agent (lihat `AGENTS.md`). Jebakan Next.js 16 yang sudah pernah terjadi di proyek ini dikumpulkan di bagian 8.

## 3. Alur kerja Git

### 3.1 Aturan dasar

- Branch `main` dan `development` dilindungi. Tidak ada yang push langsung ke keduanya.
- Semua pekerjaan membangun web dikerjakan lewat branch `development`. Isinya baru dirilis ke `main` (Production di Vercel) setelah web benar-benar jadi dan build `development` hijau.
- Setiap pekerjaan dikerjakan di branch sendiri, dibuat dari `development` yang **terbaru**:
  ```bash
  git fetch origin
  git switch development
  git pull
  git switch -c feat/halaman-event
  ```
  Salinan lokal yang usang pernah membuat branch baru dibuat dari `development` lama, sehingga PR-nya tertinggal banyak commit dan berkonflik.
- Penamaan branch: `feat/...` (fitur), `fix/...` (perbaikan), `chore/...` (konfigurasi), `docs/...` (dokumen).
- Pesan commit singkat dan jelas dalam Bahasa Indonesia, menyebut apa yang berubah. Contoh: `feat: tambah halaman daftar event`, `fix: validasi id event di halaman detail`. Hindari pesan seperti `Fix` atau `revisi` saja.
- Buka Pull Request ke `development`, isi template PR, dan minta **minimal 1 reviewer**. Penulis PR tidak bisa menyetujui PR-nya sendiri, dan persetujuan lama gugur kalau ada push baru.
- Jaga PR tetap kecil (satu fitur atau satu perbaikan). Pisahkan PR menurut tema, misalnya keamanan, tampilan, dan migrasi database masing-masing satu PR.
- Gunakan **Draft PR** untuk pekerjaan yang belum selesai.
- Setelah PR di-merge, hapus branch-nya. PR yang sudah tidak dipakai ditutup, jangan dibiarkan menggantung.

### 3.2 Sebelum membuka PR: perbarui branch dari `development`

Vercel membangun Preview dari **isi branch PR itu sendiri**, bukan dari hasil gabungannya dengan `development`. Dua PR yang masing-masing lolos build bisa gagal setelah digabung. Ini sudah terjadi beberapa kali:

- PR dashboard admin menambah `usePathname()` di layout admin, PR lain menambah route dinamis `/admin/events/edit/[id]`. Masing-masing lolos, gabungannya gagal build.
- Satu PR mengganti `db` menjadi `getDb()`, PR lain masih memakai `db`. Gabungannya gagal build.
- Perbaikan `app/event/actions.ts` sudah masuk `development`, tetapi branch lain masih membawa versi lama sehingga Preview-nya tetap merah.

Karena itu, **sebelum membuka PR dan sebelum minta review**:

```bash
git fetch origin
git merge origin/development
pnpm build
```

Lewat GitHub, tombol **Update branch** di halaman PR melakukan hal yang sama. Tombol ini hanya muncul jika pengaturan repo **Settings → General → Pull Requests → "Always suggest updating pull request branches"** dinyalakan. Setelah memperbarui branch, tetap jalankan `pnpm build` di laptop.

Tim memakai **merge**, bukan rebase. Branch yang sudah di-push dan punya PR tidak boleh ditulis ulang riwayatnya. Jika `git pull origin development` berhenti dengan pesan _"You have divergent branches and need to specify how to reconcile them"_, tidak ada yang rusak: pakai dua perintah di atas (`git fetch` lalu `git merge`), atau setel sekali di repo ini dengan `git config pull.rebase false`.

**Pilih satu cara memperbarui branch PR**: lewat laptop (`git fetch` lalu `git merge origin/development`) **atau** tombol **Update branch** di GitHub, jangan keduanya. Jika memakai tombol, langsung jalankan `git pull` di laptop sebelum mengubah apa pun. Jika tidak, laptop dan GitHub masing-masing punya commit merge sendiri, lalu push ditolak (_non-fast-forward_). Ini pernah terjadi di PR #123.

- Push yang ditolak diselesaikan dengan `git pull --no-rebase origin <branch>`, lalu push lagi. **Jangan** `git push --force`.
- Push pertama sebuah branch memakai `git push -u origin <branch>`, supaya `git pull` berikutnya tahu harus menarik dari mana.

### 3.3 Menyelesaikan konflik merge

Git menggabungkan **teks**, bukan memahami **kode**. Hasil gabungan tanpa tanda konflik pun bisa rusak. Kasus yang pernah terjadi:

- Fungsi dari PR lain tersisip **di dalam** fungsi komponen halaman (`export` di dalam fungsi, build gagal).
- Dua `<form>` pembuka di satu halaman checkout (satu dari tiap branch).
- Potongan kartu event versi lama tersisip di tengah kartu versi baru, tanpa tanda konflik.
- Dua callback `session` di satu objek konfigurasi. Kunci yang ditulis belakangan menang, sehingga versi baru diam-diam tertimpa.
- Penanda konflik tersisip di tengah kata (`user.i>>>>>>> origin/development`).

Setelah menyelesaikan konflik:

1. Cari sisa penanda di seluruh proyek (Ctrl+Shift+F): `<<<<<<<`, `=======`, `>>>>>>>`.
2. Periksa apa saja yang dibawa merge ke file yang kamu kerjakan: `git diff <commit-terakhirmu-sebelum-merge> -- <folder>`. Cari blok ganda, kode versi lama, dan kurung yang tidak berpasangan.
3. Pastikan setiap fungsi, callback, dan blok JSX hanya muncul sekali.
4. Jalankan **Format Document** (Shift+Alt+F). Indentasi yang aneh menandakan kurung yang salah.
5. Jalankan `pnpm build` sampai lolos, **baru** commit dan push.
6. Jika konflik menyentuh file milik anggota lain, kabari pemiliknya dan sebutkan di deskripsi PR apa yang kamu ubah di file itu.

Sebelum menggabungkan dua branch yang berkonflik besar, buat branch cadangan dulu. Jika macet, batalkan dengan `git merge --abort`. Daftar file berkonflik: `git diff --name-only --diff-filter=U`.

**Saat merge, jangan `git add .`.** File yang berhasil digabung otomatis dari `development` sudah di-stage oleh Git (itu sebabnya banyak file bertanda "M" yang bukan buatanmu). Yang perlu kamu `git add` atau `git rm` hanya file yang kamu selesaikan sendiri. Baca `git status`:

| Bagian di `git status`          | Artinya                                                | Tindakan                           |
| ------------------------------- | ------------------------------------------------------ | ---------------------------------- |
| `Changes to be committed`       | Perubahan dari branch yang digabung, sudah di-stage    | Biarkan                            |
| `Unmerged paths`                | Konflik yang belum diselesaikan                        | Selesaikan, lalu `add` atau `rm`   |
| `Changes not staged for commit` | File yang kamu ubah sendiri setelah merge dimulai      | `git add <file>`                   |
| `Untracked files`               | File baru yang belum pernah dilacak (bisa tak sengaja) | Periksa dulu, jangan asal ditambah |

Commit baru boleh dibuat setelah `git status` menulis _"All conflicts fixed but you are still merging"_.

**Konflik "modify/delete"** terjadi jika satu branch memindahkan atau menghapus file, sementara branch lain mengubah file yang sama. GitHub menampilkan _"These conflicts are too complex to resolve in the web editor"_, jadi selesaikan di laptop. Di sini `ours` adalah branch yang sedang aktif dan `theirs` adalah branch yang digabung. Contoh yang pernah terjadi: `components/Header.tsx` dipindah ke `components/header/Header.tsx`, sementara di `development` link `/toko` diubah menjadi `/toko`. Penyelesaiannya: `git rm components/Header.tsx` (file lama memang sudah pindah), lalu salin perubahan dari `development` ke file di lokasi baru secara manual. Jangan sampai perubahan teman ikut hilang bersama file lama.

### 3.4 Setelah PR di-merge ke `development`

- Jalankan `pnpm build` dari `development` terbaru, karena dua PR yang lolos sendiri-sendiri bisa gagal setelah digabung.
- Cek status deployment Vercel untuk commit `development` terbaru.
- Jika PR membawa migrasi baru, semua anggota menjalankan `pnpm db:migrate` (lihat bagian 6).
- Hapus branch yang sudah di-merge, di GitHub dan di laptop (`git branch -d nama-branch`).

### 3.5 Rilis ke `main` dan sinkronisasi balik

- Rilis dilakukan lewat PR `development` → `main`. PR ini di-merge dengan opsi **Create a merge commit**.
- Merge commit itu hanya ada di `main`, sehingga GitHub menulis `development` "1 commit behind main", walaupun isi file keduanya sama. Sinkronkan lewat PR `main` → `development`, juga dengan **Create a merge commit**. Jangan memakai _Squash_ atau _Rebase_ untuk PR sinkronisasi, karena commit dari `main` tidak akan tercatat dan `development` tetap terlihat tertinggal.
- Sebelum menyetujui PR sinkronisasi, cek tab **Files changed**. Jika isinya 0 file, PR itu aman. Jika ada file yang berubah, berarti ada yang langsung masuk ke `main` tanpa lewat `development`, dan itu perlu ditanyakan dulu.
- GitHub mengambil template PR (`.github/pull_request_template.md`) dari `main`, default branch repo ini. Perubahan template baru berlaku setelah dirilis ke `main`. Sampai saat itu, sesuaikan isi deskripsi PR secara manual.

### 3.6 Pemeriksaan otomatis di GitHub (Lint)

- Setiap PR ke `development` dan `main` menjalankan workflow **Lint** (`.github/workflows/lint.yml`): `pnpm install`, lalu `pnpm lint`, termasuk batas 300 baris per file kode. Workflow ini tidak memakai rahasia apa pun.
- Pemeriksaan ini dijadikan _required status check_ di proteksi branch `development` dan `main`. PR yang gagal lint tidak bisa di-merge, siapa pun dan alat apa pun yang menulis kodenya.
- Jika gagal, buka tab **Checks** di PR, baca error-nya, perbaiki di laptop, jalankan `pnpm lint` sampai bersih, lalu push lagi. Jangan mematikan aturan lint atau mengubah workflow supaya lolos.
- Build belum diperiksa otomatis. Tetap jalankan `pnpm build` di laptop sebelum membuka PR (bagian 3.2).

## 4. Struktur folder dan pembagian kerja

Struktur ini disepakati tim pada 23 November 2026. **Semua kode baru wajib mengikutinya**, supaya setiap anggota (dan AI agent-nya) tidak lagi membuat susunan sendiri-sendiri.

Next.js sendiri tidak mewajibkan satu struktur. Dokumentasinya menyarankan memilih satu strategi lalu konsisten. Struktur di bawah adalah gabungan dari sumber yang bisa dicek sendiri:

- Next.js: [Project Structure](https://nextjs.org/docs/app/getting-started/project-structure), [Data Security](https://nextjs.org/docs/app/guides/data-security), dan [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- Contoh dashboard resmi [Next.js Learn](https://github.com/vercel/next-learn/tree/main/dashboard/final-example)
- [bulletproof-react](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md)
- React: [Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

### 4.1 Peta folder

```text
app/                          hanya routing: page, layout, loading, error, route
  <route>/
    page.tsx                  Server Component tipis: cek akses, ambil data, susun komponen
    _components/              komponen yang hanya dipakai route ini
  api/                        route handler (webhook, API admin)
features/                     logika per fitur: langganan, kunjungan, laporan, dan seterusnya
  <fitur>/
    types.ts                  tipe status dan bentuk data untuk tampilan
    aturan.ts                 fungsi murni tanpa database (transisi status, perhitungan)
    queries/<peran>.ts        membaca data; baris pertama import "server-only"
    actions/<peran>.ts        Server Action ("use server"), tipis
    components/               komponen fitur yang dipakai lebih dari satu halaman
components/
  ui/                         komponen umum tanpa logika bisnis (button, badge, card, field)
  header/                     bagian tata letak global
hooks/                        hook klien yang dipakai lebih dari satu fitur
lib/                          infrastruktur: db/, auth.ts, midtrans.ts, imagekit.ts, format-tanggal.ts, require-*.ts
types/                        deklarasi tipe global (next-auth.d.ts)
```

`<peran>` adalah `pelanggan`, `admin`, atau nama proses (misalnya `pembayaran`). Pemisahan per peran juga membuat setiap anggota memegang file sendiri, sehingga jarang konflik.

| Yang ditulis                                            | Letaknya                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Halaman dan route API                                   | `app/` (hanya file routing Next.js dan `_components/`)                  |
| Komponen yang hanya dipakai satu route                  | `app/<route>/_components/`                                              |
| Komponen yang dipakai beberapa halaman dalam satu fitur | `features/<fitur>/components/`                                          |
| Komponen umum lintas fitur, tanpa logika bisnis         | `components/ui/`                                                        |
| Membaca data dari database                              | `features/<fitur>/queries/`                                             |
| Mengubah data (Server Action)                           | `features/<fitur>/actions/`                                             |
| Aturan bisnis yang bisa dihitung tanpa database         | `features/<fitur>/aturan.ts`                                            |
| Tipe untuk tampilan                                     | `features/<fitur>/types.ts`. Tipe tabel diambil dari skema (bagian 9.2) |
| Hook klien yang dipakai lebih dari satu fitur           | `hooks/use-<nama>.ts`                                                   |
| Koneksi, autentikasi, layanan luar, format umum         | `lib/`                                                                  |
| Skema dan migrasi database                              | `lib/db/schema.ts` dan `drizzle/` (bagian 6)                            |
| Fungsi bantu yang sudah ada                             | Cek tabel di bagian 9.1 sebelum menulis yang baru                       |

**Kerangka setiap jenis file** (query, Server Action, halaman, komponen klien, komponen umum, hook) ada di `features/README.md`, `components/ui/README.md`, dan `hooks/README.md`. **Peta file setiap fitur** yang sedang dibangun, lengkap dengan kode tugasnya, ada di `features/<fitur>/README.md`. Baca README folder itu sebelum menambah file di dalamnya, dan perbarui peta filenya jika rencana berubah.

Folder fitur lama di `components/` tetap dipakai sampai dipindahkan (bagian 4.4):

| Folder                     | Isi                                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/header/`       | `Header` (server, membaca sesi), `HeaderBingkai` (tampilan bersama), `HeaderKerangka` (fallback), `NavLink` (klien, penanda menu aktif), `ProfileDropdown` |
| `components/event-slider/` | `EventSliderServer` (server, membaca database dan sesi), `EventSlider` (klien, animasi), `EventSliderKerangka` (fallback)                                  |

### 4.2 Aturan menulis kode di struktur ini

1. **`page.tsx` tipis.** Isinya cek akses, panggil fungsi query, lalu susun komponen. Query database, perhitungan bisnis, dan JSX panjang tidak ditulis di page.
2. **Query** ditulis di `features/<fitur>/queries/*.ts` dengan `import "server-only";` di baris pertama, supaya build gagal jika file itu terimpor ke komponen klien. Cek otorisasi dilakukan di sini, dan yang dikembalikan hanya kolom yang dibutuhkan tampilan (bagian 7.2 no. 7).
3. **Server Action tipis** di `features/<fitur>/actions/*.ts`: `"use server"`, lalu `requireLogin()` atau `requireAdmin()` di baris pertama fungsi, validasi input, ubah data, `revalidatePath`. Kembalikan hanya yang dibutuhkan tampilan, bukan baris database utuh.
4. **`"use client"` hanya untuk komponen kecil yang interaktif**, yaitu yang memakai state, event klik, atau API browser. Data diambil di Server Component lalu dikirim lewat props.
5. **Komponen tampilan menerima data lewat props** dan tidak memanggil database. Komponen di `components/ui/` tidak tahu apa pun soal langganan, event, atau tabel mana pun.
6. **Fitur tidak saling impor.** `features/langganan/` tidak mengimpor dari `features/kunjungan/`, dan sebaliknya. Yang dipakai bersama dipindahkan ke `components/`, `hooks/`, atau `lib/`. Arah impor: `lib/`, `components/`, `hooks/` → `features/` → `app/`.
7. **Hook** hanya untuk logika stateful di Client Component yang dipakai di lebih dari satu tempat. Namanya diawali `use`. Fungsi yang tidak memanggil hook bukan hook dan tidak diberi awalan `use`. Jangan membuat hook hanya untuk membungkus satu `useState`. Di kode baru, data dari database tidak diambil lewat hook dan `useEffect`, melainkan di Server Component.
8. **Nama file baru** memakai huruf kecil dengan tanda hubung, misalnya `form-pengajuan.tsx` atau `use-lokasi.ts`. Nama komponen di dalamnya tetap PascalCase (`FormPengajuan`). File lama tidak diganti namanya kecuali di PR pemindahan (bagian 4.4).
9. **Setiap file kode maksimal 300 baris** (`.ts`, `.tsx`, `.js`, `.mjs`), dihitung semua baris termasuk baris kosong dan komentar. Aturan ini dijaga `max-lines` di `eslint.config.mjs`, sehingga `pnpm lint` memberi error untuk file yang melewatinya.
   - Jika file mendekati batas, pecah **sebelum** menambah kode: JSX ke komponen anak, logika ke `aturan.ts`, `queries/`, atau `actions/`, dan tipe ke `types.ts`.
   - Jangan menaikkan batas, menambah `eslint-disable` untuk aturan ini, atau memindahkan isi ke satu file panjang lain.
   - Pengecualian sementara (hanya peringatan): `lib/db/schema.ts` dan file lama yang sudah melebihi batas sebelum aturan ini dibuat. Daftarnya ada di `eslint.config.mjs`. File-file ini **tidak boleh bertambah panjang**. Jika tugasmu harus mengubahnya, pindahkan dulu bagian yang kamu sentuh ke file baru sesuai struktur, atau minta file itu dipecah di PR tersendiri. Setelah sebuah file dipecah, hapus namanya dari daftar pengecualian.
   - File markdown (`*.md`), isi folder `drizzle/`, dan file yang dibuat alat lain tidak termasuk.

### 4.3 Pembagian kerja dan file milik anggota lain

Tugas dibagi per kode tugas di rencana kerja tim (misalnya 0.2, 1.1, 2.4). Anggota yang ditugaskan adalah pemilik file-file tugas itu sampai PR-nya di-merge.

- Jangan mengedit file milik anggota lain tanpa memberi tahu pemiliknya, terutama `app/layout.tsx`, `package.json`, `auth.config.ts`, `lib/auth.ts`, dan skema database.
- Jika butuh perubahan di file orang lain, kabari lewat grup tim atau buat issue di GitHub, lalu sepakati siapa yang mengerjakan.
- Jika dua orang perlu mengubah file yang sama, sepakati urutan merge-nya dulu. Yang kedua memperbarui branch dari `development` setelah PR pertama masuk.

### 4.4 Memindahkan dan mengganti nama file

**Memindahkan atau mengganti nama file dan folder** (termasuk folder route di `app/`) dikerjakan di PR tersendiri, diumumkan ke tim lebih dulu, dan dilakukan saat tidak ada yang sedang mengedit file tersebut. Branch lain yang masih mengedit file di lokasi lama akan mengalami konflik "modify/delete" (bagian 3.3).

File lama dipindahkan ke struktur 4.1 secara bertahap dengan cara ini, bukan sekaligus. Jangan memindahkan file lama di dalam PR fitur.

## 5. Variabel lingkungan, rahasia, dan Vercel

- Nama semua variabel terdaftar di `.env.example`. Nilai asli hanya di `.env.local` (tidak ikut Git, jangan pernah di-commit).
- Jika menambah variabel baru, tambahkan namanya (tanpa nilai) ke `.env.example` pada PR yang sama.
- Connection string database, kunci pembayaran, kunci privat ImageKit, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, dan `AUTH_GOOGLE_SECRET` adalah rahasia. Bagikan lewat pesan privat, jangan lewat GitHub, grup publik, atau screenshot.
- **Rahasia tidak pernah ditempel ke percakapan dengan AI** (bagian 11.1). Jika terlanjur, reset password role database itu di dashboard Neon. Konektor database untuk AI dipasang dalam mode read-only, dengan role khusus yang dibuat per branch Neon.
- Untuk pembayaran, pakai kunci **sandbox** selama pengembangan. Kunci produksi hanya dipasang di pengaturan hosting.

**`.env.local` tidak pernah sampai ke Vercel.** Mengisi `.env.local` hanya berlaku di laptopmu. Vercel membaca variabel dari **Project Settings → Environment Variables**, diisi terpisah untuk Preview dan Production:

| Variabel                                                                                       | Dipakai oleh                                  | Perlu di Vercel                         |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------- |
| `DATABASE_URL`                                                                                 | aplikasi (`lib/db/index.ts`)                  | ya                                      |
| `DIRECT_URL`                                                                                   | migrasi (`drizzle.config.ts`)                 | hanya jika migrasi dijalankan di Vercel |
| `AUTH_SECRET`                                                                                  | Auth.js                                       | ya                                      |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`                                                         | login Google                                  | ya                                      |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`                         | pembayaran (`lib/midtrans.ts`)                | ya (kunci sandbox untuk Preview)        |
| `APP_BASE_URL`                                                                                 | alamat kembali setelah membayar di Snap       | ya (URL deployment itu)                 |
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | unggah dan tampilkan foto (`lib/imagekit.ts`) | ya                                      |

Setelah mengubah variabel di Vercel, lakukan **Redeploy**. Build lama tidak ikut membaca variabel baru. Preview sebaiknya memakai branch Neon terpisah yang hanya berisi data uji.

Untuk login Google di Vercel, daftarkan `https://<domain-vercel>/api/auth/callback/google` sebagai Authorized redirect URI di Google Cloud Console. Selama aplikasi OAuth berstatus Testing, daftarkan email semua anggota tim sebagai test user.

### 5.1 Pengujian publik lewat ngrok (login Google dan pembayaran)

Notifikasi Midtrans tidak bisa sampai ke `localhost`, dan login Google lewat domain lain butuh alamat publik. Untuk menguji keduanya dari laptop:

1. Buat file `.env.production.local` di root proyek (tidak ikut Git, karena pola `.env*` sudah ada di `.gitignore`), berisi:
   ```env
   AUTH_URL=https://<domain-ngrok>
   APP_BASE_URL=https://<domain-ngrok>
   ```
   File ini hanya dibaca `pnpm build` dan `pnpm start`, jadi login di `pnpm dev` (localhost) tetap berjalan seperti biasa.
2. Jalankan `pnpm build`, lalu `pnpm start`, lalu `ngrok http 3000`. Jangan memakai `pnpm dev` lewat ngrok.
3. Daftarkan domain ngrok di Google Cloud Console: `https://<domain-ngrok>` sebagai origin dan `https://<domain-ngrok>/api/auth/callback/google` sebagai redirect URI. Setiap akun ngrok punya domain sendiri, jadi sepakati satu orang yang menjalankan server uji, atau daftarkan semua domain.
4. Cek `https://<domain-ngrok>/api/auth/providers`. `callbackUrl` harus memakai domain ngrok. Membuka `localhost` di laptop lain tidak membuktikan apa pun, karena itu server yang berbeda.
5. Untuk pembayaran, arahkan URL notifikasi pembayaran di dashboard Midtrans sandbox ke `https://<domain-ngrok>/api/midtrans/notification`.

## 6. Database (PostgreSQL di Neon)

Database pengembangan adalah satu project Neon bersama.

- Branch `production` dibiarkan bersih. Jangan dipakai bereksperimen.
- Setiap anggota memakai **branch database sendiri** dari dashboard Neon, lalu memakai connection string branch itu di `.env.local`. Paket gratis mengizinkan jumlah branch yang terbatas, jadi hapus branch yang tidak dipakai.
- Perubahan struktur tabel hanya lewat **file migrasi** yang di-commit lewat PR. Jangan mengubah tabel langsung di dashboard.
- Jangan menaruh data asli pelanggan di database pengembangan.

### 6.1 Istilah singkat

- **Neon**: tempat database PostgreSQL kita berjalan (di internet).
- **Drizzle ORM**: library untuk berbicara ke database lewat kode TypeScript. Versi yang dipakai `1.0.0-rc.4` untuk `drizzle-orm` dan `drizzle-kit`. Jangan dicampur dengan versi 0.x, dan jangan mengubah versinya tanpa kesepakatan tim (pernah turun ke 0.45.4 karena menambah `@auth/drizzle-adapter`).
- **drizzle-kit**: alat di terminal untuk membuat dan menerapkan **file migrasi** (catatan perubahan struktur tabel dalam bentuk SQL).
- **Connection string**: alamat lengkap database beserta username dan password. Ini rahasia.
  - **Pooled** (host berisi `-pooler`): dipakai **aplikasi** saat berjalan, disimpan di `DATABASE_URL`, dibaca oleh `lib/db/index.ts`.
  - **Direct** (tanpa `-pooler`): dipakai **migrasi**, disimpan di `DIRECT_URL`, dibaca oleh `drizzle.config.ts`. Migrasi lewat koneksi pooled bisa error.
  - Jangan menukar keduanya. Aplikasi tetap memakai `DATABASE_URL`, walaupun `drizzle.config.ts` memakai `DIRECT_URL`.

### 6.2 Berkas penting

| Berkas              | Fungsi                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `lib/db/schema.ts`  | Definisi tabel. Sumber kebenaran tipe data (lihat bagian 9)         |
| `lib/db/index.ts`   | Koneksi lewat `getDb()`, hanya untuk kode server                    |
| `drizzle.config.ts` | Pengaturan drizzle-kit (membaca `.env.local`, memakai `DIRECT_URL`) |
| `drizzle/`          | File migrasi hasil `generate`. Di-commit, jangan diedit manual      |

Aturan memakai `getDb()`:

- **Panggil `getDb()` di dalam fungsi**, bukan di tingkat atas file. `const db = getDb();` di luar fungsi dijalankan saat file di-import, termasuk saat `pnpm build` mengumpulkan data halaman. Build pernah gagal karena ini.
- `getDb()` hanya untuk kode server. Jangan di-import dari file `"use client"`.
- **Driver `neon-http` tidak mendukung transaksi interaktif.** Perubahan yang bergantung pada nilai lama (perpanjangan langganan, stok, kuota, perubahan status) ditulis sebagai **satu perintah SQL**, bukan baca-hitung-tulis di JavaScript:
  - `UPDATE … SET … WHERE <syarat nilai lama> RETURNING …`, misalnya `WHERE status IN ('menunggu_review', 'negosiasi')`. Jika `RETURNING` kosong, data sudah diubah di tempat lain: tampilkan pesan, jangan menimpa.
  - `UPDATE … SET kolom = CASE … END` untuk nilai yang dihitung dari nilai lama, seperti tanggal akhir langganan.
  - `WITH … UPDATE … RETURNING` lalu `INSERT … SELECT` dalam perintah yang sama, jika dua tabel harus berubah bersama (misalnya status pengajuan dan pesan negosiasinya).
  - Jika tetap butuh beberapa langkah yang harus atomik, diskusikan dulu dengan tim.

### 6.3 Alur mengubah struktur tabel

1. `git pull`, lalu terapkan migrasi baru dari rekan: `pnpm db:migrate`.
2. Ubah `lib/db/schema.ts`.
3. `pnpm db:generate` untuk membuat file migrasi, lalu baca isi file SQL-nya.
4. `pnpm db:migrate` untuk menerapkannya ke branch Neon pribadi.
5. Commit `lib/db/schema.ts` dan folder `drizzle/` dalam PR yang sama.
6. Di deskripsi PR, sebutkan tabel dan kolom yang berubah, lalu ingatkan semua anggota menjalankan `pnpm db:migrate`. Database yang dipakai Preview Vercel juga harus dimigrasi. Jika tidak, query akan gagal karena kolomnya tidak ada.
7. Jika menambah kolom yang dipakai di form admin atau halaman lain, kabari pemilik halaman itu.

**Hanya satu orang (pemilik skema) yang menjalankan `pnpm db:generate` dalam satu waktu.** Migrasi yang dibuat bersamaan di dua branch menghasilkan urutan migrasi dan snapshot yang sulit digabung. Anggota lain meminta perubahan tabel lewat pemilik skema.

Larangan:

- Jangan memakai `drizzle-kit push` pada database bersama, karena `push` mengubah database tanpa meninggalkan file migrasi.
- Jangan mengedit atau menghapus file migrasi yang sudah di-merge. Kalau salah, buat migrasi baru, termasuk untuk mengganti nama kolom.
- Jangan mengisi data contoh ke database dari kode aplikasi (misalnya Server Action yang menyisipkan event contoh). Kolom ID kita bertipe `generatedAlwaysAsIdentity`, sehingga Postgres menolak ID yang ditentukan sendiri. Data uji diisi lewat SQL Editor Neon atau DBeaver di branch pribadimu.

### 6.4 Membuat akun admin untuk pengujian

Belum ada cara membuat admin dari aplikasi. Di branch Neon pribadimu, ubah `peran` satu akun menjadi `'admin'` lewat SQL Editor, lalu **logout dan login ulang** supaya token sesi membawa peran baru. Siapkan juga satu akun `user` biasa untuk menguji bahwa aksesnya ditolak.

### 6.5 Data uji

- Data uji di branch Neon pribadi mencakup **kasus batas**, misalnya langganan yang berakhir hari ini, yang berakhir kemarin, dan pengguna tanpa baris langganan sama sekali.
- Tulis tanggal relatif terhadap hari ini, misalnya `(now() AT TIME ZONE 'Asia/Jakarta')::date - 1`, supaya data uji tetap bermakna besok.
- Saat menguji, cocokkan **siapa saja** yang terhitung, bukan hanya jumlahnya. Hitung hasil yang benar dari datanya, jangan dari hasil yang kamu harapkan.

## 7. Autentikasi dan hak akses

Proyek ini memakai Auth.js `5.0.0-beta.32` dengan sesi JWT. Jangan mengubah versinya tanpa kesepakatan tim.

### 7.1 Tiga lapis penjagaan

| Lapis                     | Berkas                 | Menjaga                                                                            |
| ------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| Middleware `authorized()` | `auth.config.ts`       | Navigasi **halaman** (`/admin`, `/event`, `/profil`, `/langganan`)                 |
| `requireLogin()`          | `lib/require-login.ts` | Server Action pengguna (dan route API pengguna jika nanti ada)                     |
| `requireAdmin()`          | `lib/require-admin.ts` | Route `app/api/admin/*` dan Server Action admin. Dibangun di atas `requireLogin()` |

`requireLogin()` memeriksa sesi ada, sesi tidak idle, dan `idUser` valid, lalu mengembalikan `idUser` sebagai **angka**. `requireAdmin()` memanggil `requireLogin()` terlebih dahulu, lalu menambahkan pengecekan peran (di sesi dan di database). Jadi aturan "siapa yang dianggap login" hanya ditulis di satu tempat. Jika aturan itu berubah, ubah `requireLogin()` saja.

Middleware **tidak** menjaga route API dan **tidak** menjaga Server Action. Server Action dipanggil lewat POST dengan header `Next-Action` dan bisa dikirim ke URL halaman mana pun, sehingga middleware sengaja meloloskannya. Pengecekan di browser (misalnya `fetch("/api/auth/me")` di layout admin) hanya mengatur tampilan, **bukan** pengaman.

### 7.2 Aturan wajib

1. **Setiap Server Action wajib memeriksa sesi di baris pertamanya**, tepat setelah `"use server"`. Server Action pengguna memanggil `requireLogin()`, Server Action admin memanggil `requireAdmin()`. Jangan menulis pengecekan `await auth()` dan `Number(session.user.idUser)` sendiri. Cara menangani kegagalan bergantung pada cara Server Action itu dipanggil:
   - **Dipasang langsung di `<form action={…}>`**: gunakan `redirect()`. Jangan `return` objek atau `NextResponse`, karena `action` hanya menerima fungsi yang tidak mengembalikan nilai.
     ```ts
     async function simpanEvent(formData: FormData) {
       "use server";
       const cek = await requireAdmin();
       if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");
       // ...
     }
     ```
   - **Dipanggil dari komponen klien yang membaca hasilnya** (misalnya `const result = await updateProfil(…)` lalu menampilkan `result.error`): kembalikan pesannya dalam bentuk yang dibaca form.
     ```ts
     export async function updateProfil(props: { … }) {
       const cek = await requireLogin();
       if (!cek.ok) return { error: cek.pesan };
       const idUser = cek.idUser; // sudah berupa number dan sudah divalidasi
       // ...
     }
     ```
   - Beri nama hasilnya `cek` (bukan `session`), karena isinya hasil pemeriksaan. Sesi aslinya ada di `cek.session`.
2. **Setiap route baru di `app/api/admin/` wajib memanggil `requireAdmin()` di awal handler**:
   ```ts
   const cek = await requireAdmin();
   if (!cek.ok) {
     return NextResponse.json({ error: cek.pesan }, { status: cek.status });
   }
   ```
   401 berarti belum login atau sesi idle. 403 berarti sudah login tetapi bukan admin.
3. **`idUser` selalu dibaca dari sesi di server, tidak pernah dari form, URL, atau hidden input.** Isian form bisa diubah siapa pun lewat DevTools. Isian form boleh berisi _pilihan_ pengguna (misalnya `id_event`), tetapi tidak boleh berisi _identitas_ pengguna.
4. **Filter hak akses dan visibilitas di query database, bukan di tampilan.** Contoh: halaman publik dan Server Action pendaftaran event mencari event dengan `statusEvent = "aktif"` langsung di `.where(...)`, supaya event draft tidak bisa dibuka atau didaftari lewat URL langsung.
5. **Jangan menambahkan `/api/...` ke `authorized()`.** Middleware akan mengalihkan ke halaman login (HTML), padahal pemanggil API butuh JSON 401 atau 403.
6. **Jangan mengembalikan string dari callback `signIn` kecuali untuk menolak login.** Mengembalikan string berarti login **dibatalkan** lalu dialihkan ke alamat itu. Mengarahkan admin dengan cara ini pernah membuat admin tidak bisa login dengan Google. Untuk mengarahkan pengguna setelah login, lakukan di halaman tujuan (misalnya `app/lengkapi-profil/page.tsx` mengalihkan admin ke `/admin`).
7. **Jangan meng-`select()` semua kolom `users` kalau tidak perlu.** Pilih kolom yang dipakai saja, supaya hash password dan data pribadi tidak ikut terambil.
8. **Pesan error login dibuat umum** ("Email atau password salah…"). Jangan membedakan "email belum terdaftar" dan "password salah", karena itu memungkinkan orang mengecek email mana yang punya akun (_account enumeration_).
9. **Larangan berdasarkan peran atau status dicek di Server Action atau route, bukan dengan menyembunyikan tombol.** Contoh: hanya akun berperan `user` yang boleh berlangganan dan membuat jadwal, jadi admin ditolak di Server Action-nya. Menyembunyikan tombol hanya mengatur tampilan, karena Server Action bisa dipanggil langsung tanpa tombol (bagian 7.1).

### 7.3 Struktur konfigurasi Auth.js

- `auth.config.ts` dipakai middleware. Isinya `authorized`, `jwt` sederhana, dan **satu-satunya** callback `session`. Tidak boleh ada query database di file ini.
- `lib/auth.ts` dipakai seluruh aplikasi. Ia menyebar konfigurasi bersama dengan `...authConfig`, dan di dalam `callbacks` dengan `...authConfig.callbacks`, lalu menambahkan `jwt` lengkap dan `signIn` (keduanya boleh query database).
- Spread `...` hanya menyalin satu lapis. Menulis `callbacks: { … }` tanpa `...authConfig.callbacks` akan **menghapus** callback dari `auth.config.ts`. Jangan menulis callback `session` kedua di `lib/auth.ts`.
- `peran` disimpan di token saat login. Perubahan peran di database baru terbaca middleware setelah login ulang. `requireAdmin()` mengecek ulang peran ke database.
- Aturan sesi idle dihitung dengan `hitungIdle()` di `lib/session.ts`, dan batas waktunya `SESSION_IDLE_TIMEOUT_MS` di file yang sama. Jangan menulis ulang rumus idle di tempat lain.
- Tipe tambahan sesi (`idUser`, `peran`, `isIdle`, dan lainnya) ada di `types/next-auth.d.ts`. `idUser` di sesi bertipe **string**. Di Server Action dan route, pakai `cek.idUser` dari `requireLogin()` atau `requireAdmin()`, yang sudah berupa angka dan sudah divalidasi. Di halaman (Server Component), ubah dengan `Number(...)` lalu validasi dengan pola di bagian 9.3.
- `session.user.isIdle` selalu bernilai `true` atau `false` (diisi callback `session` lewat `hitungIdle()`). Tulis pengecekannya tanpa `!`: `if (session.user.isIdle) { …tolak… }`.

## 8. Next.js 16 dan Cache Components: jebakan yang sudah pernah terjadi

Proyek ini menyalakan `cacheComponents`. Saat build, Next.js mencoba membuat versi statis setiap halaman, dan menolak kode yang membaca data runtime di tempat yang salah.

1. **Hook URL dan data per permintaan harus berada di bawah `<Suspense>`.** Ini termasuk `usePathname()`, `useSearchParams()`, `cookies()`, `headers()`, dan `await auth()`. `<Suspense>` hanya menangkap komponen **di bawahnya**, jadi pindahkan pemanggilan hook ke komponen anak lalu bungkus komponen itu. Contohnya `AdminNav` di layout admin. Error ini sering baru muncul di route dinamis seperti `[id]`, dan sering baru ketahuan saat `pnpm build`, bukan saat `pnpm dev`.
   - Halaman `"use client"` yang memakai `useSearchParams()` dipecah menjadi dua: `page.tsx` (Server Component berisi `<Suspense>`) dan `…-form.tsx` (`"use client"`, tempat hook dipanggil). Contohnya `app/auth/login/` dan `app/auth/register/`.
2. **Halaman yang membaca database per permintaan memanggil `await connection()` sebelum query.** Tanpa itu, query mulai dijalankan saat build lalu dibatalkan, dan log build penuh error "fetch() rejects when the prerender is complete". Pakai `export const instant = false` hanya jika `<Suspense>` tidak masuk akal. `instant` tidak bisa dipakai di file `"use client"`.
3. **`redirect()` dan `notFound()` tidak boleh di dalam `try/catch`.** Keduanya bekerja dengan melempar error khusus. Jika ditangkap `catch`, pengalihan tidak terjadi.
4. **Bedakan "tidak ada" dan "gagal".** Data yang memang tidak ada → `notFound()` (404). Query yang gagal → biarkan error naik ke `error.tsx` (500), atau tangkap dengan `try/catch` **hanya jika** ada tampilan pengganti yang bermakna (misalnya pesan "Gagal memuat event"). Isi `catch` minimal `console.error`. Jangan pernah diam-diam menampilkan data contoh.
5. **Jangan mengekspor data atau fungsi bersama dari `page.tsx`.** Taruh di `features/<fitur>/` atau `lib/` (bagian 4). Mengimpor dari file halaman pernah membuat rantai error saat halamannya diubah.
6. **Gambar dari URL database** ditampilkan lewat `components/GambarEvent.tsx`. Komponen ini menangani nilai kosong dan memakai `unoptimized` karena admin bisa menempel link dari domain mana pun. Prop `priority` sudah usang di Next.js 16; gunakan `preload`. Link berbagi Google Drive bukan URL gambar langsung dan tidak akan tampil.
7. **`params` dan `searchParams` berupa Promise** dan harus di-`await`.
8. Peringatan `middleware` deprecated: pemindahan ke `proxy.ts` dikerjakan di PR tersendiri. Jangan dicampur dengan perubahan lain.
9. **Jangan membuat seluruh halaman menunggu jika hanya sebagian isinya yang butuh data runtime.** Beranda pernah gagal build karena `await connection()`, query database, dan `await auth()` ditulis di level `Home()`, padahal hampir seluruh isinya teks statis. Pindahkan pengambilan data ke komponen anak `async`, lalu bungkus komponen itu dengan `<Suspense>` di halaman. Contohnya `app/page.tsx` dengan `components/event-slider/EventSliderServer.tsx`. `export const instant = false` membuat seluruh halaman kosong sampai datanya siap.
10. **Fallback `<Suspense>` harus setinggi isi aslinya.** Fallback `null` atau yang lebih pendek membuat konten di bawahnya terdorong saat isi asli muncul. Header pernah "berkedip" karena ini. Polanya: buat komponen kerangka tanpa data runtime dengan ukuran yang sama (`HeaderKerangka`, `EventSliderKerangka`). Pembungkus yang punya `<Suspense>` sendiri, seperti `HideOnAdmin`, juga diberi kerangka lewat prop `fallback`. Cara mengecek:
    - **View Page Source** (Ctrl+U): kerangka harus sudah ada di HTML awal, sebelum `<main>`.
    - Rekam layar dengan throttling jaringan (DevTools → Network → Regular 4G, centang _Disable Cache_), lalu periksa apakah ada bagian yang bergeser.
11. **Gambar di bagian atas halaman tidak boleh mengubah tata letak saat dimuat.** Isi `width` dan `height` dengan ukuran **asli** file (prop ini menentukan rasio, bukan ukuran tampil), lalu kunci ukuran tampilnya dengan CSS di satu sisi (`w-8 h-auto`). Jangan memakai `w-auto h-auto` bersama `width`/`height` yang rasionya salah. Gambar kecil yang selalu terlihat (logo) memakai `loading="eager"`. Gambar terbesar di layar pertama (hero, elemen LCP) memakai `preload`. Keduanya tidak dipakai bersamaan.
12. **Error yang menyebut file di dalam `.next/`** (misalnya `.next/dev/types/validator.ts … Cannot find module '../../../app/toko/page.js'`) biasanya berasal dari cache lama setelah folder di `app/` diganti nama atau dihapus. Hentikan `pnpm dev`, hapus folder `.next` (`rm -rf .next`, folder ini dibuat ulang otomatis), lalu jalankan `pnpm build` lagi. Ingat, Linux dan Vercel membedakan huruf besar dan kecil pada nama folder (`Store` ≠ `store`).

## 9. Standar kode

### 9.1 Umum

- TypeScript untuk semua kode. Hindari `any`, dan jangan menambah `as` atau `// @ts-ignore` hanya supaya garis merah hilang.
- Letak setiap file mengikuti bagian 4. **Cek dulu `lib/`, `components/`, `hooks/`, dan `features/` sebelum menulis fungsi baru**:

  | Kebutuhan                          | Pakai                                                                                     |
  | ---------------------------------- | ----------------------------------------------------------------------------------------- |
  | Format tanggal, jam, rentang waktu | `formatTanggal`, `formatJam`, `formatWaktu` di `lib/format-tanggal.ts`                    |
  | Tanggal hari ini (zona Jakarta)    | `tanggalHariIniJakarta()` di `lib/format-tanggal.ts`                                      |
  | Syarat "langganan aktif" di query  | `kondisiLanggananAktif()` di `lib/langganan.ts`, dipanggil dengan kurung (lihat di bawah) |
  | Label keadaan langganan            | `keadaanLangganan()` di `lib/langganan.ts`                                                |
  | Validasi profil dan kelengkapannya | `lib/validasi-profil.ts`                                                                  |
  | Cek login                          | `requireLogin()` di `lib/require-login.ts`                                                |
  | Cek admin                          | `requireAdmin()` di `lib/require-admin.ts`                                                |
  | Aturan sesi idle                   | `hitungIdle()` di `lib/session.ts`                                                        |
  | Midtrans Snap                      | `getMidtransSnap()` di `lib/midtrans.ts`                                                  |
  | URL dan penghapusan file ImageKit  | `lib/imagekit.ts`                                                                         |
  | Gambar event dari URL              | `components/GambarEvent.tsx`                                                              |
  | Gambar produk                      | `GambarProduk` di `components/GambarProduk.tsx`                                           |
  | Menu header dengan penanda aktif   | `components/header/NavLink.tsx` dan kelas `navKelas`                                      |
  | Menyembunyikan bagian di `/admin`  | `components/HideOnAdmin.tsx` (beri prop `fallback` jika perlu)                            |

- **Cek langganan aktif hanya lewat fungsi di `lib/langganan.ts`.** Jangan menulis `eq(statusLangganan, "aktif")` atau `Intl.DateTimeFormat` sendiri. Pengecekan "aktif" pernah ditulis ulang di 13 tempat dengan 5 cara berbeda, dan hasilnya tidak sama. Fungsi kondisi dipanggil dengan kurung: `.where(kondisiLanggananAktif())`, bukan `.where(kondisiLanggananAktif)`.
- Komponen berjalan di server secara default. Tambahkan `"use client"` hanya jika butuh interaktivitas (state, event klik).
- Validasi semua input dari form di sisi server, bukan hanya di tampilan.
- Jangan menaruh logika harga, stok, atau pembayaran di sisi klien. Hitung dan periksa di server.
- Jalankan `pnpm lint` dan perbaiki peringatan sebelum commit.
- Format kode diatur Prettier (`.prettierrc`). Pengaturan proyek di `.vscode/` sudah menyalakan _Format on Save_. Jangan mengubah `.prettierrc` tanpa kesepakatan tim.
- Jangan meninggalkan `console.log` untuk debugging, placeholder seperti `"…"`, atau kode yang dikomentari saat commit. Git sudah menyimpan riwayatnya.

### 9.2 Data dari database

- **Pakai tipe dari skema, jangan menulis interface tiruan.** Hasil query Drizzle sudah bertipe. Jika butuh tipenya, pakai `typeof namaTabel.$inferSelect`. Interface tulisan tangan pernah tidak cocok dengan database (nama snake_case, kolom yang tidak ada).
- **Tipe vs nilai:** `typeof events.$inferSelect` adalah keterangan bentuk, bukan data. Variabel yang langsung diisi dari query (`const [event] = await …`) tidak perlu anotasi tipe. Anotasi diperlukan untuk variabel yang dibuat kosong dulu (`let events: … = []`) dan untuk props komponen.
- **Hasil query selalu array.** Ambil satu baris dengan `const [baris] = await …limit(1)`, lalu cek `if (!baris)`.
- **Kolom yang boleh kosong bernilai `null`, bukan tidak ada.** Beri teks pengganti yang jujur (`event.lokasi || "Lokasi menyusul"`), jangan menebak data. Untuk kolom angka, `0` juga falsy; cek `=== null` jika `0` bermakna.
- **Kolom `numeric` (misalnya `biayaEvent`) dikembalikan sebagai string.** Ubah dengan `Number(...)` sebelum dibandingkan.
- **Bentuk nilai berbeda menurut tipe kolom:**

  | Tipe kolom di skema                | Nilai dari Drizzle                 | Cara memformat                                                 |
  | ---------------------------------- | ---------------------------------- | -------------------------------------------------------------- |
  | `date` (misalnya `tanggalLahir`)   | string `"YYYY-MM-DD"`              | `formatTanggal(...)` dari `lib/format-tanggal.ts`              |
  | `time` (misalnya `waktuMulai`)     | string `"HH:MM:SS"`                | `formatJam(...)` atau `formatWaktu(...)`                       |
  | `timestamp` (misalnya `createdAt`) | objek `Date` (titik waktu lengkap) | `toLocaleDateString("id-ID", { …, timeZone: "Asia/Jakarta" })` |

  `formatTanggal` sengaja memakai UTC untuk kolom `date`, supaya tanggal tidak bergeser satu hari antara laptop (WIB) dan Vercel (UTC). Jangan mengirim hasil `toISOString()` dari kolom `timestamp` ke `formatTanggal`, karena hasilnya "Invalid Date". Kolom `timestamp` justru perlu zona waktu Indonesia, karena akun yang dibuat pukul 06.00 WIB masih bertanggal sehari sebelumnya di UTC.

- **Kolom `date` yang boleh kosong ditangani di tempat pemanggilan**: `user.tanggalLahir ? formatTanggal(user.tanggalLahir) : "-"`. Jangan memakai `toString()` atau `String(...)` untuk menghilangkan garis merah, karena `null` akan menjadi teks `"null"` dan tampil sebagai "Invalid Date".
- **Tanggal hari ini** diambil dengan `tanggalHariIniJakarta()`. Di SQL pakai `(now() AT TIME ZONE 'Asia/Jakarta')::date`, bukan `CURRENT_DATE`, karena server database memakai UTC.
- **Kolom `date` dibandingkan sebagai teks `"YYYY-MM-DD"`** dengan tanggal hari ini di atas. Jangan `new Date("YYYY-MM-DD")` lalu dibandingkan dengan `new Date()`: hasilnya pukul 07.00 WIB, sehingga hari terakhir langganan dianggap sudah lewat sejak pagi. Bug ini pernah membuat status langganan di profil salah.
- **Pakai fungsi Drizzle** (`eq`, `gte`, `and`, `or`, `ilike`) daripada `` sql`…` ``. Tulis `` sql`…` `` hanya untuk yang tidak bisa dibuat dengan fungsi. Gabungkan syarat opsional dalam array `(SQL | undefined)[]` lalu `and(...syarat)`, supaya kurung AND/OR selalu benar. Filter admin pernah bocor karena `A OR B AND C`.
- **Begitu data ada di database, hapus data contoh.** Jangan mencampur nilai dari database dengan nilai tulisan tangan (pernah: nama event dari database, tetapi gambar dan lokasi dari data contoh). Teks yang bergantung pada data, seperti "Gratis", dibaca dari kolomnya (`biayaEvent`), bukan ditulis tetap.
- **Nama kunci JSON di API mengikuti nama kolom di skema** (misalnya `namaPelanggan`). Hasil `fetch()` di komponen klien tidak bertipe, jadi TypeScript tidak akan memberi tahu jika nama di API dan di halaman berbeda. Ubah API dan halaman pemakainya dalam PR yang sama, lalu buka halamannya di browser.

### 9.3 Validasi ID dan logika boolean

- **ID dari URL atau form divalidasi ketat:** `const id = Number(teks)`, lalu tolak jika tidak `Number.isInteger(id) && id > 0`. Jangan memakai `parseInt` (`parseInt("3abc")` menghasilkan 3), dan **jangan pernah** memakai cadangan `|| 1`. ID tidak valid atau tidak ditemukan berarti `notFound()` di halaman, 400 atau 404 di API. ID `NaN` yang lolos ke Postgres menjadi error 500.
- **Saat menulis syarat penolakan, tulis dulu syarat "valid", lalu bungkus dengan `!( … )`:**
  ```ts
  if (!(Number.isInteger(id) && id > 0)) return …;
  ```
  Membalik setiap bagian secara manual (aturan De Morgan: `&&` menjadi `||`, `>` menjadi `<=`) sudah beberapa kali menghasilkan syarat terbalik yang menolak semua pengguna sah atau meloloskan yang tidak sah.
- **`|` dalam nilai adalah operasi bit, bukan "atau".** `{ error: 401 | 403 }` menghasilkan angka `403`. Tanda `|` sebagai "salah satu dari" hanya berlaku di tipe.
- **Tulis tipe kembalian untuk fungsi bantu** (`function formatWaktu(…): string`). TypeScript akan menandai jalur yang lupa `return`.
- **Pesan error bawaan (`?? "…"`) tidak boleh dihapus** walaupun jarang terpakai. Isinya sebaiknya umum ("Terjadi kesalahan. Silakan coba lagi."), karena kode error yang tidak dikenal biasanya berarti masalah server.
- **Parameter query opsional** (misalnya `?page=`): kosong berarti memakai nilai bawaan; diisi tetapi tidak valid berarti 400 dengan pola validasi di atas. `notFound()` hanya untuk halaman, bukan untuk route API.

### 9.4 Halaman error dan pesan hasil aksi

- Folder yang halamannya membaca database sebaiknya punya `error.tsx` (wajib `"use client"`) supaya kegagalan server menampilkan pesan yang ramah. `error.tsx` berlaku untuk semua halaman di bawah foldernya.
- **Pesan hasil Server Action** (misalnya `?status=…` di URL) ditampilkan di halaman yang memang bisa dibuka pengguna dalam keadaan itu. Jangan mengalihkan ke halaman yang langsung mengalihkan lagi, karena pesannya tidak akan pernah terlihat. Contoh: pesan "langganan tidak aktif" pernah dikirim ke halaman jadwal janjian, padahal halaman itu langsung mengalihkan pelanggan yang tidak aktif ke `/langganan`.

### 9.5 Respons API adalah kontrak

Kode status dan bentuk JSON sebuah route API dipakai oleh **semua** pemanggilnya, bukan hanya oleh halaman yang sedang kamu kerjakan. Kejadian nyata: `/api/auth/me` diubah supaya mengembalikan 200 untuk pengunjung yang belum login. `SessionIdleTimeout` memakai `response.ok` sebagai tanda "sudah login", sehingga browser me-refresh halaman terus-menerus.

- Sebelum mengubah kode status, nama kunci JSON, atau bentuk respons, cari semua pemanggilnya (Ctrl+Shift+F nama route, misalnya `/api/auth/me`). Sebutkan daftar pemanggil itu di deskripsi PR, lalu uji setiap pemanggil di browser.
- Pakai kode status sesuai maknanya: 200 berhasil, 400 input tidak valid, 401 belum login atau sesi idle, 403 sudah login tetapi tidak berhak, 404 tidak ditemukan, 409 bentrok dengan data lain, 500 kegagalan server. Jangan mengembalikan 200 berisi `{ error: … }`.
- Jika memang perlu mengubah kontrak, ubah route dan semua pemanggilnya dalam PR yang sama.

### 9.6 Pengambilan data di komponen klien

Kode baru mengambil data di Server Component (bagian 4.2). Halaman lama yang masih mengambil data dengan `fetch` di komponen klien (misalnya halaman admin) wajib membedakan empat keadaan: **memuat, gagal, kosong, ada data**.

- Request yang dibatalkan (`AbortController`) bukan kegagalan.
- Status gagal di-reset setiap kali pengambilan baru dimulai.
- Pesan "kosong" tidak tampil selama masih memuat. Bedakan juga "tidak ada yang cocok" (ada pencarian) dengan "belum ada data".
- Selalu pakai `{ }` pada `if`. `if` tanpa kurung kurawal di `catch` pernah membuat pesan "Gagal memuat data pengguna" ikut tampil saat request hanya dibatalkan.

### 9.7 Logika langganan

- **Arti kolom:** `status_langganan` adalah izin (`tidak_aktif`, `aktif`, `dihentikan`). `tanggal_akhir_langganan` adalah masa berlaku. Keadaan (aktif, berakhir, dan seterusnya) selalu **dihitung** dengan `keadaanLangganan()`, tidak disimpan, dan tidak butuh program berkala untuk mengubah status. API mengirim `keadaan` ke tampilan, bukan status mentah.
- **Durasi:** 1 pembayaran = 30 hari, dengan hari bayar sebagai hari pertama dan tanggal akhir masih aktif. Membayar pada atau sebelum tanggal akhir berarti perpanjangan (tanggal mulai tetap, tanggal akhir + 30). Selain itu dihitung sebagai langganan baru: tanggal akhir = (hari bayar − 1) + 30.
- **Siapa yang boleh berlangganan:** hanya akun `user`. Admin dan pelanggan berstatus `dihentikan` ditolak di Server Action pembayaran. Route notifikasi Midtrans tidak boleh menimpa status `dihentikan` menjadi `aktif`.
- **Harga dan jumlah bayar selalu diambil dari database di server** (harga final hasil review admin), tidak pernah dari form atau props klien.
- **Alur pengajuan langganan** (sedang dibangun): tombol bayar hanya untuk pengajuan yang sudah disepakati pelanggan dan diaktifkan admin. Syarat ini dicek di Server Action, bukan hanya di tampilan. Status pengajuan hanya berubah lewat satu `UPDATE … WHERE status IN (…)` yang menyebut status asal yang diizinkan (bagian 6.2).

## 10. Daftar periksa sebelum membuka PR

- [ ] Branch sudah diperbarui dari `development` terbaru (bagian 3.2).
- [ ] Tidak ada sisa penanda konflik, blok ganda, `console.log`, atau placeholder.
- [ ] `pnpm lint` dan `pnpm build` berhasil di laptop.
- [ ] File baru diletakkan sesuai bagian 4, tidak ada file kode yang melebihi 300 baris (`pnpm lint` tanpa error `max-lines`), dan file lama yang sudah melebihi batas tidak bertambah panjang.
- [ ] Fitur sudah dicoba di browser dengan `pnpm dev`, termasuk keadaan kosong, gagal, dan ID yang tidak valid. Data uji mencakup kasus batas (bagian 6.5).
- [ ] Setiap Server Action memanggil `requireLogin()` (pengguna) atau `requireAdmin()` (admin) di awal, dan setiap route `/api/admin/*` memanggil `requireAdmin()`.
- [ ] Setiap syarat penolakan sudah ditelusuri dengan pengguna yang sah (sesi aktif, ID valid) dan pengguna yang sah lolos. Bug syarat terbalik (`!` atau De Morgan) tidak selalu ketahuan lewat pengujian biasa.
- [ ] Tidak ada `idUser` yang dibaca dari form atau URL.
- [ ] Jika mengubah skema: file migrasi ikut di-commit, kolom yang berubah disebut di deskripsi PR, dan tim diingatkan menjalankan `pnpm db:migrate`.
- [ ] Jika mengubah file milik anggota lain: pemiliknya sudah dikabari dan perubahannya disebut di deskripsi PR.
- [ ] Jika mengubah kode status atau bentuk respons route API: semua pemanggilnya sudah dicari dan diuji (bagian 9.5).
- [ ] Untuk perubahan tampilan yang memakai `<Suspense>`: tidak ada konten yang terdorong saat halaman pertama kali dimuat (bagian 8 no. 10).
- [ ] Jika memakai AI agent: seluruh perubahannya sudah diperiksa dengan langkah di bagian 11.2.
- [ ] Setelah PR dibuka, pemeriksaan **Lint** di PR berwarna hijau (bagian 3.6).
- [ ] Tidak ada nilai rahasia di kode atau di screenshot.

## 11. Menggunakan AI agent

### 11.1 Kewajiban anggota tim yang memakai agent

AI agent boleh dipakai membantu, dengan syarat:

- **Kamu yang bertanggung jawab atas setiap baris yang kamu commit**, siapa pun yang menulisnya. "Itu dari agent" bukan alasan di review.
- Hasil agent selalu diperiksa dengan langkah di bagian 11.2 **sebelum** commit. Jangan commit kode yang tidak kamu pahami. Minta agent menjelaskannya, atau tanyakan ke tim.
- Agent tidak diizinkan melakukan commit, push, merge, atau menghapus branch sendiri. Perintah Git yang mengubah riwayat dijalankan oleh kamu setelah memeriksa.
- `pnpm lint` dan `pnpm build` dijalankan di laptopmu sendiri, dan fiturnya dicoba di browser. Jangan hanya percaya laporan agent bahwa "semua sudah berjalan".
- Tidak ada rahasia (connection string, password, kunci API, isi `.env.local`) yang ditempel ke percakapan dengan agent. Jika terlanjur, ikuti langkah di bagian 5.
- Beri agent tugas yang kecil dan jelas (satu kode tugas, satu fitur, atau satu perbaikan), dan sebutkan file atau folder yang boleh diubah. Tugas yang terlalu luas ("rapikan semua", "perbaiki semua error") menghasilkan perubahan besar yang sulit diperiksa.
- **Buka setiap tugas baru dengan prompt pembuka ini**, supaya agent benar-benar membaca aturannya:

  ```text
  Sebelum mengerjakan apa pun, baca CONTRIBUTING.md dan AGENTS.md di root repo ini sampai habis. Lalu sebutkan nomor bagian aturan yang berlaku untuk tugas berikut, letak setiap file baru menurut peta folder di bagian 4, dan daftar file yang akan kamu ubah. Jangan menulis kode sampai saya membalas "lanjut". Tugasnya: [tulis tugasnya di sini]
  ```

  Jika jawabannya tidak menyebut aturan yang jelas relevan (misalnya untuk Server Action tidak menyebut cek sesi), atau menaruh file di luar peta folder, berarti agent belum membaca dengan benar. Ulangi sebelum lanjut.

- **Pengguna Claude Code:** Claude Code membaca `CLAUDE.md`, bukan `AGENTS.md`. File `CLAUDE.md` di root repo ini memuat `AGENTS.md` lewat baris `@AGENTS.md`, jadi jangan dihapus. Alat lain membaca `AGENTS.md` atau perlu diberi prompt pembuka di atas.

### 11.2 Cara memeriksa perubahan dari agent sebelum commit

1. **`git status`**: lihat daftar file yang berubah, termasuk file baru (_untracked_), file yang dihapus, dan file yang dipindah. Setiap file harus bisa kamu jelaskan alasan perubahannya. File yang tidak berhubungan dengan tugasmu dikembalikan dengan `git restore <file>` (file baru yang tidak diminta cukup dihapus). Waspadai terutama: `package.json`, `pnpm-lock.yaml`, `auth.config.ts`, `lib/auth.ts`, `middleware.ts`, `app/layout.tsx`, `lib/db/schema.ts`, folder `drizzle/`, `.env*`, `eslint.config.mjs`, dan file milik anggota lain (bagian 4.3).
2. **`git diff`** (atau tab Source Control di VS Code): baca setiap baris yang berubah. Yang perlu dicari:
   - tanda kode "asal jalan" (daftar di 11.3 no. 6);
   - file baru di luar peta folder bagian 4, atau file yang melewati 300 baris;
   - pengecekan `requireLogin()` atau `requireAdmin()` yang hilang atau dipindah ke bawah;
   - syarat yang dibalik (`!`, `&&` menjadi `||`, bagian 9.3);
   - perubahan kode status atau bentuk respons API (bagian 9.5);
   - kode lama yang dikomentari, `console.log`, dan data contoh;
   - file yang diformat ulang seluruhnya padahal yang perlu berubah hanya beberapa baris.
3. **Jalankan dan coba sendiri**: `pnpm lint`, `pnpm build`, lalu buka halamannya di browser. Coba juga keadaan gagal: belum login, sesi idle, akun bukan admin, ID salah di URL, dan data kosong. Untuk tampilan, cek juga di lebar layar HP.
4. **Stage per file**: `git add <file>` untuk file yang sudah kamu periksa. Pakai `git add -p` untuk memilih bagian tertentu saja. Hindari `git add .`, karena perintah itu ikut memasukkan file yang tidak sengaja dibuat.
5. **Commit dengan pesanmu sendiri** yang menjelaskan apa yang berubah (bagian 3.1).

Reviewer PR memeriksa hal yang sama di setiap PR, karena deskripsi PR tidak lagi mencantumkan bagian mana yang dibantu agent.

### 11.3 Aturan untuk agent

Agent yang bekerja di repo ini wajib:

1. Membaca dokumen ini dan `AGENTS.md` sebelum menulis kode, dan membaca dokumentasi Next.js 16 di `node_modules/next/dist/docs/` untuk API yang dipakai.
2. Mengikuti bagian 7 untuk semua kode yang menyentuh sesi, peran, Server Action, atau `app/api/`.
3. Memakai fungsi yang sudah ada di `lib/`, `components/`, `hooks/`, dan `features/` (tabel di bagian 9.1) sebelum membuat yang baru.
4. **Meletakkan setiap file sesuai peta folder di bagian 4.1** dan mengikuti aturan di bagian 4.2: `page.tsx` tipis, query di `features/<fitur>/queries/`, Server Action di `features/<fitur>/actions/`, `"use client"` hanya untuk komponen kecil yang interaktif. Tidak membuat folder tingkat atas baru, atau folder seperti `utils/`, `helpers/`, dan `services/` di luar peta, tanpa persetujuan pengguna.
5. **Menjaga setiap file kode maksimal 300 baris** (bagian 4.2 no. 9). Jika perubahan akan membuat file melewati batas, pecah dulu sesuai struktur. Tidak menambah panjang file lama yang sudah melebihi batas. Setelah mengubah file, menjalankan `pnpm lint` dan memastikan tidak ada error `max-lines`.
6. **Tidak membuat kode "asal jalan".** Jangan menghilangkan error dengan cara yang menyembunyikan masalah:
   - menambah `any`, `as`, `// @ts-ignore`, atau mematikan aturan lint;
   - menaikkan batas `max-lines`, menambah file ke daftar pengecualiannya, atau menambah `eslint-disable` untuk aturan itu;
   - menambah data contoh atau nilai cadangan palsu (`|| 1`, `DEFAULT_...`) saat data tidak ditemukan;
   - menelan error dengan `catch {}` kosong;
   - menghapus pengecekan sesi, peran, atau validasi;
   - memasang `export const instant = false` atau menghapus `<Suspense>` hanya supaya build lolos (bagian 8);
   - menulis ulang file milik anggota lain secara besar-besaran.
7. Tidak mengubah versi library yang dikunci (Next.js, Auth.js, Drizzle) dan tidak menambah dependensi tanpa persetujuan pengguna.
8. Tidak mengedit migrasi yang sudah ada, dan tidak memakai `drizzle-kit push`.
9. Menjaga perubahan tetap kecil dan sesuai permintaan. Jika menemukan masalah lain di luar tugas, laporkan ke pengguna, jangan ikut diubah diam-diam.
10. **Menyampaikan rencana sebelum mengubah file**: file mana yang akan diubah, letak setiap file baru menurut bagian 4.1, dan alasannya. Tunggu persetujuan pengguna jika perubahan:
    - menyentuh lebih dari tiga file;
    - menyentuh file milik anggota lain atau file sensitif (`auth.config.ts`, `lib/auth.ts`, `middleware.ts`, `app/layout.tsx`, `package.json`, `eslint.config.mjs`, skema dan migrasi database);
    - membuat folder baru, atau memindahkan, mengganti nama, atau menghapus file atau folder (bagian 4.4);
    - mengubah kode status atau bentuk respons route API (bagian 9.5).
11. **Tidak menjalankan perintah Git yang mengubah riwayat atau repo jarak jauh** (`git commit`, `git push`, `git merge`, `git rebase`, `git reset --hard`, `git push --force`, menghapus branch) dan tidak memakai `git add .`, kecuali pengguna memintanya secara eksplisit untuk perintah itu.
12. Tidak memformat ulang seluruh file atau mengganti gaya penulisan kode yang tidak berhubungan dengan tugas, supaya diff tetap mudah diperiksa.
13. Memperbaiki error dengan memahami penyebabnya terlebih dahulu, lalu menjelaskan penyebab itu ke pengguna. Jangan mencoba-coba perubahan acak sampai error hilang.
14. Bertanya dulu jika maksud pengguna kurang jelas atau ada beberapa cara yang sama-sama masuk akal.
15. Setelah selesai, melaporkan:
    - daftar file yang diubah, dibuat, dipindah, atau dihapus, beserta alasan masing-masing;
    - jumlah baris setiap file kode yang diubah atau dibuat;
    - cara menguji perubahannya, termasuk keadaan gagal;
    - hal yang **belum** diuji atau masih diragukan;
    - pengingat bahwa pengguna perlu memeriksa perubahan dengan langkah di bagian 11.2 sebelum commit.
