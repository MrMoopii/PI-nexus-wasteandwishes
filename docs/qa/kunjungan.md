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

## KJG-10: Fungsi jadwal tanpa database

- **Kode tugas:** 2.2
- **Peran:** pengembang (terminal di root repo)
- **Persiapan data:** tidak ada. Fungsi di `features/kunjungan/jadwal.ts` tidak membaca database.
- **Langkah:**
  1. Jalankan perintah di bawah. Bisa di Git Bash maupun PowerShell, karena isinya tidak memakai tanda kutip ganda atau `$`.
  2. Bandingkan dua baris keluarannya.

  ```bash
  pnpm exec tsx -e "import('./features/kunjungan/jadwal.ts').then((j) => { const libur = new Map([['2026-12-25', 'geser']]); console.log(j.tanggalKunjungan({ hariPengambilan: [1, 3, 5], mulai: '2026-12-21', selesai: '2026-12-31', hariLibur: libur })); console.log(j.bolehMintaLewati('2026-12-28', new Date('2026-12-27T16:59:00+07:00')), j.bolehMintaLewati('2026-12-28', new Date('2026-12-27T17:00:00+07:00'))); })"
  ```

- **Hasil yang diharapkan:**
  - Baris 1: `[ '2026-12-21', '2026-12-23', '2026-12-28', '2026-12-30' ]`. Jumat 25 Des libur `geser` menjadi Senin 28 Des, dan 28 Des hanya muncul sekali.
  - Baris 2: `true false`. Untuk kunjungan Senin 28 Des, Minggu 16.59 WIB masih boleh meminta lewati, Minggu 17.00 WIB sudah tidak.
- **Keadaan gagal yang dicek:** tanggal ganda dari hasil geser, dan batas tepat pukul 17.00.
- **Hasil uji terakhir:** belum diuji

## KJG-11: Admin membuat kunjungan dari pola dan hari libur

- **Kode tugas:** 2.2
- **Peran:** admin
- **Persiapan data:** satu akun admin dan satu akun `user` biasa (`CONTRIBUTING.md` bagian 6.4). Skenario ini memakai Natal 25 Des 2026, jadi jalankan sebelum 21 Des 2026, atau geser semua tanggal ke minggu yang masih akan datang. Jalankan skrip ini sekali di SQL Editor Neon branch pribadimu:

  ```sql
  -- KJG-11: tiga pelanggan uji (kode tugas 2.2). Hapus lagi dengan skrip di langkah 7.
  DO $uji$
  DECLARE a integer; b integer; c integer;
  BEGIN
    INSERT INTO users (email, nama_pelanggan) VALUES ('uji-2-2-a@contoh.invalid', 'Uji 2.2 A') RETURNING id_user INTO a;
    INSERT INTO users (email, nama_pelanggan) VALUES ('uji-2-2-b@contoh.invalid', 'Uji 2.2 B') RETURNING id_user INTO b;
    INSERT INTO users (email, nama_pelanggan) VALUES ('uji-2-2-c@contoh.invalid', 'Uji 2.2 C') RETURNING id_user INTO c;
    -- A: MOU Senin-Rabu-Jumat 08.00-10.00, aktif sampai 31 Des 2026.
    INSERT INTO pengajuan_langganan (id_user, nama_instansi, jenis_instansi, alamat_pengambilan, nama_pic, telp_pic, estimasi_ember,
      jenis_pelanggan, hari_pengambilan, jam_mulai, jam_selesai, jumlah_ember, harga_final, status)
      VALUES (a, 'Uji 2.2 A', 'hotel', 'Alamat A', 'PIC A', '0800000001', 2, 'mou', '{1,3,5}', '08:00', '10:00', 2, 500000, 'siap_bayar');
    INSERT INTO data_langganan (id_user, status_langganan, tanggal_mulai_langganan, tanggal_akhir_langganan)
      VALUES (a, 'aktif', (now() AT TIME ZONE 'Asia/Jakarta')::date, '2026-12-31');
    -- B: reguler Senin-Rabu-Jumat tanpa jam, aktif hanya sampai 23 Des 2026.
    INSERT INTO pengajuan_langganan (id_user, nama_instansi, jenis_instansi, alamat_pengambilan, nama_pic, telp_pic, estimasi_ember,
      jenis_pelanggan, hari_pengambilan, jumlah_ember, harga_final, status)
      VALUES (b, 'Uji 2.2 B', 'restoran', 'Alamat B', 'PIC B', '0800000002', 3, 'reguler', '{1,3,5}', 3, 400000, 'siap_bayar');
    INSERT INTO data_langganan (id_user, status_langganan, tanggal_mulai_langganan, tanggal_akhir_langganan)
      VALUES (b, 'aktif', (now() AT TIME ZONE 'Asia/Jakarta')::date, '2026-12-23');
    -- C: langganan aktif tanpa pengajuan siap_bayar, seperti pelanggan dari alur lama.
    INSERT INTO data_langganan (id_user, status_langganan, tanggal_mulai_langganan, tanggal_akhir_langganan)
      VALUES (c, 'aktif', (now() AT TIME ZONE 'Asia/Jakarta')::date, '2026-12-31');
  END
  $uji$;
  ```

- **Langkah:**
  1. Login sebagai admin, buka menu **Hari Libur**, lalu tambah 25 Des 2026, keterangan "Hari Raya Natal", aturan **Geser ke hari kerja berikutnya**.
  2. Buka menu **Buat Kunjungan**. Pastikan "Jumat, 25 Desember 2026" tampil di kartu "Hari libur yang dihitung".
  3. Isi tanggal mulai 21 Des 2026 dan tanggal selesai 31 Des 2026, lalu klik **Buat kunjungan**.
  4. Jalankan query ini di SQL Editor:

     ```sql
     SELECT u.email, k.tanggal, to_char(k.tanggal, 'TMDay') AS hari, k.jam_mulai, k.jam_selesai, k.status
     FROM kunjungan_pengambilan k JOIN users u ON u.id_user = k.id_user
     WHERE u.email LIKE 'uji-2-2-%@contoh.invalid'
     ORDER BY u.email, k.tanggal;
     ```

  5. Klik **Buat kunjungan** lagi dengan rentang yang sama, lalu jalankan ulang query langkah 4.
  6. Coba isian salah satu per satu: tanggal mulai kemarin, tanggal selesai sebelum tanggal mulai, rentang 1 Des 2026 – 1 Jan 2027 (32 hari), dan kedua tanggal dikosongkan.
  7. Hapus data uji. Hari libur Natal dihapus lewat halaman (KJG-12 langkah 6) atau ikut skrip ini:

     ```sql
     DELETE FROM kunjungan_pengambilan WHERE id_user IN (SELECT id_user FROM users WHERE email LIKE 'uji-2-2-%@contoh.invalid');
     DELETE FROM data_langganan WHERE id_user IN (SELECT id_user FROM users WHERE email LIKE 'uji-2-2-%@contoh.invalid');
     DELETE FROM pengajuan_langganan WHERE id_user IN (SELECT id_user FROM users WHERE email LIKE 'uji-2-2-%@contoh.invalid');
     DELETE FROM users WHERE email LIKE 'uji-2-2-%@contoh.invalid';
     DELETE FROM hari_libur WHERE tanggal = '2026-12-25' AND keterangan = 'Hari Raya Natal';
     ```

- **Hasil yang diharapkan:**
  - Langkah 3: pesan hijau "Rentang 21 Desember 2026 – 31 Desember 2026: … kunjungan baru dibuat …", ditambah kalimat bahwa minimal satu pelanggan aktif dilewati karena belum punya pengajuan siap bayar (pelanggan C). Angkanya bisa lebih besar jika branch Neon-mu punya pelanggan aktif lain, jadi yang dicocokkan adalah hasil query langkah 4 (`CONTRIBUTING.md` bagian 6.5).
  - Langkah 4: tepat 6 baris, semuanya `dijadwalkan`:
    - A: 21, 23, 28, 30 Des, jam 08.00–10.00. Tidak ada 25 Des, dan 28 Des hanya satu baris.
    - B: 21 dan 23 Des, jam kosong. Tidak ada 28 dan 30 Des karena langganannya berakhir 23 Des.
    - C: tidak ada baris.
  - Langkah 5: pesan "0 kunjungan baru dibuat …" beserta jumlah tanggal yang sudah punya kunjungan. Query langkah 4 tetap 6 baris yang sama.
  - Langkah 6: pesan di bawah isian, berturut-turut "Tanggal mulai tidak boleh sebelum hari ini.", "Tanggal selesai tidak boleh sebelum tanggal mulai.", "Rentang paling panjang 31 hari.", dan "… wajib diisi." di kedua isian. Tanggal yang diketik tetap ada di form.
- **Keadaan gagal yang dicek:**
  - Belum login: membuka `/admin/buat-kunjungan` dialihkan ke halaman login.
  - Akun `user` biasa: membuka halaman dialihkan ke beranda. Buka halaman sebagai admin, logout di tab lain, login sebagai `user`, lalu kirim form di tab pertama: muncul "Akses khusus admin." dan tidak ada baris baru.
  - Sesi idle: kirim form setelah sesi idle, muncul "Sesi Anda telah berakhir. Silakan untuk login ulang."
  - Pelanggan tanpa pengajuan `siap_bayar` dan langganan yang berakhir di tengah rentang (langkah 4).
- **Hasil uji terakhir:** belum diuji

## KJG-12: Admin mengelola hari libur

- **Kode tugas:** 2.2
- **Peran:** admin
- **Persiapan data:** akun admin dan akun `user` biasa. Pilih satu Jumat yang masih akan datang dan belum terdaftar sebagai hari libur. Di bawah ini disebut Jumat-X, dan Sabtu sesudahnya Sabtu-X.
- **Langkah:**
  1. Buka menu **Hari Libur**. Tambah Jumat-X, keterangan "Libur uji", aturan bawaan (Geser).
  2. Tambah Jumat-X sekali lagi dengan keterangan lain.
  3. Tambah Sabtu-X, lalu tambah tanggal kemarin (ketik manual jika pemilih tanggal menolaknya), lalu tambah Jumat-X + 7 hari dengan keterangan hanya spasi.
  4. Di baris Jumat-X, klik **Ubah**, ganti aturan ke **Lewati pengambilan**, lalu simpan.
  5. Tambah Jumat-X + 7 hari dengan keterangan "Libur uji 2". Di baris itu klik **Ubah**, ganti tanggalnya ke Jumat-X, lalu simpan.
  6. Klik **Hapus** di baris Jumat-X. Pilih Batal di dialog konfirmasi, lalu ulangi dan pilih OK.
  7. Buka halaman di dua tab, hapus satu hari libur di tab pertama, lalu klik **Hapus** atau **Simpan perubahan** untuk baris yang sama di tab kedua.
  8. Di DevTools, ubah nilai `<input type="hidden" name="idHariLibur">` di salah satu form menjadi `abc`, lalu menjadi `999999`, dan kirim form itu.
- **Hasil yang diharapkan:**
  - Langkah 1: pesan "Hari libur ditambahkan.", dan baris "Jumat, <tanggal>" dengan badge "Geser ke hari kerja berikutnya" muncul urut menurut tanggal. Hari libur yang sama juga tampil di halaman **Buat Kunjungan**.
  - Langkah 2: pesan di bawah tanggal "Tanggal ini sudah terdaftar sebagai hari libur.", dan tidak ada baris baru.
  - Langkah 3: berturut-turut "Sabtu dan Minggu memang tidak ada pengambilan.", "Tanggal libur tidak boleh sebelum hari ini.", dan "Keterangan wajib diisi."
  - Langkah 4: pesan "Perubahan hari libur disimpan.", dan badge berubah menjadi "Lewati pengambilan".
  - Langkah 5: pesan "Tanggal ini sudah terdaftar sebagai hari libur.", dan kedua baris tetap seperti sebelumnya.
  - Langkah 6: Batal tidak mengubah apa pun. OK menghapus baris itu.
  - Langkah 7: tab kedua menampilkan "Hari libur ini sudah dihapus. Muat ulang halaman."
  - Langkah 8: `abc` menampilkan "Hari libur tidak valid.", `999999` menampilkan "Hari libur ini sudah dihapus. Muat ulang halaman." Tidak ada data yang berubah.
- **Keadaan gagal yang dicek:**
  - Belum login: membuka `/admin/hari-libur` dialihkan ke halaman login.
  - Akun `user` biasa: dialihkan ke beranda. Mengirim form dari tab admin yang sesinya sudah diganti `user` menampilkan "Akses khusus admin."
  - Sesi idle: pesan "Sesi Anda telah berakhir. Silakan untuk login ulang."
  - Tanggal ganda, akhir pekan, tanggal lewat, isian kosong, ID salah, dan data yang sudah dihapus di tab lain.
- **Hasil uji terakhir:** belum diuji

## KJG-13: Admin mencatat ember, foto, lalu berat

- **Kode tugas:** 2.3
- **Peran:** admin
- **Persiapan data:** akun admin dan akun `user` biasa (`CONTRIBUTING.md` bagian 6.4). Jalankan skrip ini sekali di SQL Editor Neon branch pribadimu; tanggal memakai Senin minggu depan supaya tetap bermakna.

  ```sql
  -- KJG-13: dua pelanggan uji dengan kunjungan dijadwalkan (kode tugas 2.3).
  DO $uji$
  DECLARE
    a integer; b integer; pa integer; pb integer;
    senin date := (date_trunc('week', (now() AT TIME ZONE 'Asia/Jakarta')::date) + interval '7 days')::date;
  BEGIN
    INSERT INTO users (email, nama_pelanggan) VALUES ('uji-2-3-a@contoh.invalid', 'Uji 2.3 A') RETURNING id_user INTO a;
    INSERT INTO users (email, nama_pelanggan) VALUES ('uji-2-3-b@contoh.invalid', 'Uji 2.3 B') RETURNING id_user INTO b;
    INSERT INTO pengajuan_langganan (id_user, nama_instansi, jenis_instansi, alamat_pengambilan, nama_pic, telp_pic, estimasi_ember, status)
      VALUES (a, 'Instansi Uji A', 'hotel', 'Alamat A', 'PIC A', '0800000001', 2, 'siap_bayar') RETURNING id_pengajuan INTO pa;
    INSERT INTO pengajuan_langganan (id_user, nama_instansi, jenis_instansi, alamat_pengambilan, nama_pic, telp_pic, estimasi_ember, status)
      VALUES (b, 'Instansi Uji B', 'restoran', 'Alamat B', 'PIC B', '0800000002', 3, 'siap_bayar') RETURNING id_pengajuan INTO pb;
    INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jam_mulai, jam_selesai)
      VALUES (a, pa, senin, '08:00', '10:00'), (b, pb, senin, '13:00', '15:00');
  END
  $uji$;
  ```

- **Langkah:**
  1. Login sebagai admin, buka `/admin/kunjungan?tanggal=<Senin minggu depan>`. Pastikan kedua instansi tampil dengan rentang jam dan status Dijadwalkan.
  2. Di baris Instansi Uji A, buka **Catat ember & foto**. Sebelum mengisi apa pun, pastikan tombol **Simpan ember & foto** nonaktif dan isian jumlah ember kosong (bukan `0`). Isi jumlah ember `3` saja (tanpa foto): tombol tetap nonaktif. Unggah satu foto JPG/PNG, lalu simpan.
  3. Di baris yang sama, buka **Catat berat**, isi `4.25`, lalu simpan.
  4. Buka **Edit** di baris A. Pastikan jumlah ember terisi `3`, berat terisi `4.25`, dan keterangan foto lama tampil. Ubah jumlah ember menjadi `5`, unggah foto baru, lalu simpan.
  5. Buka lagi **Edit** di baris A, ubah berat menjadi `4.5`, lalu simpan.
  6. Jalankan query ini di SQL Editor:

     ```sql
     SELECT u.email, k.status, k.jumlah_ember, k.berat_kg, k.foto_bukti IS NOT NULL AS ada_foto,
            k.dicatat_oleh, k.ditimbang_pada IS NOT NULL AS ada_waktu_timbang
     FROM kunjungan_pengambilan k JOIN users u ON u.id_user = k.id_user
     WHERE u.email LIKE 'uji-2-3-%@contoh.invalid' ORDER BY u.email;
     ```

  7. Di baris Instansi Uji B, isi jumlah ember `-1`, lalu simpan.
  8. Isi berat `-1`, lalu `4.256`, lalu kosongkan, masing-masing kirim.
  9. Buka halaman di dua tab. Di tab pertama catat ember Instansi Uji B, lalu di tab kedua catat ember untuk kunjungan yang sama.
  10. Di DevTools, ubah hidden input `fotoBukti` menjadi `javascript:alert(1)`, lalu kirim form catat ember.
  11. Ubah `?tanggal=` menjadi `2026-02-30` dan `abc`.

- **Hasil yang diharapkan:**
  - Langkah 2: tombol simpan nonaktif sampai jumlah ember terisi **dan** foto diunggah. Setelah simpan, pesan "Jumlah ember dan foto bukti disimpan.", status menjadi Diambil, kolom Ember `3`, dan tautan "Lihat foto bukti" muncul.
  - Langkah 3: pesan "Berat 4.25 kg disimpan.", status Ditimbang, kolom Berat `4.25 kg`.
  - Langkah 4: pesan "Perubahan pencatatan disimpan.", kolom Ember menjadi `5`, foto baru tampil, dan foto lama terhapus dari ImageKit.
  - Langkah 5: pesan "Perubahan pencatatan disimpan.", kolom Berat menjadi `4.5 kg`.
  - Langkah 6: A berstatus `ditimbang`, `jumlah_ember` 5, `berat_kg` 4.5, ada foto, `dicatat_oleh` = id admin, `ada_waktu_timbang` = true.
  - Langkah 7: "Jumlah ember tidak boleh negatif." dan tidak ada perubahan status.
  - Langkah 8: "Berat tidak boleh negatif.", "Berat berupa angka, maksimal dua angka desimal.", dan "Berat wajib diisi."
  - Langkah 9: tab kedua menampilkan "Status kunjungan sudah berubah. Muat ulang halaman lalu coba lagi." dan data tab pertama tidak tertimpa.
  - Langkah 10: "Foto bukti wajib diunggah." karena skema hanya menerima URL `https`.
  - Langkah 11: halaman 404.
- **Keadaan gagal yang dicek:**
  - Belum login: membuka `/admin/kunjungan` dialihkan ke halaman login.
  - Akun `user` biasa: dialihkan ke beranda. Mengirim form dari tab admin yang sesinya sudah diganti `user` menampilkan "Akses khusus admin."
  - Sesi idle: pesan "Sesi Anda telah berakhir. Silakan untuk login ulang."
  - Tanggal tanpa kunjungan menampilkan "Belum ada kunjungan pada tanggal ini."
  - Isian kosong pada jumlah ember dan foto tidak boleh lolos sebagai `0`.
  - Edit berat saat status masih `diambil` (misalnya form Edit lama dikirim dari tab lain) ditolak dengan pesan bahwa berat hanya bisa diubah setelah ditimbang.
- **Hasil uji terakhir:** belum diuji

## KJG-14: Admin menandai kunjungan tertunda, satu atau banyak

- **Kode tugas:** 2.3
- **Peran:** admin
- **Persiapan data:** data uji KJG-13 (tiga kunjungan `dijadwalkan`, minimal dua pada tanggal yang sama). Jika KJG-13 sudah dijalankan dan statusnya berubah, buat ulang datanya dengan skrip di sana.
- **Langkah:**
  1. Buka `/admin/kunjungan?tanggal=<Senin minggu depan>`. Centang dua kunjungan berstatus Dijadwalkan, isi alasan "Truk pengangkut rusak", isi tanggal paling lambat satu hari setelah tanggal kunjungan, lalu klik **Tandai tertunda**.
  2. Jalankan query dari KJG-13 langkah 6.
  3. Di halaman yang sama, centang satu kunjungan yang baru ditandai tertunda, lalu klik **Tandai tertunda**.
  4. Pilih tanggal paling lambat sebelum tanggal kunjungan (ketik manual di DevTools jika pemilih tanggal menolaknya), lalu kirim.
  5. Isi alasan hanya spasi, lalu kirim.
  6. Kosongkan semua centang, lalu periksa tombol **Tandai tertunda**.
  7. Buka halaman di dua tab: tandai tertunda satu kunjungan di tab pertama, lalu kirim form yang sama dari tab kedua.
  8. Di DevTools, ubah hidden input `idKunjungan` menjadi `abc`, lalu menjadi `999999`, dan kirim.

- **Hasil yang diharapkan:**
  - Langkah 1: pesan "2 kunjungan ditandai tertunda.", kedua baris berstatus Tertunda, dan di bawah nama instansi tampil alasan beserta "paling lambat <tanggal>".
  - Langkah 2: kedua baris berstatus `tertunda` dengan `alasan_kendala` dan `tanggal_paling_lambat` terisi.
  - Langkah 3: kunjungan `tertunda` tidak bisa dicentang lagi (checkbox nonaktif), jadi tidak ada baris yang berubah.
  - Langkah 4: "Tidak ada kunjungan yang bisa ditandai tertunda…" dan tidak ada data yang berubah.
  - Langkah 5: "Alasan tertunda wajib diisi."
  - Langkah 6: tombol nonaktif, dengan teks "Belum ada kunjungan yang dicentang."
  - Langkah 7: tab kedua menampilkan "Tidak ada kunjungan yang bisa ditandai tertunda…" karena statusnya sudah berubah.
  - Langkah 8: `abc` menampilkan "Kunjungan tidak valid."; `999999` menampilkan pesan bahwa tidak ada kunjungan yang bisa ditandai tertunda.
- **Keadaan gagal yang dicek:**
  - Belum login, akun bukan admin, dan sesi idle (sama seperti KJG-13).
  - Tanggal paling lambat sebelum tanggal kunjungan, alasan kosong, dan ID yang tidak valid.
  - Sebagian baris sudah berubah status: pesan menyebut jumlah yang berhasil dan yang dilewati.
## Data uji tracker (KJG-20 sampai KJG-25)

Skenario tracker (kode tugas 2.4) memakai **akun user uji khusus** yang dibuat lewat halaman Daftar, belum pernah membayar, dan tidak punya pengajuan berjalan. Pelanggan uji harus login, jadi akunnya dibuat lewat aplikasi, bukan lewat SQL. Siapkan juga satu akun admin (`CONTRIBUTING.md` bagian 6.4).

Skrip di bawah memberi akun itu pengajuan `siap_bayar` (pola Senin–Jumat, 08.00–10.00), langganan aktif sampai 30 hari lagi, dan data berikut:

- **Riwayat**, 4 hari kerja terakhir:
  - terbaru `ditimbang` (4 ember, 12,5 kg);
  - lalu `diambil` (3 ember);
  - lalu `tertunda` (alasan "Truk pengangkut diservis", paling lambat 2 hari lagi);
  - terlama `dijadwalkan`, yaitu kunjungan yang belum dicatat admin.
- **Hari ini:** kunjungan `dijadwalkan` jika hari ini hari kerja.
- **Hari kerja ke-1 sampai ke-4** setelah hari ini: kunjungan `dijadwalkan`. Yang ke-3 tanpa jam.
- **Hari kerja ke-5:** perubahan pola mulai berlaku (Senin, Rabu, Jumat, 07.00–09.00).
- **Hari kerja ke-6:** hari libur "Libur uji 2.4" dengan aturan `geser`.

Ganti `email-akun-uji@contoh.com` di semua skrip dengan email akun uji itu, lalu jalankan skrip ini sekali di SQL Editor Neon:

```sql
-- Data uji tracker (kode tugas 2.4). Hapus lagi dengan skrip di KJG-25 langkah 8.
DO $uji$
DECLARE
  surel text := 'email-akun-uji@contoh.com';
  u integer;
  p integer;
  adm integer;
  hari_ini date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  maju date[];   -- 8 hari kerja setelah hari ini
  mundur date[]; -- 4 hari kerja terakhir sebelum hari ini, terbaru dulu
BEGIN
  SELECT id_user INTO u FROM users WHERE email = surel AND peran = 'user';
  IF u IS NULL THEN
    RAISE EXCEPTION 'Akun user % tidak ditemukan.', surel;
  END IF;
  SELECT min(id_user) INTO adm FROM users WHERE peran = 'admin';
  IF adm IS NULL THEN
    RAISE EXCEPTION 'Belum ada akun admin (CONTRIBUTING.md bagian 6.4).';
  END IF;
  IF EXISTS (SELECT 1 FROM pengajuan_langganan
             WHERE id_user = u AND status NOT IN ('ditolak', 'dibatalkan')) THEN
    RAISE EXCEPTION 'Akun % masih punya pengajuan berjalan. Pakai akun uji lain.', surel;
  END IF;
  SELECT array_agg(d ORDER BY d) INTO maju FROM (
    SELECT g::date AS d FROM generate_series(hari_ini + 1, hari_ini + 14, interval '1 day') AS g
    WHERE extract(isodow FROM g) BETWEEN 1 AND 5 ORDER BY 1 LIMIT 8) AS x;
  SELECT array_agg(d ORDER BY d DESC) INTO mundur FROM (
    SELECT g::date AS d FROM generate_series(hari_ini - 10, hari_ini - 1, interval '1 day') AS g
    WHERE extract(isodow FROM g) BETWEEN 1 AND 5 ORDER BY 1 DESC LIMIT 4) AS x;
  INSERT INTO pengajuan_langganan (id_user, nama_instansi, jenis_instansi, alamat_pengambilan, nama_pic, telp_pic,
    estimasi_ember, jenis_pelanggan, hari_pengambilan, jam_mulai, jam_selesai, jumlah_ember, harga_final, status)
    VALUES (u, 'Uji 2.4', 'hotel', 'Alamat uji 2.4', 'PIC uji', '0800000024', 3, 'mou', '{1,2,3,4,5}',
      '08:00', '10:00', 3, 500000, 'siap_bayar')
    RETURNING id_pengajuan INTO p;
  INSERT INTO data_langganan (id_user, status_langganan, tanggal_mulai_langganan, tanggal_akhir_langganan)
    VALUES (u, 'aktif', hari_ini - 14, hari_ini + 30)
    ON CONFLICT (id_user) DO UPDATE SET status_langganan = 'aktif',
      tanggal_mulai_langganan = EXCLUDED.tanggal_mulai_langganan,
      tanggal_akhir_langganan = EXCLUDED.tanggal_akhir_langganan;
  INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jam_mulai, jam_selesai, status,
    jumlah_ember, berat_kg, ditimbang_pada, alasan_kendala, tanggal_paling_lambat) VALUES
    (u, p, mundur[1], '08:00', '10:00', 'ditimbang', 4, 12.5, now(), NULL, NULL),
    (u, p, mundur[2], '08:00', '10:00', 'diambil', 3, NULL, NULL, NULL, NULL),
    (u, p, mundur[3], '08:00', '10:00', 'tertunda', NULL, NULL, NULL, 'Truk pengangkut diservis', hari_ini + 2),
    (u, p, mundur[4], '08:00', '10:00', 'dijadwalkan', NULL, NULL, NULL, NULL, NULL);
  IF extract(isodow FROM hari_ini) BETWEEN 1 AND 5 THEN
    INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jam_mulai, jam_selesai)
      VALUES (u, p, hari_ini, '08:00', '10:00');
  END IF;
  INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jam_mulai, jam_selesai) VALUES
    (u, p, maju[1], '08:00', '10:00'),
    (u, p, maju[2], '08:00', '10:00'),
    (u, p, maju[3], NULL, NULL),
    (u, p, maju[4], '08:00', '10:00');
  INSERT INTO hari_libur (tanggal, keterangan, aturan) VALUES (maju[6], 'Libur uji 2.4', 'geser')
    ON CONFLICT (tanggal) DO NOTHING;
  INSERT INTO perubahan_jadwal (pengajuan_id, hari_pengambilan, jam_mulai, jam_selesai, berlaku_mulai, alasan, diubah_oleh)
    VALUES (p, '{1,3,5}', '07:00', '09:00', maju[5], 'Uji 2.4: rute kurir berubah', adm);
END
$uji$;
```

Tanggal yang sebenarnya dan id setiap kunjungan dilihat dengan query ini. Id dipakai di langkah DevTools.

```sql
SELECT k.id_kunjungan, k.tanggal, to_char(k.tanggal, 'TMDay') AS hari, k.status, k.jam_mulai, k.pengganti_dari
FROM kunjungan_pengambilan k JOIN users u ON u.id_user = k.id_user
WHERE u.email = 'email-akun-uji@contoh.com'
ORDER BY k.tanggal;
```

Catatan hari libur:

- Hari libur lain yang sudah ada di branch dan jatuh di hari kerja dalam 30 hari ke depan ikut tampil di pemberitahuan. Pola uji Senin–Jumat, jadi semuanya terhitung hari pola.
- Jika hari kerja ke-6 sudah terdaftar sebagai libur lain, keterangan libur itu yang tampil, bukan "Libur uji 2.4".
- Jika hari kerja ke-5 ternyata hari libur, pakai hari kerja ke-7 atau ke-8 di KJG-25 langkah 3.

## KJG-20: Akses tracker pelanggan

- **Kode tugas:** 2.4
- **Peran:** publik, pelanggan, admin
- **Persiapan data:** akun user uji dari "Data uji tracker", sebelum dan sesudah skrip persiapan dijalankan, dan satu akun admin.
- **Langkah:**
  1. Dalam keadaan logout, buka `/tracker`.
  2. Login sebagai akun user uji sebelum skrip persiapan dijalankan. Lihat menu header, lalu klik **Tracker**.
  3. Jalankan skrip persiapan, lalu muat ulang `/tracker`.
  4. Jalankan `UPDATE data_langganan SET status_langganan = 'dihentikan' WHERE id_user = (SELECT id_user FROM users WHERE email = 'email-akun-uji@contoh.com');`, lalu muat ulang. Ulangi dengan `status_langganan = 'aktif', tanggal_akhir_langganan = (now() AT TIME ZONE 'Asia/Jakarta')::date - 1`. Terakhir kembalikan ke `status_langganan = 'aktif', tanggal_akhir_langganan = (now() AT TIME ZONE 'Asia/Jakarta')::date + 30`.
  5. Login sebagai admin, lalu buka `/tracker` lewat alamat.
- **Hasil yang diharapkan:**
  - Langkah 1: dialihkan ke halaman login (`/auth/login?callbackUrl=…`).
  - Langkah 2: menu **Tracker** ada di antara Langganan dan Daftar Event. Halaman menampilkan "Tracker belum tersedia" dan tombol **Buka halaman langganan** menuju `/langganan`. Tidak ada data kunjungan apa pun.
  - Langkah 3: isi tracker tampil (dicek di KJG-21).
  - Langkah 4: `dihentikan` dan tanggal akhir kemarin sama-sama menampilkan "Tracker belum tersedia". Setelah dikembalikan, isi tracker tampil lagi.
  - Langkah 5: "Tracker belum tersedia", karena admin tidak punya langganan.
- **Keadaan gagal yang dicek:**
  - Belum login.
  - Sesi idle: buka `/tracker` setelah sesi idle, maka dialihkan ke `/auth/login?reason=idle`.
  - Langganan dihentikan, berakhir kemarin, belum berlangganan, dan akun admin.
- **Hasil uji terakhir:** belum diuji

## KJG-21: Isi tracker

- **Kode tugas:** 2.4
- **Peran:** pelanggan
- **Persiapan data:** skrip "Data uji tracker" sudah dijalankan. Belum ada aksi lapor atau lewati.
- **Langkah:**
  1. Login sebagai akun uji dan buka `/tracker`.
  2. Cocokkan setiap bagian dengan hasil query tanggal di atas.
  3. Muat ulang dengan DevTools → Network → Regular 4G (centang Disable Cache), lalu perhatikan kerangka sebelum isi muncul.
  4. Ulangi di lebar layar HP (DevTools, 375 px).
- **Hasil yang diharapkan:**
  - **Kartu hari ini:**
    - Hari kerja: "Dijadwalkan", "Sampah Anda dijadwalkan diambil hari ini.", dan "08.00 – 10.00 WIB".
    - Sabtu atau Minggu: "Tidak ada pengambilan" dan "Sabtu dan Minggu tidak ada pengambilan."
    - Selalu ada tombol **Lapor kendala atau minta lewati**, yang menggulir ke form.
  - **Jadwal berikutnya:** hari kerja ke-1, "08.00 – 10.00 WIB".
  - **Total:** "7 ember" (4 + 3, dari `diambil` dan `ditimbang`) dan "12,5 kg".
  - **Baris di bawah kartu:** "Uji 2.4", lalu "Jadwal tetap Senin, Selasa, Rabu, Kamis, Jumat, 08.00 – 10.00 WIB (pola jadwal hanya bisa diubah admin)".
  - **Pemberitahuan:**
    - "Jadwal berubah mulai <hari kerja ke-5>", isi "Hari pengambilan menjadi Senin, Rabu, Jumat, 07.00 – 09.00 WIB." dan "Alasan: Uji 2.4: rute kurir berubah".
    - "Pengambilan <hari kerja terakhir ke-3> tertunda", isi "Ditunda: Truk pengangkut diservis. Diambil paling lambat <2 hari lagi>."
    - "Libur <hari kerja ke-6>", isi "Ditunda: Libur uji 2.4. Diambil paling lambat <hari kerja ke-7>." Hari kerja ke-7 berganti jika tanggal itu juga libur.
  - **Jadwal mendatang:** hari kerja ke-1 sampai ke-4, semuanya "Dijadwalkan". Yang ke-3 menulis "Jam menyesuaikan Waste and Wishes".
  - **Riwayat:** 4 baris, terbaru di atas:
    - "Ditimbang" dengan "4 ember · 12,5 kg";
    - "Diambil" dengan "3 ember sudah diambil. Berat menyusul setelah ditimbang.";
    - "Tertunda" dengan pesan tertunda yang sama seperti di pemberitahuan;
    - "Dijadwalkan".
  - **Permintaan saya:** "Belum ada laporan."
  - **Langkah 3:** kerangka abu-abu tampil dulu dengan tinggi yang mirip, dan isi di bawahnya tidak terdorong jauh saat data muncul.
  - **Langkah 4:**
    - Satu kolom: kartu hari ini, pemberitahuan, jadwal, riwayat, lalu form dan permintaan.
    - Menu header terbagi beberapa baris tanpa saling menimpa.
- **Keadaan gagal yang dicek:** data kosong.
  1. Setelah KJG-25 langkah 8 (pembersihan), beri akun uji langganan aktif saja dengan `INSERT INTO data_langganan (id_user, status_langganan, tanggal_mulai_langganan, tanggal_akhir_langganan) SELECT id_user, 'aktif', (now() AT TIME ZONE 'Asia/Jakarta')::date, (now() AT TIME ZONE 'Asia/Jakarta')::date + 30 FROM users WHERE email = 'email-akun-uji@contoh.com';`.
  2. Buka `/tracker`. Yang diharapkan:
     - kartu hari ini "Tidak ada pengambilan";
     - "Belum ada jadwal berikutnya. Jadwal dibuat oleh tim Waste and Wishes.";
     - total 0;
     - "Belum ada jadwal mendatang.", "Belum ada riwayat pengambilan.", dan "Belum ada laporan.";
     - baris jadwal tetap dan kartu pemberitahuan tidak tampil;
     - tab **Ada kendala** menulis "Belum ada kunjungan yang bisa dilaporkan.";
     - tab **Minta lewati** menulis "Tidak ada kunjungan yang masih bisa dilewati. Permintaan lewati paling lambat H-1 pukul 17.00 WIB.".
  3. Hapus lagi baris `data_langganan` itu.
- **Hasil uji terakhir:** belum diuji

## KJG-22: Pelanggan melaporkan kendala

- **Kode tugas:** 2.4
- **Peran:** pelanggan
- **Persiapan data:** skrip "Data uji tracker" sudah dijalankan.
- **Langkah:**
  1. Di kartu **Laporan ke admin**, tab **Ada kendala**, klik **Kirim laporan** tanpa mengisi apa pun. Lalu pilih satu kunjungan, isi pesan hanya dengan spasi, dan kirim.
  2. Pilih kunjungan riwayat yang "Ditimbang", tulis "Ember kemarin belum dikembalikan.", lalu kirim.
  3. Di DevTools, ubah atribut `value` salah satu `<option>` di pilihan kunjungan menjadi `abc`, pilih opsi itu, lalu kirim. Ulangi dengan `999999`, lalu dengan id kunjungan milik akun lain dari query `SELECT id_kunjungan FROM kunjungan_pengambilan WHERE id_user <> (SELECT id_user FROM users WHERE email = 'email-akun-uji@contoh.com') LIMIT 1;`.
  4. Biarkan halaman terbuka. Ubah langganan akun uji menjadi `dihentikan` (KJG-20 langkah 4), lalu kirim laporan yang valid dari halaman yang masih terbuka. Kembalikan ke `aktif` sesudahnya.
  5. Jalankan `SELECT jenis, status, pesan, tanggal_pengganti FROM laporan_kendala WHERE id_user = (SELECT id_user FROM users WHERE email = 'email-akun-uji@contoh.com');`.
- **Hasil yang diharapkan:**
  - Langkah 1: kotak merah "Periksa kembali isian yang ditandai.", ditambah pesan "Pilih kunjungan." dan "Pesan wajib diisi." di bawah isiannya. Isian yang sudah dipilih tetap ada.
  - Langkah 2: "Laporan terkirim. Tanggapan admin akan tampil di Permintaan saya.", lalu form kosong lagi. Di **Permintaan saya** muncul "Kendala" dengan badge "Menunggu tanggapan", tanggal kunjungannya, tanggal kirim hari ini, dan isi pesannya.
  - Langkah 3: `abc` menampilkan "Pilih kunjungan.". `999999` dan kunjungan akun lain sama-sama menampilkan "Kunjungan tidak ditemukan. Muat ulang halaman.".
  - Langkah 4: "Laporan hanya untuk pelanggan dengan langganan aktif. Muat ulang halaman.".
  - Langkah 5: tepat satu baris, yaitu `kendala`, `menunggu`, "Ember kemarin belum dikembalikan.", `tanggal_pengganti` kosong.
- **Keadaan gagal yang dicek:**
  - Isian kosong, ID salah, kunjungan akun lain, dan langganan berhenti saat halaman masih terbuka.
  - Sesi idle: kirim laporan setelah sesi idle, maka muncul "Sesi Anda telah berakhir. Silakan untuk login ulang.".
- **Hasil uji terakhir:** belum diuji

## KJG-23: Pelanggan meminta lewati tanpa tanggal pengganti

- **Kode tugas:** 2.4
- **Peran:** pelanggan
- **Persiapan data:** skrip "Data uji tracker" sudah dijalankan.
- **Langkah:**
  1. Buka tab **Minta lewati**, lalu buka pilihan kunjungan.
  2. Pilih hari kerja ke-3, kosongkan alasan, biarkan **Lewati saja**, lalu klik **Lewati pengambilan**. Pilih OK di dialog konfirmasi.
  3. Isi alasan "Kantor tutup karena acara internal". Klik **Lewati pengambilan**, lalu pilih Batal di dialog.
  4. Klik **Lewati pengambilan** lagi dan pilih OK.
  5. Buka `/tracker` di dua tab. Di tab pertama, lewati hari kerja ke-4 dengan alasan apa saja. Di tab kedua, yang belum dimuat ulang, pilih hari kerja ke-4 lalu kirim.
  6. Jalankan query tanggal di "Data uji tracker" dan query laporan di KJG-22 langkah 5.
- **Hasil yang diharapkan:**
  - Langkah 1: pilihan berisi hari kerja ke-1 sampai ke-4. Kunjungan hari ini dan kunjungan lampau tidak ada. Hari kerja ke-1 hanya muncul jika batasnya (H-1 pukul 17.00 WIB) belum lewat. Setelah satu kunjungan dipilih, di bawahnya tertulis "Batas permintaan: <hari>, <tanggal> pukul 17.00 WIB.".
  - Langkah 2: "Alasan wajib diisi." di bawah isian alasan, dan tidak ada data yang berubah.
  - Langkah 3: tidak terjadi apa-apa.
  - Langkah 4: "Kunjungan dilewati. Alasan Anda sudah diteruskan ke admin.", lalu form kosong lagi.
    - Di **Jadwal mendatang**, hari kerja ke-3 berbadge "Dilewati" dengan keterangan "Dilewati atas permintaan Anda.".
    - Di **Permintaan saya** muncul "Lewati pengambilan", "Menunggu tanggapan", dan "Kunjungan sudah dilewati. Admin akan membaca alasan Anda.".
    - Hari kerja ke-3 tidak ada lagi di pilihan lewati.
  - Langkah 5: tab kedua menampilkan "Kunjungan ini sudah berstatus dilewati, jadi tidak bisa dilewati.".
  - Langkah 6: hari kerja ke-3 dan ke-4 berstatus `dilewati`, dan ada dua baris laporan `lewati` dengan status `menunggu` dan `tanggal_pengganti` kosong.
- **Keadaan gagal yang dicek:**
  - Alasan kosong, batal di dialog konfirmasi, dan kunjungan yang sudah dilewati di tab lain.
  - Admin tidak bisa memakai aksi ini: tidak ada langganan, jadi muncul "Laporan hanya untuk pelanggan dengan langganan aktif. Muat ulang halaman.".
- **Hasil uji terakhir:** belum diuji

## KJG-24: Batas H-1 pukul 17.00 dicek di server

- **Kode tugas:** 2.4
- **Peran:** pelanggan
- **Persiapan data:** skrip "Data uji tracker" sudah dijalankan. Catat id kunjungan riwayat yang berstatus `dijadwalkan` dan yang berstatus `diambil` dari query tanggal.
- **Langkah:**
  1. Di tab **Minta lewati**, pilih kunjungan apa saja dan isi alasan. Di DevTools, ubah `value` opsi yang terpilih menjadi id kunjungan riwayat `dijadwalkan`, lalu kirim dan pilih OK.
  2. Ulangi dengan id kunjungan hari ini, jika hari ini hari kerja.
  3. Ulangi dengan id kunjungan riwayat `diambil`.
  4. (Jika hari kerja ke-1 adalah besok) buka tracker sebelum pukul 17.00 WIB dan sesudahnya.
- **Hasil yang diharapkan:**
  - Langkah 1 dan 2: "Batas meminta lewati untuk kunjungan ini sudah lewat (H-1 pukul 17.00 WIB)." Status kunjungannya tetap `dijadwalkan`.
  - Langkah 3: "Kunjungan ini sudah berstatus diambil, jadi tidak bisa dilewati.".
  - Langkah 4: sebelum pukul 17.00, hari kerja ke-1 ada di pilihan dengan "Batas permintaan: <hari ini> pukul 17.00 WIB.". Setelah pukul 17.00 dan halaman dimuat ulang, opsinya hilang. Batas tepatnya diuji di KJG-10.
- **Keadaan gagal yang dicek:** permintaan setelah batas dan permintaan untuk kunjungan yang bukan `dijadwalkan` ditolak server, bukan hanya disembunyikan dari pilihan.
- **Hasil uji terakhir:** belum diuji

## KJG-25: Pelanggan meminta lewati dengan tanggal pengganti

- **Kode tugas:** 2.4
- **Peran:** pelanggan (langkah 7 meniru admin 2.6 lewat SQL)
- **Persiapan data:** skrip "Data uji tracker" sudah dijalankan. Langkah di bawah memakai hari kerja ke-2 sebagai kunjungan yang dilewati.
- **Langkah:**
  1. Di tab **Minta lewati**, pilih hari kerja ke-2, isi alasan, lalu pilih **Minta tanggal pengganti**.
  2. Kirim berturut-turut dengan tanggal pengganti berikut. Ketik tanggalnya jika pemilih tanggal menolak:
     - kosong;
     - Sabtu sesudah hari kerja ke-2;
     - tanggal hari kerja ke-2 itu sendiri;
     - hari kerja ke-6 (Libur uji 2.4);
     - hari kerja ke-4.
  3. Kirim dengan tanggal hari kerja ke-5.
  4. Lihat kartu **Permintaan saya** dan **Jadwal mendatang**.
  5. Jalankan query laporan di KJG-22 langkah 5.
  6. Pilih **Lewati saja** lagi di form, lalu pastikan isian tanggal hilang.
  7. Tiru persetujuan admin (tugas 2.6) dengan SQL ini, lalu muat ulang `/tracker`:

     ```sql
     -- Meniru 2.6: admin menyetujui tanggal pengganti dan menanggapi laporan lewati terakhir.
     WITH lap AS (
       SELECT l.id_laporan, l.kunjungan_id, l.tanggal_pengganti, k.id_user, k.pengajuan_id
       FROM laporan_kendala l
       JOIN kunjungan_pengambilan k ON k.id_kunjungan = l.kunjungan_id
       JOIN users u ON u.id_user = l.id_user
       WHERE u.email = 'email-akun-uji@contoh.com' AND l.jenis = 'lewati' AND l.tanggal_pengganti IS NOT NULL
       ORDER BY l.id_laporan DESC
       LIMIT 1
     ), pengganti AS (
       INSERT INTO kunjungan_pengambilan (id_user, pengajuan_id, tanggal, jam_mulai, jam_selesai, pengganti_dari)
       SELECT id_user, pengajuan_id, tanggal_pengganti, '08:00', '10:00', kunjungan_id FROM lap
       RETURNING id_kunjungan
     )
     UPDATE laporan_kendala
     SET status = 'ditanggapi', tanggapan_admin = 'Disetujui. Kami ambil di tanggal pengganti.'
     WHERE id_laporan = (SELECT id_laporan FROM lap);
     ```

  8. Hapus semua data uji tracker:

     ```sql
     DELETE FROM laporan_kendala WHERE id_user IN (SELECT id_user FROM users WHERE email = 'email-akun-uji@contoh.com');
     DELETE FROM kunjungan_pengambilan WHERE id_user IN (SELECT id_user FROM users WHERE email = 'email-akun-uji@contoh.com');
     DELETE FROM perubahan_jadwal WHERE alasan = 'Uji 2.4: rute kurir berubah';
     DELETE FROM data_langganan WHERE id_user IN (SELECT id_user FROM users WHERE email = 'email-akun-uji@contoh.com');
     DELETE FROM pengajuan_langganan WHERE nama_instansi = 'Uji 2.4'
       AND id_user IN (SELECT id_user FROM users WHERE email = 'email-akun-uji@contoh.com');
     DELETE FROM hari_libur WHERE keterangan = 'Libur uji 2.4';
     ```

- **Hasil yang diharapkan:**
  - Langkah 1: isian **Usulan tanggal pengganti** muncul, dengan keterangan "Hari kerja, bukan hari libur, setelah tanggal yang dilewati, dan belum ada kunjungan di tanggal itu.".
  - Langkah 2: hari kerja ke-2 tetap `dijadwalkan`. Setiap kiriman menampilkan "Periksa kembali isian yang ditandai.", dengan pesan di bawah isian tanggal berturut-turut:
    - "Tanggal pengganti wajib diisi.";
    - "Tanggal pengganti harus hari kerja (Senin–Jumat).";
    - "Tanggal pengganti harus setelah tanggal yang dilewati.";
    - "Tanggal itu hari libur (Libur uji 2.4).";
    - "Anda sudah punya kunjungan di tanggal itu.".
  - Langkah 3: "Kunjungan dilewati. Tanggal pengganti menunggu persetujuan admin.".
  - Langkah 4: di **Permintaan saya** muncul "Usulan tanggal pengganti: <hari kerja ke-5>" dan "Kunjungan sudah dilewati. Tanggal pengganti menunggu persetujuan admin.". Hari kerja ke-2 berbadge "Dilewati".
  - Langkah 5: ada baris `lewati`, `menunggu`, dengan `tanggal_pengganti` = hari kerja ke-5.
  - Langkah 7:
    - Laporan itu berbadge "Sudah ditanggapi", dengan "Tanggal pengganti dari admin: <hari kerja ke-5>" dan kotak "Tanggapan admin" berisi teks dari SQL.
    - Di **Jadwal mendatang** muncul hari kerja ke-5 dengan keterangan "Kunjungan pengganti".
  - Langkah 8: query tanggal di "Data uji tracker" tidak menghasilkan baris, dan `/tracker` kembali menampilkan "Tracker belum tersedia".
- **Keadaan gagal yang dicek:** tanggal pengganti kosong, akhir pekan, tidak setelah tanggal yang dilewati, hari libur, dan sudah ada kunjungan.
- **Hasil uji terakhir:** belum diuji

## KJG-26: Menu Tracker di header

- **Kode tugas:** 2.4
- **Peran:** publik dan pelanggan
- **Persiapan data:** satu akun user (langganan aktif tidak wajib).
- **Langkah:**
  1. Dalam keadaan logout, lihat menu header.
  2. Login, lalu buka `/tracker` dan halaman lain.
  3. Di DevTools (mode responsif), ubah lebar layar menjadi 320, 375, 768, 1024, dan 1440 px.
- **Hasil yang diharapkan:**
  - Langkah 1: menu **Tracker** tidak tampil.
  - Langkah 2: menu urut Beranda, Tentang Kami, Langganan, Tracker, Daftar Event, Toko, lalu avatar. Di `/tracker`, menu Tracker berwarna tema dengan garis bawah. Di halaman lain tidak.
  - Langkah 3:
    - 1024 dan 1440 px: logo dan semua menu dalam satu baris.
    - 768 px: menu satu baris di bawah logo.
    - 320 dan 375 px: menu terbagi beberapa baris.
    - Tidak ada menu yang saling menimpa atau terpotong.
- **Keadaan gagal yang dicek:** layar sempit.
- **Hasil uji terakhir:** belum diuji
