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
