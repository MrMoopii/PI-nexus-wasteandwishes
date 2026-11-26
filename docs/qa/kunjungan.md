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
- **Hasil uji terakhir:** belum diuji
