# Skenario uji: event

Nomor `EVT-01` sampai `EVT-09` disediakan untuk skema tabel event (kode tugas 3.1). Skenario halaman dan aksi ditambahkan oleh kode tugas 3.2, 3.3, dan 3.10 di PR masing-masing.

Data uji diisi lewat SQL Editor Neon di branch `development` (`CONTRIBUTING.md` bagian 6.5).

## EVT-01: Constraint kolom event informatif

- **Kode tugas:** 3.1
- **Peran:** pemilik skema (SQL Editor Neon)
- **Persiapan data:** migrasi 3.1 sudah diterapkan dengan `pnpm db:migrate`. Skrip membuat event ujinya sendiri dengan tanggal hari ini (WIB), lalu membatalkan semuanya di akhir.
- **Langkah:**
  1. Buka SQL Editor Neon, pilih branch `development`.
  2. Tempel seluruh skrip di bawah, lalu jalankan sekali.
  3. Baca pesan di akhir.
  4. Jalankan `SELECT count(*) FROM events WHERE nama_event LIKE 'Uji 3.1 %';`.
- **Hasil yang diharapkan:**
  - Langkah 3: skrip berhenti dengan `ERROR: Uji skema 3.1 (event) selesai: 7 lolos, 0 gagal.` Pesan ini **sengaja berupa error** supaya semua data uji dibatalkan. Jika ada yang gagal, nama kasusnya tertulis di bawah ringkasan, beserta constraint yang menolaknya atau keterangan "isian salah diterima".
  - Langkah 4: hasilnya `0`. Nomor identity tetap bertambah karena Postgres tidak membatalkan sequence. Itu wajar.
- **Keadaan gagal yang dicek:**
  - Peran WW di luar daftar, berhuruf besar, atau berupa teks kosong.
  - Isian sah yang harus diterima: event lama tanpa penyelenggara, peran WW, dan tautan info, serta ketiga peran WW.
- **Hasil uji terakhir:** 27 Nov 2026, MrMoopii, lolos (7 lolos, 0 gagal, branch Neon `development`)

Jika skrip berhenti dengan error lain sebelum ringkasan, ada dua kemungkinan. "column … does not exist" berarti migrasi belum diterapkan. Nama constraint di pesan error berarti isian sah ditolak, jadi constraint itu terlalu ketat.

```sql
-- EVT-01: uji constraint kolom event informatif (kode tugas 3.1).
DO $uji$
DECLARE
  hari date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  kasus record;
  perintah text;
  nama_constraint text;
  lolos integer := 0;
  gagal integer := 0;
  rincian text := '';
BEGIN
  -- 1. Setiap kasus dijalankan di blok sendiri lalu dibatalkan, jadi kasus tidak saling memengaruhi.
  --    harapan = nama constraint yang harus menolak, atau NULL jika isian harus diterima.
  FOR kasus IN
    SELECT * FROM (VALUES
      ('E01 peran WW di luar daftar', $s$INSERT INTO events (nama_event, jenis_event, tanggal_pelaksanaan, peran_ww) VALUES ('Uji 3.1 E01', 'Seminar', {hari}, 'pembicara')$s$, 'events_peran_ww_valid'),
      ('E02 peran WW berhuruf besar', $s$INSERT INTO events (nama_event, jenis_event, tanggal_pelaksanaan, peran_ww) VALUES ('Uji 3.1 E02', 'Seminar', {hari}, 'Narasumber')$s$, 'events_peran_ww_valid'),
      ('E03 peran WW teks kosong', $s$INSERT INTO events (nama_event, jenis_event, tanggal_pelaksanaan, peran_ww) VALUES ('Uji 3.1 E03', 'Seminar', {hari}, '')$s$, 'events_peran_ww_valid'),
      ('E04 sah: event lama tanpa kolom 3.1', $s$INSERT INTO events (nama_event, jenis_event, tanggal_pelaksanaan) VALUES ('Uji 3.1 E04', 'Seminar', {hari})$s$, NULL),
      ('E05 sah: narasumber lengkap dengan tautan', $s$INSERT INTO events (nama_event, jenis_event, tanggal_pelaksanaan, penyelenggara, peran_ww, tautan_info) VALUES ('Uji 3.1 E05', 'Seminar', {hari}, 'Penyelenggara uji', 'narasumber', 'https://contoh.invalid/acara')$s$, NULL),
      ('E06 sah: peserta', $s$INSERT INTO events (nama_event, jenis_event, tanggal_pelaksanaan, penyelenggara, peran_ww) VALUES ('Uji 3.1 E06', 'Pameran', {hari}, 'Penyelenggara uji', 'peserta')$s$, NULL),
      ('E07 sah: mitra', $s$INSERT INTO events (nama_event, jenis_event, tanggal_pelaksanaan, penyelenggara, peran_ww) VALUES ('Uji 3.1 E07', 'Workshop', {hari}, 'Penyelenggara uji', 'mitra')$s$, NULL)
    ) AS t(kode, perintah, harapan)
  LOOP
    perintah := replace(kasus.perintah, '{hari}', quote_literal(hari) || '::date');
    BEGIN
      EXECUTE perintah;
      -- Isian diterima: lempar error buatan supaya barisnya ikut dibatalkan.
      RAISE EXCEPTION 'diterima';
    EXCEPTION
      WHEN raise_exception THEN
        IF kasus.harapan IS NULL THEN
          lolos := lolos + 1;
        ELSE
          gagal := gagal + 1;
          rincian := rincian || E'\n  GAGAL ' || kasus.kode || ': isian salah diterima';
        END IF;
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS nama_constraint = CONSTRAINT_NAME;
        IF nama_constraint = kasus.harapan THEN
          lolos := lolos + 1;
        ELSE
          gagal := gagal + 1;
          rincian := rincian || E'\n  GAGAL ' || kasus.kode || ': ditolak oleh '
            || coalesce(nullif(nama_constraint, ''), SQLERRM);
        END IF;
    END;
  END LOOP;

  -- 2. Ringkasan sengaja dikirim sebagai error supaya semua data uji di atas dibatalkan.
  RAISE EXCEPTION 'Uji skema 3.1 (event) selesai: % lolos, % gagal.%', lolos, gagal, rincian;
END
$uji$;
```

## EVT-02: Akses halaman daftar dan detail event tanpa login

- **Kode tugas:** 3.2
- **Peran:** publik (tanpa login)
- **Persiapan data:** minimal ada 1 event berstatus `aktif` dengan tanggal pelaksanaan ≥ hari ini di database.
- **Langkah:**
  1. Buka browser dalam mode Incognito/Private (memastikan tidak ada sesi login).
  2. Buka `http://localhost:3000/`. Periksa header: menu "Event" dan "Mitra" harus terlihat.
  3. Klik menu "Event" (menuju `/event`).
  4. Klik salah satu event di daftar untuk membuka `/event/detail/[id]`.
- **Hasil yang diharapkan:**
  - Halaman `/event` terbuka tanpa dialihkan ke `/auth/login`.
  - Halaman `/event/detail/[id]` terbuka menampilkan poster, nama, tanggal, waktu, lokasi, penyelenggara, dan peran WW tanpa dialihkan ke `/auth/login`.
  - Tidak ada tombol daftar atau tombol bayar di halaman detail maupun modal drawer.
- **Keadaan gagal yang dicek:**
  - Pengunjung belum login tetap bisa membuka halaman (tidak ada 401 atau redirect ke login).
- **Hasil uji terakhir:** belum diuji

## EVT-03: Filter visibilitas status event (draft dan hidden)

- **Kode tugas:** 3.2
- **Peran:** publik
- **Persiapan data:** siapkan 1 event berstatus `draft` dan 1 event berstatus `hidden` di database.
- **Langkah:**
  1. Buka `/event`. Cari nama event yang berstatus `draft` dan `hidden`.
  2. Coba buka langsung URL `/event/detail/<id-draft>` dan `/event/detail/<id-hidden>`.
- **Hasil yang diharapkan:**
  - Event `draft` dan `hidden` tidak muncul di timeline maupun hero banner `/event`.
  - Membuka URL langsung menghasilkan halaman 404 (`notFound()`).
- **Keadaan gagal yang dicek:**
  - Event yang tidak aktif tidak bocor ke publik lewat URL langsung.
- **Hasil uji terakhir:** belum diuji

## EVT-04: Validasi parameter ID pada URL detail event

- **Kode tugas:** 3.2
- **Peran:** publik
- **Persiapan data:** tidak memerlukan data khusus.
- **Langkah:**
  1. Buka `/event/detail/abc`.
  2. Buka `/event/detail/-5`.
  3. Buka `/event/detail/0`.
  4. Buka `/event/detail/99999999` (ID yang tidak ada di database).
- **Hasil yang diharapkan:**
  - Semua URL di atas menghasilkan halaman 404 (`notFound()`), bukan 500 error.
- **Keadaan gagal yang dicek:**
  - ID bukan angka, bernilai negatif, nol, atau tidak ditemukan di database.
- **Hasil uji terakhir:** belum diuji

## EVT-05: Pengalihan URL checkout dan bukti pendaftaran lama

- **Kode tugas:** 3.2
- **Peran:** publik / pelanggan
- **Persiapan data:** siapkan 1 ID event valid.
- **Langkah:**
  1. Buka `/event/checkout/1` di browser.
  2. Buka `/event/bukti/1` di browser.
- **Hasil yang diharapkan:**
  - Keduanya langsung dialihkan (HTTP 307/308 redirect) ke `/event`.
- **Keadaan gagal yang dicek:**
  - Pengguna tidak dapat mengakses form pendaftaran atau bukti pendaftaran lama.
- **Hasil uji terakhir:** belum diuji

## EVT-06: Penolakan Server Action pendaftaran lama

- **Kode tugas:** 3.2
- **Peran:** pelanggan
- **Persiapan data:** akun user biasa yang sedang login.
- **Langkah:**
  1. Panggil `registerForEvent({ eventId: 1 })` atau `confirmEventRegistration(formData)` secara langsung.
- **Hasil yang diharapkan:**
  - `registerForEvent` mengembalikan `{ ok: false, error: "Pendaftaran event tidak lagi tersedia..." }`.
  - `confirmEventRegistration` dan `mulaiPembayaranEvent` mengalihkan ke `/event`.
  - Tidak ada baris baru yang tersimpan di tabel `pendaftaran_event` atau `pembayaran_event`.
- **Keadaan gagal yang dicek:**
  - Server Action menolak membuat pendaftaran walaupun dipanggil langsung via DevTools atau skrip.
- **Hasil uji terakhir:** belum diuji


## EVT-07: Form tambah event menolak event tanpa penyelenggara dan peran WW

- **Kode tugas:** 3.3
- **Peran:** admin
- **Persiapan data:** akun admin yang sedang login.
- **Langkah:**
  1. Buka `/admin/events/tambah`.
  2. Isi nama, jenis, tanggal, lokasi, tetapi biarkan **penyelenggara** dan **peran WW** kosong.
  3. Klik "Simpan Event".
- **Hasil yang diharapkan:**
  - Form menampilkan pesan error di bawah isian penyelenggara ("Penyelenggara wajib diisi.") dan peran WW ("Pilih peran WW.").
  - Event tidak tersimpan di database.
- **Keadaan gagal yang dicek:**
  - Event tanpa penyelenggara atau peran WW ditolak dengan pesan jelas.
- **Hasil uji terakhir:** belum diuji

## EVT-08: Form tambah event menolak tautan info selain https://

- **Kode tugas:** 3.3
- **Peran:** admin
- **Persiapan data:** akun admin yang sedang login.
- **Langkah:**
  1. Buka `/admin/events/tambah`.
  2. Isi semua isian wajib termasuk penyelenggara dan peran WW.
  3. Isi tautan info dengan `http://contoh.id` (bukan https).
  4. Klik "Simpan Event".
- **Hasil yang diharapkan:**
  - Form menampilkan pesan error "Tautan info harus diawali https://."
  - Event tidak tersimpan.
- **Keadaan gagal yang dicek:**
  - Tautan selain https:// ditolak.
- **Hasil uji terakhir:** belum diuji

## EVT-09: Event lama tanpa penyelenggara tetap bisa dibuka dan diubah

- **Kode tugas:** 3.3
- **Peran:** admin
- **Persiapan data:** akun admin yang sedang login. Di database ada event lama (sebelum 3.3) dengan `penyelenggara = NULL` dan `peran_ww = NULL`.
- **Langkah:**
  1. Buka `/admin/events` dan cari event lama.
  2. Klik "Edit Event" untuk event itu.
  3. Halaman edit terbuka menampilkan isian kosong untuk penyelenggara dan peran WW.
  4. Isi penyelenggara dan pilih peran WW, lalu simpan.
- **Hasil yang diharapkan:**
  - Event lama terbuka di halaman edit tanpa error.
  - Setelah penyelenggara dan peran WW diisi, perubahan tersimpan.
  - Event lama tanpa penyelenggara tetap bisa dibuka di halaman detail publik `/event/detail/[id]`.
- **Keadaan gagal yang dicek:**
  - Data NULL di kolom 3.1 tidak crash halaman.
  - Penyimpanan sukses setelah kolom wajib diisi.
- **Hasil uji terakhir:** belum diuji

## EVT-10: Halaman peserta event dialihkan ke /admin/events

- **Kode tugas:** 3.3
- **Peran:** admin
- **Persiapan data:** akun admin yang sedang login.
- **Langkah:**
  1. Buka `/admin/peserta-event` di browser.
  2. Buka `/admin/peserta-event/1` (ID event apa pun).
- **Hasil yang diharapkan:**
  - Keduanya langsung dialihkan ke `/admin/events` (HTTP 307/308).
  - Tidak ada tampilan daftar peserta event.
- **Keadaan gagal yang dicek:**
  - Pengguna tidak dapat mengakses halaman peserta event lama.
- **Hasil uji terakhir:** belum diuji

## EVT-11: Server Action hapus peserta menolak setiap panggilan

- **Kode tugas:** 3.3
- **Peran:** admin
- **Persiapan data:** akun admin yang sedang login.
- **Langkah:**
  1. Panggil `hapusPesertaEvent({ idPendaftaran: 1, eventId: 1 })` secara langsung.
- **Hasil yang diharapkan:**
  - Mengembalikan `{ error: "Pendaftaran event tidak lagi tersedia..." }`.
  - Tidak ada baris yang dihapus dari `pendaftaran_event`.
  - Kuota event tidak berubah.
- **Keadaan gagal yang dicek:**
  - Server Action menolak walaupun dipanggil langsung via DevTools.
  - Data pendaftaran lama tidak terhapus.
- **Hasil uji terakhir:** belum diuji

## EVT-12: Akun bukan admin ditolak di setiap aksi event admin

- **Kode tugas:** 3.3
- **Peran:** user biasa
- **Persiapan data:** akun user biasa yang sedang login.
- **Langkah:**
  1. Buka `/admin/events/tambah` → harus dialihkan (middleware).
  2. Panggil `tambahEvent(formData)` secara langsung dari klien.
  3. Panggil `ubahEvent(formData)` secara langsung dari klien.
  4. Panggil `hapusPesertaEvent(formData)` secara langsung dari klien.
- **Hasil yang diharapkan:**
  - Middleware mencegah akses halaman `/admin/*` (redirect ke `/`).
  - Server Action mengembalikan `{ ok: false, pesan: "Akses khusus admin." }` atau `{ error: "Akses khusus admin." }`.
  - Tidak ada event atau pendaftaran yang berubah.
- **Keadaan gagal yang dicek:**
  - Akun bukan admin ditolak di middleware dan di Server Action (bagian 7.1).
- **Hasil uji terakhir:** belum diuji

