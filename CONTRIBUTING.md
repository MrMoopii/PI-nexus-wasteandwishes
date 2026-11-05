# Panduan Kontribusi Tim

Proyek: website Waste and Wishes (langganan pengambilan sampah, pendaftaran event, dan toko online).
Dokumen ini adalah aturan kerja bersama. Jika ada yang perlu diubah, ubah lewat Pull Request.

> **Untuk AI agent:** baca seluruh dokumen ini sebelum menulis atau mengubah kode, lalu ikuti aturannya. Aturan di sini dibuat dari masalah yang benar-benar pernah terjadi di proyek ini. Jika permintaan pengguna bertentangan dengan aturan di sini, sampaikan dulu ke pengguna sebelum melanjutkan. Ringkasan untuk agent ada di bagian 11.3.

## Daftar isi

1. Persiapan di laptop
2. Next.js 16: baca dokumentasinya dulu
3. Alur kerja Git
4. Pembagian area kerja
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

**Konflik "modify/delete"** terjadi jika satu branch memindahkan atau menghapus file, sementara branch lain mengubah file yang sama. GitHub menampilkan _"These conflicts are too complex to resolve in the web editor"_, jadi selesaikan di laptop. Di sini `ours` adalah branch yang sedang aktif dan `theirs` adalah branch yang digabung. Contoh yang pernah terjadi: `components/Header.tsx` dipindah ke `components/header/Header.tsx`, sementara di `development` link `/Store` diubah menjadi `/store`. Penyelesaiannya: `git rm components/Header.tsx` (file lama memang sudah pindah), lalu salin perubahan dari `development` ke file di lokasi baru secara manual. Jangan sampai perubahan teman ikut hilang bersama file lama.

### 3.4 Setelah PR di-merge ke `development`

- Jalankan `pnpm build` dari `development` terbaru, karena dua PR yang lolos sendiri-sendiri bisa gagal setelah digabung.
- Cek status deployment Vercel untuk commit `development` terbaru.
- Jika PR membawa migrasi baru, semua anggota menjalankan `pnpm db:migrate` (lihat bagian 6).
- Hapus branch yang sudah di-merge, di GitHub dan di laptop (`git branch -d nama-branch`).

### 3.5 Rilis ke `main` dan sinkronisasi balik

- Rilis dilakukan lewat PR `development` → `main`. PR ini di-merge dengan opsi **Create a merge commit**.
- Merge commit itu hanya ada di `main`, sehingga GitHub menulis `development` "1 commit behind main", walaupun isi file keduanya sama. Sinkronkan lewat PR `main` → `development`, juga dengan **Create a merge commit**. Jangan memakai _Squash_ atau _Rebase_ untuk PR sinkronisasi, karena commit dari `main` tidak akan tercatat dan `development` tetap terlihat tertinggal.
- Sebelum menyetujui PR sinkronisasi, cek tab **Files changed**. Jika isinya 0 file, PR itu aman. Jika ada file yang berubah, berarti ada yang langsung masuk ke `main` tanpa lewat `development`, dan itu perlu ditanyakan dulu.

## 4. Pembagian area kerja

Pembagian folder mengurangi konflik saat merge. Pembagian ini awal dan bisa disesuaikan tim.

| Tim                 | Anggota | Area utama                                                                                         |
| ------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| Tampilan (frontend) | 2 orang | `components/`, halaman publik di `app/`, styling (Tailwind), `public/`                             |
| Backend             | 3 orang | `app/api/`, `lib/`, skema database dan migrasi (`lib/db/` dan `drizzle/`), autentikasi, pembayaran |

Aturan:

- Jangan mengedit file milik area lain tanpa memberi tahu pemiliknya, terutama `app/layout.tsx`, `package.json`, `auth.config.ts`, `lib/auth.ts`, dan skema database.
- Jika butuh perubahan di area lain, buat issue di GitHub atau kabari lewat grup tim, lalu sepakati siapa yang mengerjakan.
- Jika dua orang perlu mengubah file yang sama (misalnya halaman event), sepakati urutan merge-nya dulu. Yang kedua memperbarui branch dari `development` setelah PR pertama masuk.

**Struktur folder `components/`.** Komponen yang bekerja sama untuk satu bagian tampilan dikelompokkan dalam satu folder per fitur:

| Folder                     | Isi                                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/header/`       | `Header` (server, membaca sesi), `HeaderBingkai` (tampilan bersama), `HeaderKerangka` (fallback), `NavLink` (klien, penanda menu aktif), `ProfileDropdown` |
| `components/event-slider/` | `EventSliderServer` (server, membaca database dan sesi), `EventSlider` (klien, animasi), `EventSliderKerangka` (fallback)                                  |

**Memindahkan atau mengganti nama file dan folder** (termasuk folder route di `app/`) dikerjakan di PR tersendiri, diumumkan ke tim lebih dulu, dan dilakukan saat tidak ada yang sedang mengedit file tersebut. Branch lain yang masih mengedit file di lokasi lama akan mengalami konflik "modify/delete" (bagian 3.3).

## 5. Variabel lingkungan, rahasia, dan Vercel

- Nama semua variabel terdaftar di `.env.example`. Nilai asli hanya di `.env.local` (tidak ikut Git, jangan pernah di-commit).
- Jika menambah variabel baru, tambahkan namanya (tanpa nilai) ke `.env.example` pada PR yang sama.
- Connection string database, kunci pembayaran, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, dan `AUTH_GOOGLE_SECRET` adalah rahasia. Bagikan lewat pesan privat, jangan lewat GitHub, grup publik, atau screenshot.
- Untuk pembayaran, pakai kunci **sandbox** selama pengembangan. Kunci produksi hanya dipasang di pengaturan hosting.

**`.env.local` tidak pernah sampai ke Vercel.** Mengisi `.env.local` hanya berlaku di laptopmu. Vercel membaca variabel dari **Project Settings → Environment Variables**, diisi terpisah untuk Preview dan Production:

| Variabel             | Dipakai oleh                  | Perlu di Vercel                         |
| -------------------- | ----------------------------- | --------------------------------------- |
| `DATABASE_URL`       | aplikasi (`lib/db/index.ts`)  | ya                                      |
| `DIRECT_URL`         | migrasi (`drizzle.config.ts`) | hanya jika migrasi dijalankan di Vercel |
| `AUTH_SECRET`        | Auth.js                       | ya                                      |
| `AUTH_GOOGLE_ID`     | login Google                  | ya                                      |
| `AUTH_GOOGLE_SECRET` | login Google                  | ya                                      |

Setelah mengubah variabel di Vercel, lakukan **Redeploy**. Build lama tidak ikut membaca variabel baru. Preview sebaiknya memakai branch Neon terpisah yang hanya berisi data uji.

Untuk login Google di Vercel, daftarkan `https://<domain-vercel>/api/auth/callback/google` sebagai Authorized redirect URI di Google Cloud Console. Selama aplikasi OAuth berstatus Testing, daftarkan email semua anggota tim sebagai test user.

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
- Driver `neon-http` tidak mendukung transaksi interaktif. Sebelum membangun fitur yang butuh transaksi (stok toko, kuota event), diskusikan dulu driver yang dipakai.

### 6.3 Alur mengubah struktur tabel

1. `git pull`, lalu terapkan migrasi baru dari rekan: `pnpm db:migrate`.
2. Ubah `lib/db/schema.ts`.
3. `pnpm db:generate` untuk membuat file migrasi, lalu baca isi file SQL-nya.
4. `pnpm db:migrate` untuk menerapkannya ke branch Neon pribadi.
5. Commit `lib/db/schema.ts` dan folder `drizzle/` dalam PR yang sama.
6. Di deskripsi PR, sebutkan tabel dan kolom yang berubah, lalu ingatkan semua anggota menjalankan `pnpm db:migrate`. Database yang dipakai Preview Vercel juga harus dimigrasi. Jika tidak, query akan gagal karena kolomnya tidak ada.
7. Jika menambah kolom yang dipakai di form admin atau halaman lain, kabari pemilik halaman itu.

Larangan:

- Jangan memakai `drizzle-kit push` pada database bersama, karena `push` mengubah database tanpa meninggalkan file migrasi.
- Jangan mengedit atau menghapus file migrasi yang sudah di-merge. Kalau salah, buat migrasi baru, termasuk untuk mengganti nama kolom.
- Jangan mengisi data contoh ke database dari kode aplikasi (misalnya Server Action yang menyisipkan event contoh). Kolom ID kita bertipe `generatedAlwaysAsIdentity`, sehingga Postgres menolak ID yang ditentukan sendiri. Data uji diisi lewat SQL Editor Neon atau DBeaver di branch pribadimu.

### 6.4 Membuat akun admin untuk pengujian

Belum ada cara membuat admin dari aplikasi. Di branch Neon pribadimu, ubah `peran` satu akun menjadi `'admin'` lewat SQL Editor, lalu **logout dan login ulang** supaya token sesi membawa peran baru. Siapkan juga satu akun `user` biasa untuk menguji bahwa aksesnya ditolak.

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
5. **Jangan mengekspor data atau fungsi bersama dari `page.tsx`.** Taruh di `lib/`. Mengimpor dari file halaman pernah membuat rantai error saat halamannya diubah.
6. **Gambar dari URL database** ditampilkan lewat `components/GambarEvent.tsx`. Komponen ini menangani nilai kosong dan memakai `unoptimized` karena admin bisa menempel link dari domain mana pun. Prop `priority` sudah usang di Next.js 16; gunakan `preload`. Link berbagi Google Drive bukan URL gambar langsung dan tidak akan tampil.
7. **`params` dan `searchParams` berupa Promise** dan harus di-`await`.
8. Peringatan `middleware` deprecated: pemindahan ke `proxy.ts` dikerjakan di PR tersendiri. Jangan dicampur dengan perubahan lain.
9. **Jangan membuat seluruh halaman menunggu jika hanya sebagian isinya yang butuh data runtime.** Beranda pernah gagal build karena `await connection()`, query database, dan `await auth()` ditulis di level `Home()`, padahal hampir seluruh isinya teks statis. Pindahkan pengambilan data ke komponen anak `async`, lalu bungkus komponen itu dengan `<Suspense>` di halaman. Contohnya `app/page.tsx` dengan `components/event-slider/EventSliderServer.tsx`. `export const instant = false` membuat seluruh halaman kosong sampai datanya siap.
10. **Fallback `<Suspense>` harus setinggi isi aslinya.** Fallback `null` atau yang lebih pendek membuat konten di bawahnya terdorong saat isi asli muncul. Header pernah "berkedip" karena ini. Polanya: buat komponen kerangka tanpa data runtime dengan ukuran yang sama (`HeaderKerangka`, `EventSliderKerangka`). Pembungkus yang punya `<Suspense>` sendiri, seperti `HideOnAdmin`, juga diberi kerangka lewat prop `fallback`. Cara mengecek:
    - **View Page Source** (Ctrl+U): kerangka harus sudah ada di HTML awal, sebelum `<main>`.
    - Rekam layar dengan throttling jaringan (DevTools → Network → Regular 4G, centang _Disable Cache_), lalu periksa apakah ada bagian yang bergeser.
11. **Gambar di bagian atas halaman tidak boleh mengubah tata letak saat dimuat.** Isi `width` dan `height` dengan ukuran **asli** file (prop ini menentukan rasio, bukan ukuran tampil), lalu kunci ukuran tampilnya dengan CSS di satu sisi (`w-8 h-auto`). Jangan memakai `w-auto h-auto` bersama `width`/`height` yang rasionya salah. Gambar kecil yang selalu terlihat (logo) memakai `loading="eager"`. Gambar terbesar di layar pertama (hero, elemen LCP) memakai `preload`. Keduanya tidak dipakai bersamaan.
12. **Error yang menyebut file di dalam `.next/`** (misalnya `.next/dev/types/validator.ts … Cannot find module '../../../app/Store/page.js'`) biasanya berasal dari cache lama setelah folder di `app/` diganti nama atau dihapus. Hentikan `pnpm dev`, hapus folder `.next` (`rm -rf .next`, folder ini dibuat ulang otomatis), lalu jalankan `pnpm build` lagi. Ingat, Linux dan Vercel membedakan huruf besar dan kecil pada nama folder (`Store` ≠ `store`).

## 9. Standar kode

### 9.1 Umum

- TypeScript untuk semua kode. Hindari `any`, dan jangan menambah `as` atau `// @ts-ignore` hanya supaya garis merah hilang.
- Komponen yang dipakai ulang ditaruh di `components/`. Fungsi bantu ditaruh di `lib/`. **Cek dulu `lib/` dan `components/` sebelum menulis fungsi baru**:

  | Kebutuhan                          | Pakai                                                                  |
  | ---------------------------------- | ---------------------------------------------------------------------- |
  | Format tanggal, jam, rentang waktu | `formatTanggal`, `formatJam`, `formatWaktu` di `lib/format-tanggal.ts` |
  | Validasi profil dan kelengkapannya | `lib/validasi-profil.ts`                                               |
  | Cek login                          | `requireLogin()` di `lib/require-login.ts`                             |
  | Cek admin                          | `requireAdmin()` di `lib/require-admin.ts`                             |
  | Aturan sesi idle                   | `hitungIdle()` di `lib/session.ts`                                     |
  | Gambar event dari URL              | `components/GambarEvent.tsx`                                           |
  | Menu header dengan penanda aktif   | `components/header/NavLink.tsx` dan kelas `navKelas`                   |
  | Menyembunyikan bagian di `/admin`  | `components/HideOnAdmin.tsx` (beri prop `fallback` jika perlu)         |

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

### 9.4 Halaman error

Folder yang halamannya membaca database sebaiknya punya `error.tsx` (wajib `"use client"`) supaya kegagalan server menampilkan pesan yang ramah. `error.tsx` berlaku untuk semua halaman di bawah foldernya.

### 9.5 Respons API adalah kontrak

Kode status dan bentuk JSON sebuah route API dipakai oleh **semua** pemanggilnya, bukan hanya oleh halaman yang sedang kamu kerjakan. Kejadian nyata: `/api/auth/me` diubah supaya mengembalikan 200 untuk pengunjung yang belum login. `SessionIdleTimeout` memakai `response.ok` sebagai tanda "sudah login", sehingga browser me-refresh halaman terus-menerus.

- Sebelum mengubah kode status, nama kunci JSON, atau bentuk respons, cari semua pemanggilnya (Ctrl+Shift+F nama route, misalnya `/api/auth/me`). Sebutkan daftar pemanggil itu di deskripsi PR, lalu uji setiap pemanggil di browser.
- Pakai kode status sesuai maknanya: 200 berhasil, 400 input tidak valid, 401 belum login atau sesi idle, 403 sudah login tetapi tidak berhak, 404 tidak ditemukan, 409 bentrok dengan data lain, 500 kegagalan server. Jangan mengembalikan 200 berisi `{ error: … }`.
- Jika memang perlu mengubah kontrak, ubah route dan semua pemanggilnya dalam PR yang sama.

## 10. Daftar periksa sebelum membuka PR

- [ ] Branch sudah diperbarui dari `development` terbaru (bagian 3.2).
- [ ] Tidak ada sisa penanda konflik, blok ganda, `console.log`, atau placeholder.
- [ ] `pnpm lint` dan `pnpm build` berhasil di laptop.
- [ ] Fitur sudah dicoba di browser dengan `pnpm dev`, termasuk keadaan kosong, gagal, dan ID yang tidak valid.
- [ ] Setiap Server Action memanggil `requireLogin()` (pengguna) atau `requireAdmin()` (admin) di awal, dan setiap route `/api/admin/*` memanggil `requireAdmin()`.
- [ ] Setiap syarat penolakan sudah ditelusuri dengan pengguna yang sah (sesi aktif, ID valid) dan pengguna yang sah lolos. Bug syarat terbalik (`!` atau De Morgan) tidak selalu ketahuan lewat pengujian biasa.
- [ ] Tidak ada `idUser` yang dibaca dari form atau URL.
- [ ] Jika mengubah skema: file migrasi ikut di-commit, kolom yang berubah disebut di deskripsi PR, dan tim diingatkan menjalankan `pnpm db:migrate`.
- [ ] Jika mengubah file milik anggota lain: pemiliknya sudah dikabari dan perubahannya disebut di deskripsi PR.
- [ ] Jika mengubah kode status atau bentuk respons route API: semua pemanggilnya sudah dicari dan diuji (bagian 9.5).
- [ ] Untuk perubahan tampilan yang memakai `<Suspense>`: tidak ada konten yang terdorong saat halaman pertama kali dimuat (bagian 8 no. 10).
- [ ] Jika memakai AI agent: seluruh perubahannya sudah diperiksa dengan langkah di bagian 11.2, dan bagian yang dibantu agent disebut di deskripsi PR.
- [ ] Tidak ada nilai rahasia di kode atau di screenshot.

## 11. Menggunakan AI agent

### 11.1 Kewajiban anggota tim yang memakai agent

AI agent boleh dipakai membantu, dengan syarat:

- **Kamu yang bertanggung jawab atas setiap baris yang kamu commit**, siapa pun yang menulisnya. "Itu dari agent" bukan alasan di review.
- Hasil agent selalu diperiksa dengan langkah di bagian 11.2 **sebelum** commit. Jangan commit kode yang tidak kamu pahami. Minta agent menjelaskannya, atau tanyakan ke tim.
- Agent tidak diizinkan melakukan commit, push, merge, atau menghapus branch sendiri. Perintah Git yang mengubah riwayat dijalankan oleh kamu setelah memeriksa.
- `pnpm lint` dan `pnpm build` dijalankan di laptopmu sendiri, dan fiturnya dicoba di browser. Jangan hanya percaya laporan agent bahwa "semua sudah berjalan".
- Tidak ada rahasia (connection string, kunci API, isi `.env.local`) yang ditempel ke percakapan dengan agent.
- Beri agent tugas yang kecil dan jelas (satu fitur atau satu perbaikan), dan sebutkan file atau folder yang boleh diubah. Tugas yang terlalu luas ("rapikan semua", "perbaiki semua error") menghasilkan perubahan besar yang sulit diperiksa.
- Di deskripsi PR, sebutkan bagian yang dibuat atau diubah dengan bantuan agent, supaya reviewer membacanya lebih teliti.

### 11.2 Cara memeriksa perubahan dari agent sebelum commit

1. **`git status`**: lihat daftar file yang berubah, termasuk file baru (_untracked_), file yang dihapus, dan file yang dipindah. Setiap file harus bisa kamu jelaskan alasan perubahannya. File yang tidak berhubungan dengan tugasmu dikembalikan dengan `git restore <file>` (file baru yang tidak diminta cukup dihapus). Waspadai terutama: `package.json`, `pnpm-lock.yaml`, `auth.config.ts`, `lib/auth.ts`, `middleware.ts`, `app/layout.tsx`, `lib/db/schema.ts`, folder `drizzle/`, `.env*`, dan file milik area lain (bagian 4).
2. **`git diff`** (atau tab Source Control di VS Code): baca setiap baris yang berubah. Yang perlu dicari:
   - tanda kode "asal jalan" (daftar di 11.3 no. 4);
   - pengecekan `requireLogin()` atau `requireAdmin()` yang hilang atau dipindah ke bawah;
   - syarat yang dibalik (`!`, `&&` menjadi `||`, bagian 9.3);
   - perubahan kode status atau bentuk respons API (bagian 9.5);
   - kode lama yang dikomentari, `console.log`, dan data contoh;
   - file yang diformat ulang seluruhnya padahal yang perlu berubah hanya beberapa baris.
3. **Jalankan dan coba sendiri**: `pnpm lint`, `pnpm build`, lalu buka halamannya di browser. Coba juga keadaan gagal: belum login, sesi idle, akun bukan admin, ID salah di URL, dan data kosong. Untuk tampilan, cek juga di lebar layar HP.
4. **Stage per file**: `git add <file>` untuk file yang sudah kamu periksa. Pakai `git add -p` untuk memilih bagian tertentu saja. Hindari `git add .`, karena perintah itu ikut memasukkan file yang tidak sengaja dibuat.
5. **Commit dengan pesanmu sendiri** yang menjelaskan apa yang berubah (bagian 3.1).

Reviewer PR juga memeriksa hal yang sama, terutama pada bagian yang disebut dibantu agent.

### 11.3 Aturan untuk agent

Agent yang bekerja di repo ini wajib:

1. Membaca dokumen ini dan `AGENTS.md` sebelum menulis kode, dan membaca dokumentasi Next.js 16 di `node_modules/next/dist/docs/` untuk API yang dipakai.
2. Mengikuti bagian 7 untuk semua kode yang menyentuh sesi, peran, Server Action, atau `app/api/`.
3. Memakai fungsi yang sudah ada di `lib/` dan `components/` (tabel di bagian 9.1) sebelum membuat yang baru.
4. **Tidak membuat kode "asal jalan".** Jangan menghilangkan error dengan cara yang menyembunyikan masalah:
   - menambah `any`, `as`, `// @ts-ignore`, atau mematikan aturan lint;
   - menambah data contoh atau nilai cadangan palsu (`|| 1`, `DEFAULT_...`) saat data tidak ditemukan;
   - menelan error dengan `catch {}` kosong;
   - menghapus pengecekan sesi, peran, atau validasi;
   - memasang `export const instant = false` atau menghapus `<Suspense>` hanya supaya build lolos (bagian 8);
   - menulis ulang file milik area lain secara besar-besaran.
5. Tidak mengubah versi library yang dikunci (Next.js, Auth.js, Drizzle) dan tidak menambah dependensi tanpa persetujuan pengguna.
6. Tidak mengedit migrasi yang sudah ada, dan tidak memakai `drizzle-kit push`.
7. Menjaga perubahan tetap kecil dan sesuai permintaan. Jika menemukan masalah lain di luar tugas, laporkan ke pengguna, jangan ikut diubah diam-diam.
8. **Menyampaikan rencana sebelum mengubah file**: file mana yang akan diubah dan alasannya. Tunggu persetujuan pengguna jika perubahan:
   - menyentuh lebih dari tiga file;
   - menyentuh file milik area lain atau file sensitif (`auth.config.ts`, `lib/auth.ts`, `middleware.ts`, `app/layout.tsx`, `package.json`, skema dan migrasi database);
   - memindahkan, mengganti nama, atau menghapus file atau folder (bagian 4);
   - mengubah kode status atau bentuk respons route API (bagian 9.5).
9. **Tidak menjalankan perintah Git yang mengubah riwayat atau repo jarak jauh** (`git commit`, `git push`, `git merge`, `git rebase`, `git reset --hard`, `git push --force`, menghapus branch) dan tidak memakai `git add .`, kecuali pengguna memintanya secara eksplisit untuk perintah itu.
10. Tidak memformat ulang seluruh file atau mengganti gaya penulisan kode yang tidak berhubungan dengan tugas, supaya diff tetap mudah diperiksa.
11. Memperbaiki error dengan memahami penyebabnya terlebih dahulu, lalu menjelaskan penyebab itu ke pengguna. Jangan mencoba-coba perubahan acak sampai error hilang.
12. Bertanya dulu jika maksud pengguna kurang jelas atau ada beberapa cara yang sama-sama masuk akal.
13. Setelah selesai, melaporkan:
    - daftar file yang diubah, dibuat, dipindah, atau dihapus, beserta alasan masing-masing;
    - cara menguji perubahannya, termasuk keadaan gagal;
    - hal yang **belum** diuji atau masih diragukan;
    - pengingat bahwa pengguna perlu memeriksa perubahan dengan langkah di bagian 11.2 sebelum commit.
