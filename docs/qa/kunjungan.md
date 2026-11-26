# Skenario uji: kunjungan

Nomor `KJG-01` sampai `KJG-09` disediakan untuk skema tabel kunjungan (kode tugas 2.1). Skenario halaman dan aksi ditambahkan oleh kode tugas 2.2–2.7 di PR masing-masing.

Data uji diisi lewat SQL Editor Neon di branch `development` (`CONTRIBUTING.md` bagian 6.5).

## KJG-01: Constraint skema kunjungan

- **Kode tugas:** 2.1
- **Peran:** pemilik skema (SQL Editor Neon)
- **Persiapan data:** migrasi 2.1 sudah diterapkan dengan `pnpm db:migrate`. Skrip membuat data ujinya sendiri (dua akun, dua pengajuan, satu kunjungan, satu hari libur), lalu membatalkan semuanya di akhir. Tanggal dihitung dari Senin minggu depan, jadi skrip tetap bermakna kapan pun dijalankan.
- **Langkah:**
  1. Buka SQL Editor Neon, pilih branch `development`.
  2. Tempel seluruh skrip di bawah, lalu jalankan sekali.
  3. Baca pesan di akhir.
  4. Jalankan `SELECT count(*) FROM users WHERE email LIKE 'uji-2-1-%@contoh.invalid';`.
- **Hasil yang diharapkan:**
  - Langkah 3: skrip berhenti dengan `ERROR: Uji skema 2.1 selesai: 50 lolos, 0 gagal.` Pesan ini **sengaja berupa error** supaya semua data uji dibatalkan. Jika ada yang gagal, nama kasusnya tertulis di bawah ringkasan, beserta constraint yang menolaknya atau keterangan "isian salah diterima".
  - Langkah 4: hasilnya `0`. Nomor identity tetap bertambah karena Postgres tidak membatalkan sequence. Itu wajar.
- **Keadaan gagal yang dicek:**
  - Status, jenis, aturan, atau pengirim di luar daftar.
  - Kunjungan kedua di tanggal yang sama, termasuk jika berstatus `batal`.
  - Rentang jam setengah terisi, terbalik, atau sama.
  - Ember atau berat negatif.
  - Kunjungan di hari Sabtu atau Minggu.
  - Syarat per status (`tertunda`, `diambil`, `ditimbang`) tidak lengkap.
  - Foto tanpa fileId, atau fileId tanpa foto.
  - Foreign key ke data yang tidak ada, atau ke pengajuan atau kunjungan milik pelanggan lain.
  - Hari libur ganda.
  - Pola hari kosong, berisi Sabtu, atau berisi `NULL`.
  - Isian sah yang harus diterima, termasuk nilai batas (ember dan berat `0`, tanggal paling lambat sama dengan tanggal kunjungan).
- **Hasil uji terakhir:** 26 Nov 2026, MrMoopii, lolos (50 lolos, 0 gagal, branch Neon `development`)

Jika skrip berhenti dengan error lain sebelum ringkasan, ada dua kemungkinan. "relation … does not exist" berarti migrasi belum diterapkan. Nama constraint di pesan error berarti data uji sah di langkah 1 skrip ditolak, jadi constraint itu terlalu ketat.

```sql
-- KJG-01: uji constraint skema kunjungan (kode tugas 2.1).
DO $uji$
DECLARE
  senin date := (date_trunc('week', (now() AT TIME ZONE 'Asia/Jakarta')::date) + interval '7 days')::date;
  -- 520 minggu lagi: tetap Senin, dan jauh dari hari libur yang diisi admin.
  libur date := (date_trunc('week', (now() AT TIME ZONE 'Asia/Jakarta')::date) + interval '3647 days')::date;
  a integer;
  b integer;
  pa integer;
  pb integer;
  k integer;
  kasus record;
  perintah text;
  nama_constraint text;
  lolos integer := 0;
  gagal integer := 0;
  rincian text := '';
BEGIN
  -- 1. Data uji sah: akun A dan B, pengajuan masing-masing, kunjungan A di hari Senin, satu hari libur.
  INSERT INTO users (email) VALUES ('uji-2-1-a@contoh.invalid') RETURNING id_user INTO a;
  INSERT INTO users (email) VALUES ('uji-2-1-b@contoh.invalid') RETURNING id_user INTO b;
  INSERT INTO pengajuan_langganan (id_user, nama_instansi, jenis_instansi, alamat_pengambilan, nama_pic, telp_pic, estimasi_ember)
    VALUES (a, 'Uji A', 'hotel', 'Alamat A', 'PIC A', '0800000001', 2) RETURNING id_pengajuan INTO pa;
  INSERT INTO pengajuan_langganan (id_user, nama_instansi, jenis_instansi, alamat_pengambilan, nama_pic, telp_pic, estimasi_ember)
    VALUES (b, 'Uji B', 'restoran', 'Alamat B', 'PIC B', '0800000002', 3) RETURNING id_pengajuan INTO pb;
  INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jam_mulai, jam_selesai)
    VALUES (a, pa, senin, '08:00', '10:00') RETURNING id_kunjungan INTO k;
  INSERT INTO hari_libur (tanggal, keterangan) VALUES (libur, 'Libur uji');

  -- 2. Setiap kasus dijalankan di blok sendiri lalu dibatalkan, jadi kasus tidak saling memengaruhi.
  --    harapan = nama constraint yang harus menolak, atau NULL jika isian harus diterima.
  FOR kasus IN
    SELECT * FROM (VALUES
      ('K01 status kunjungan di luar daftar', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, status) VALUES ({a}, {pa}, {senin} + 1, 'selesai')$s$, 'kunjungan_pengambilan_status_valid'),
      ('K02 kunjungan kedua di tanggal sama walau batal', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, status) VALUES ({a}, {pa}, {senin}, 'batal')$s$, 'kunjungan_pengambilan_user_tanggal_unique'),
      ('K03 jam mulai tanpa jam selesai', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jam_mulai) VALUES ({a}, {pa}, {senin} + 1, '08:00')$s$, 'kunjungan_pengambilan_rentang_jam_valid'),
      ('K04 jam selesai tanpa jam mulai', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jam_selesai) VALUES ({a}, {pa}, {senin} + 1, '10:00')$s$, 'kunjungan_pengambilan_rentang_jam_valid'),
      ('K05 jam selesai sebelum jam mulai', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jam_mulai, jam_selesai) VALUES ({a}, {pa}, {senin} + 1, '10:00', '08:00')$s$, 'kunjungan_pengambilan_rentang_jam_valid'),
      ('K06 jam mulai sama dengan jam selesai', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jam_mulai, jam_selesai) VALUES ({a}, {pa}, {senin} + 1, '08:00', '08:00')$s$, 'kunjungan_pengambilan_rentang_jam_valid'),
      ('K07 jumlah ember negatif', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jumlah_ember) VALUES ({a}, {pa}, {senin} + 1, -1)$s$, 'kunjungan_pengambilan_jumlah_ember_tidak_negatif'),
      ('K08 berat negatif', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, berat_kg) VALUES ({a}, {pa}, {senin} + 1, -0.5)$s$, 'kunjungan_pengambilan_berat_kg_tidak_negatif'),
      ('K09 kunjungan hari Sabtu', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal) VALUES ({a}, {pa}, {senin} + 5)$s$, 'kunjungan_pengambilan_tanggal_hari_kerja'),
      ('K10 kunjungan hari Minggu', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal) VALUES ({a}, {pa}, {senin} + 6)$s$, 'kunjungan_pengambilan_tanggal_hari_kerja'),
      ('K11 tertunda tanpa alasan', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, status, tanggal_paling_lambat) VALUES ({a}, {pa}, {senin} + 1, 'tertunda', {senin} + 2)$s$, 'kunjungan_pengambilan_tertunda_lengkap'),
      ('K12 tertunda tanpa tanggal paling lambat', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, status, alasan_kendala) VALUES ({a}, {pa}, {senin} + 1, 'tertunda', 'Truk rusak')$s$, 'kunjungan_pengambilan_tertunda_lengkap'),
      ('K13 tanggal paling lambat sebelum tanggal kunjungan', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, tanggal_paling_lambat) VALUES ({a}, {pa}, {senin} + 1, {senin})$s$, 'kunjungan_pengambilan_tanggal_paling_lambat_valid'),
      ('K14 diambil tanpa jumlah ember', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, status) VALUES ({a}, {pa}, {senin} + 1, 'diambil')$s$, 'kunjungan_pengambilan_ember_tercatat'),
      ('K15 ditimbang tanpa berat', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, status, jumlah_ember, ditimbang_pada) VALUES ({a}, {pa}, {senin} + 1, 'ditimbang', 2, now())$s$, 'kunjungan_pengambilan_timbang_lengkap'),
      ('K16 ditimbang tanpa waktu timbang', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, status, jumlah_ember, berat_kg) VALUES ({a}, {pa}, {senin} + 1, 'ditimbang', 2, 4.5)$s$, 'kunjungan_pengambilan_timbang_lengkap'),
      ('K17 pelanggan tidak ada', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal) VALUES (-1, {pa}, {senin} + 1)$s$, 'kunjungan_pengambilan_pengajuan_user_fkey'),
      ('K18 pengajuan tidak ada', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal) VALUES ({a}, -1, {senin} + 1)$s$, 'kunjungan_pengambilan_pengajuan_user_fkey'),
      ('K19 kunjungan asal tidak ada', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, pengganti_dari) VALUES ({a}, {pa}, {senin} + 1, -1)$s$, 'kunjungan_pengambilan_pengganti_dari_fkey'),
      ('K20 kunjungan asal milik pelanggan lain', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, pengganti_dari) VALUES ({b}, {pb}, {senin} + 1, {k})$s$, 'kunjungan_pengambilan_pengganti_dari_fkey'),
      ('K21 pencatat tidak ada', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, dicatat_oleh) VALUES ({a}, {pa}, {senin} + 1, -1)$s$, 'kunjungan_pengambilan_dicatat_oleh_fkey'),
      ('K22 sah: kunjungan tanpa jam', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal) VALUES ({a}, {pa}, {senin} + 2)$s$, NULL),
      ('K23 sah: ditimbang lengkap, ember dan berat 0', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, status, jumlah_ember, berat_kg, ditimbang_pada, dicatat_oleh) VALUES ({a}, {pa}, {senin} + 3, 'ditimbang', 0, 0, now(), {a})$s$, NULL),
      ('K24 sah: tertunda lengkap, paling lambat di hari yang sama', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, status, alasan_kendala, tanggal_paling_lambat) VALUES ({a}, {pa}, {senin} + 4, 'tertunda', 'Truk rusak', {senin} + 4)$s$, NULL),
      ('K25 sah: pengganti milik pelanggan yang sama', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, pengganti_dari) VALUES ({a}, {pa}, {senin} + 1, {k})$s$, NULL),
      ('K26 sah: pelanggan lain di tanggal yang sama', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal) VALUES ({b}, {pb}, {senin})$s$, NULL),
      ('K27 pengajuan milik pelanggan lain', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal) VALUES ({a}, {pb}, {senin} + 1)$s$, 'kunjungan_pengambilan_pengajuan_user_fkey'),
      ('K28 foto tanpa fileId', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, foto_bukti) VALUES ({a}, {pa}, {senin} + 1, 'https://contoh.invalid/a.jpg')$s$, 'kunjungan_pengambilan_foto_berpasangan'),
      ('K29 fileId tanpa foto', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, foto_bukti_file_id) VALUES ({a}, {pa}, {senin} + 1, 'file-uji')$s$, 'kunjungan_pengambilan_foto_berpasangan'),
      ('K30 sah: foto dan fileId berpasangan', $s$INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, foto_bukti, foto_bukti_file_id) VALUES ({a}, {pa}, {senin} + 2, 'https://contoh.invalid/a.jpg', 'file-uji')$s$, NULL),
      ('L01 jenis laporan di luar daftar', $s$INSERT INTO laporan_kendala (id_user, kunjungan_id, jenis, pesan) VALUES ({a}, {k}, 'keluhan', 'Ember bocor')$s$, 'laporan_kendala_jenis_valid'),
      ('L02 status laporan di luar daftar', $s$INSERT INTO laporan_kendala (id_user, kunjungan_id, jenis, pesan, status) VALUES ({a}, {k}, 'kendala', 'Ember bocor', 'selesai')$s$, 'laporan_kendala_status_valid'),
      ('L03 pesan hanya spasi', $s$INSERT INTO laporan_kendala (id_user, kunjungan_id, jenis, pesan) VALUES ({a}, {k}, 'kendala', '   ')$s$, 'laporan_kendala_pesan_tidak_kosong'),
      ('L04 tanggal pengganti pada laporan kendala', $s$INSERT INTO laporan_kendala (id_user, kunjungan_id, jenis, pesan, tanggal_pengganti) VALUES ({a}, {k}, 'kendala', 'Ember bocor', {senin} + 2)$s$, 'laporan_kendala_tanggal_pengganti_hanya_lewati'),
      ('L05 kunjungan yang dilaporkan tidak ada', $s$INSERT INTO laporan_kendala (id_user, kunjungan_id, jenis, pesan) VALUES ({a}, -1, 'kendala', 'Ember bocor')$s$, 'laporan_kendala_kunjungan_user_fkey'),
      ('L06 kunjungan milik pelanggan lain', $s$INSERT INTO laporan_kendala (id_user, kunjungan_id, jenis, pesan) VALUES ({b}, {k}, 'kendala', 'Ember bocor')$s$, 'laporan_kendala_kunjungan_user_fkey'),
      ('L07 sah: lewati dengan tanggal pengganti', $s$INSERT INTO laporan_kendala (id_user, kunjungan_id, jenis, pesan, tanggal_pengganti) VALUES ({a}, {k}, 'lewati', 'Kantor tutup', {senin} + 2)$s$, NULL),
      ('L08 sah: kendala tanpa tanggal pengganti', $s$INSERT INTO laporan_kendala (id_user, kunjungan_id, jenis, pesan) VALUES ({a}, {k}, 'kendala', 'Ember bocor')$s$, NULL),
      ('H01 aturan hari libur di luar daftar', $s$INSERT INTO hari_libur (tanggal, keterangan, aturan) VALUES ({libur} + 7, 'Libur uji lain', 'pindah')$s$, 'hari_libur_aturan_valid'),
      ('H02 hari libur ganda', $s$INSERT INTO hari_libur (tanggal, keterangan) VALUES ({libur}, 'Libur kedua')$s$, 'hari_libur_tanggal_unique'),
      ('H03 sah: hari libur aturan lewati', $s$INSERT INTO hari_libur (tanggal, keterangan, aturan) VALUES ({libur} + 7, 'Libur uji lain', 'lewati')$s$, NULL),
      ('P01 pola tanpa hari', $s$INSERT INTO perubahan_jadwal (pengajuan_id, hari_pengambilan, berlaku_mulai, alasan, diubah_oleh) VALUES ({pa}, ARRAY[]::integer[], {senin}, 'Uji', {a})$s$, 'perubahan_jadwal_hari_valid'),
      ('P02 pola berisi Sabtu', $s$INSERT INTO perubahan_jadwal (pengajuan_id, hari_pengambilan, berlaku_mulai, alasan, diubah_oleh) VALUES ({pa}, ARRAY[1, 6], {senin}, 'Uji', {a})$s$, 'perubahan_jadwal_hari_valid'),
      ('P03 pola berisi NULL', $s$INSERT INTO perubahan_jadwal (pengajuan_id, hari_pengambilan, berlaku_mulai, alasan, diubah_oleh) VALUES ({pa}, ARRAY[1, NULL]::integer[], {senin}, 'Uji', {a})$s$, 'perubahan_jadwal_hari_valid'),
      ('P04 pola dengan jam setengah terisi', $s$INSERT INTO perubahan_jadwal (pengajuan_id, hari_pengambilan, jam_mulai, berlaku_mulai, alasan, diubah_oleh) VALUES ({pa}, ARRAY[1, 3, 5], '08:00', {senin}, 'Uji', {a})$s$, 'perubahan_jadwal_rentang_jam_valid'),
      ('P05 pengajuan pola tidak ada', $s$INSERT INTO perubahan_jadwal (pengajuan_id, hari_pengambilan, berlaku_mulai, alasan, diubah_oleh) VALUES (-1, ARRAY[1, 3, 5], {senin}, 'Uji', {a})$s$, 'perubahan_jadwal_pengajuan_id_fkey'),
      ('P06 pengubah pola tidak ada', $s$INSERT INTO perubahan_jadwal (pengajuan_id, hari_pengambilan, berlaku_mulai, alasan, diubah_oleh) VALUES ({pa}, ARRAY[1, 3, 5], {senin}, 'Uji', -1)$s$, 'perubahan_jadwal_diubah_oleh_fkey'),
      ('P07 sah: pola Selasa dan Kamis tanpa jam', $s$INSERT INTO perubahan_jadwal (pengajuan_id, hari_pengambilan, berlaku_mulai, alasan, diubah_oleh) VALUES ({pa}, ARRAY[2, 4], {senin}, 'Uji', {a})$s$, NULL),
      ('N01 pengirim pesan negosiasi di luar daftar', $s$INSERT INTO pesan_negosiasi (pengajuan_id, pengirim, id_pengirim, pesan) VALUES ({pa}, 'sistem', {a}, 'Uji')$s$, 'pesan_negosiasi_pengirim_valid'),
      ('N02 sah: pesan dari pelanggan', $s$INSERT INTO pesan_negosiasi (pengajuan_id, pengirim, id_pengirim, pesan) VALUES ({pa}, 'pelanggan', {a}, 'Uji')$s$, NULL)
    ) AS t(kode, perintah, harapan)
  LOOP
    perintah := replace(replace(replace(replace(replace(replace(replace(kasus.perintah,
      '{a}', a::text), '{b}', b::text), '{pa}', pa::text), '{pb}', pb::text), '{k}', k::text),
      '{senin}', quote_literal(senin) || '::date'), '{libur}', quote_literal(libur) || '::date');
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

  -- 3. Ringkasan sengaja dikirim sebagai error supaya semua data uji di atas dibatalkan.
  RAISE EXCEPTION 'Uji skema 2.1 selesai: % lolos, % gagal.%', lolos, gagal, rincian;
END
$uji$;
```
