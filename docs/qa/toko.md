# Skenario uji: toko

Nomor `TKO-01` sampai `TKO-09` disediakan untuk skema tabel toko dan toko mitra (kode tugas 3.1). Skenario halaman dan aksi ditambahkan oleh kode tugas 3.4–3.10 di PR masing-masing.

Data uji diisi lewat SQL Editor Neon di branch `development` (`CONTRIBUTING.md` bagian 6.5).

## TKO-01: Constraint skema toko, toko mitra, dan permintaan produk

- **Kode tugas:** 3.1
- **Peran:** pemilik skema (SQL Editor Neon)
- **Persiapan data:** migrasi 3.1 sudah diterapkan dengan `pnpm db:migrate`. Skrip membuat data ujinya sendiri (satu akun, tiga produk, satu toko mitra, satu keranjang, satu transaksi dengan pembayarannya, satu permintaan), lalu membatalkan semuanya di akhir.
- **Langkah:**
  1. Buka SQL Editor Neon, pilih branch `development`.
  2. Tempel seluruh skrip di bawah, lalu jalankan sekali.
  3. Baca pesan di akhir.
  4. Jalankan `SELECT count(*) FROM users WHERE email LIKE 'uji-3-1-%@contoh.invalid';`.
- **Hasil yang diharapkan:**
  - Langkah 3: skrip berhenti dengan `ERROR: Uji skema 3.1 (toko) selesai: 35 lolos, 0 gagal.` Pesan ini **sengaja berupa error** supaya semua data uji dibatalkan. Jika ada yang gagal, nama kasusnya tertulis di bawah ringkasan, beserta constraint yang menolaknya atau keterangan lain.
  - Langkah 4: hasilnya `0`. Nomor identity tetap bertambah karena Postgres tidak membatalkan sequence. Itu wajar.
- **Keadaan gagal yang dicek:**
  - Koordinat toko di luar rentang (−90 sampai 90 dan −180 sampai 180), dengan nilai batas yang harus diterima.
  - Produk ganda di satu toko, atau toko dan produk yang tidak ada.
  - Cara beli di luar daftar atau berhuruf besar.
  - Stok minus saat produk dibuat dan karena pengurangan stok (pola checkout 3.8), dengan pengurangan sampai 0 yang harus diterima.
  - Produk yang sudah dibeli atau diminta tidak bisa dihapus.
  - Status transaksi dan status permintaan di luar daftar.
  - `order_id` ganda, dan pembayaran untuk transaksi yang tidak ada.
  - `jumlah_kg` 0, negatif, atau dibulatkan menjadi 0 (`0.004`), dengan `0.01` yang harus diterima.
  - Permintaan dari akun atau untuk produk yang tidak ada.
  - Nilai bawaan: cara beli `keranjang`, status transaksi `menunggu_bayar`, status permintaan `baru`, dan toko `aktif`.
  - Cascade: menghapus produk ikut menghapus foto, isi keranjang, dan `produk_toko`-nya; menghapus toko ikut menghapus `produk_toko`-nya.
- **Hasil uji terakhir:** 27 Nov 2026, MrMoopii, lolos (35 lolos, 0 gagal, branch Neon `development`)

Jika skrip berhenti dengan error lain sebelum ringkasan, ada dua kemungkinan. "relation … does not exist" atau "column … does not exist" berarti migrasi belum diterapkan. Nama constraint di pesan error berarti data uji sah di langkah 1 skrip ditolak, jadi constraint itu terlalu ketat.

```sql
-- TKO-01: uji constraint skema toko, toko mitra, dan permintaan produk (kode tugas 3.1).
DO $uji$
DECLARE
  akun integer;   -- akun uji
  pk integer;     -- produk keranjang, stok 5, sudah dibeli di transaksi trx
  pp integer;     -- produk permintaan, sudah diminta di permintaan minta
  ph integer;     -- produk yang dihapus di uji cascade
  toko integer;   -- toko mitra yang menjual pk dan ph
  krj integer;    -- keranjang akun uji, berisi ph
  trx integer;    -- transaksi akun uji
  minta integer;  -- permintaan produk akun uji
  kasus record;
  perintah text;
  nama_constraint text;
  lolos integer := 0;
  gagal integer := 0;
  rincian text := '';
BEGIN
  -- 1. Data uji sah. Kolom yang punya nilai bawaan sengaja tidak diisi, supaya bawaannya diuji di langkah 3.
  INSERT INTO users (email) VALUES ('uji-3-1-a@contoh.invalid') RETURNING id_user INTO akun;
  INSERT INTO produk (nama_produk, jenis_produk, harga_produk, jumlah_stok)
    VALUES ('Uji 3.1 Kompos', 'Kompos', 25000, 5) RETURNING id_produk INTO pk;
  INSERT INTO produk (nama_produk, jenis_produk, harga_produk, cara_beli)
    VALUES ('Uji 3.1 Pupuk basah', 'Pupuk', 5000, 'permintaan') RETURNING id_produk INTO pp;
  INSERT INTO produk (nama_produk, jenis_produk, harga_produk)
    VALUES ('Uji 3.1 Produk dihapus', 'Kompos', 10000) RETURNING id_produk INTO ph;
  INSERT INTO foto_produk (product_id, url, file_id) VALUES (ph, 'https://contoh.invalid/ph.jpg', 'file-uji-ph');
  INSERT INTO toko_mitra (nama_toko, alamat, latitude, longitude)
    VALUES ('Uji 3.1 Toko', 'Alamat uji', -7.782889, 110.367083) RETURNING id_toko INTO toko;
  INSERT INTO produk_toko (toko_id, produk_id) VALUES (toko, pk), (toko, ph);
  INSERT INTO keranjang (id_user) VALUES (akun) RETURNING id_keranjang INTO krj;
  INSERT INTO detail_keranjang (keranjang_id, produk_id) VALUES (krj, ph);
  INSERT INTO transaksi (id_user, metode_pembayaran, total_harga, nama_penerima, telp_penerima, alamat_pengiriman)
    VALUES (akun, 'midtrans', 50000, 'Penerima uji', '0800000001', 'Alamat uji') RETURNING id_transaksi INTO trx;
  INSERT INTO detail_transaksi (transaksi_id, produk_id, jumlah_produk, harga_beli) VALUES (trx, pk, 2, 25000);
  INSERT INTO pembayaran_toko (transaksi_id, order_id, jumlah, status_pembayaran, tanggal_kedaluwarsa)
    VALUES (trx, 'uji-3-1-order-1', 50000, 'pending', now() + interval '1 day');
  INSERT INTO permintaan_produk (id_user, produk_id, jumlah_kg, nama_pic, telp_pic, alamat_pengiriman)
    VALUES (akun, pp, 2.5, 'PIC uji', '0800000002', 'Alamat uji') RETURNING id_permintaan INTO minta;

  -- 2. Setiap kasus dijalankan di blok sendiri lalu dibatalkan, jadi kasus tidak saling memengaruhi.
  --    harapan = nama constraint yang harus menolak, atau NULL jika isian harus diterima.
  FOR kasus IN
    SELECT * FROM (VALUES
      ('M01 latitude di atas 90', $s$INSERT INTO toko_mitra (nama_toko, alamat, latitude, longitude) VALUES ('Uji 3.1 M01', 'Alamat', 90.000001, 110)$s$, 'toko_mitra_latitude_valid'),
      ('M02 latitude di bawah -90', $s$INSERT INTO toko_mitra (nama_toko, alamat, latitude, longitude) VALUES ('Uji 3.1 M02', 'Alamat', -90.5, 110)$s$, 'toko_mitra_latitude_valid'),
      ('M03 longitude di atas 180', $s$INSERT INTO toko_mitra (nama_toko, alamat, latitude, longitude) VALUES ('Uji 3.1 M03', 'Alamat', -7.5, 180.5)$s$, 'toko_mitra_longitude_valid'),
      ('M04 longitude di bawah -180', $s$INSERT INTO toko_mitra (nama_toko, alamat, latitude, longitude) VALUES ('Uji 3.1 M04', 'Alamat', -7.5, -180.000001)$s$, 'toko_mitra_longitude_valid'),
      ('M05 sah: batas -90 dan 180', $s$INSERT INTO toko_mitra (nama_toko, alamat, latitude, longitude) VALUES ('Uji 3.1 M05', 'Alamat', -90, 180)$s$, NULL),
      ('M06 sah: batas 90 dan -180', $s$INSERT INTO toko_mitra (nama_toko, alamat, latitude, longitude) VALUES ('Uji 3.1 M06', 'Alamat', 90, -180)$s$, NULL),
      ('G01 produk ganda di satu toko', $s$INSERT INTO produk_toko (toko_id, produk_id) VALUES ({toko}, {pk})$s$, 'produk_toko_pkey'),
      ('G02 toko tidak ada', $s$INSERT INTO produk_toko (toko_id, produk_id) VALUES (-1, {pk})$s$, 'produk_toko_toko_id_toko_mitra_id_toko_fkey'),
      ('G03 produk tidak ada', $s$INSERT INTO produk_toko (toko_id, produk_id) VALUES ({toko}, -1)$s$, 'produk_toko_produk_id_produk_id_produk_fkey'),
      ('G04 sah: produk lain di toko yang sama', $s$INSERT INTO produk_toko (toko_id, produk_id) VALUES ({toko}, {pp})$s$, NULL),
      ('P01 cara beli di luar daftar', $s$INSERT INTO produk (nama_produk, jenis_produk, harga_produk, cara_beli) VALUES ('Uji 3.1 P01', 'Kompos', 1000, 'grosir')$s$, 'produk_cara_beli_valid'),
      ('P02 cara beli berhuruf besar', $s$INSERT INTO produk (nama_produk, jenis_produk, harga_produk, cara_beli) VALUES ('Uji 3.1 P02', 'Kompos', 1000, 'Keranjang')$s$, 'produk_cara_beli_valid'),
      ('P03 stok minus saat produk dibuat', $s$INSERT INTO produk (nama_produk, jenis_produk, harga_produk, jumlah_stok) VALUES ('Uji 3.1 P03', 'Kompos', 1000, -1)$s$, 'produk_jumlah_stok_tidak_negatif'),
      ('P04 stok minus karena pengurangan', $s$UPDATE produk SET jumlah_stok = jumlah_stok - 6 WHERE id_produk = {pk}$s$, 'produk_jumlah_stok_tidak_negatif'),
      ('P05 sah: pengurangan sampai stok 0', $s$UPDATE produk SET jumlah_stok = jumlah_stok - 5 WHERE id_produk = {pk}$s$, NULL),
      ('H01 produk yang sudah dibeli tidak bisa dihapus', $s$DELETE FROM produk WHERE id_produk = {pk}$s$, 'detail_transaksi_produk_id_produk_id_produk_fkey'),
      ('H02 produk yang sudah diminta tidak bisa dihapus', $s$DELETE FROM produk WHERE id_produk = {pp}$s$, 'permintaan_produk_produk_id_produk_id_produk_fkey'),
      ('T01 status transaksi di luar daftar', $s$INSERT INTO transaksi (id_user, metode_pembayaran, total_harga, nama_penerima, telp_penerima, alamat_pengiriman, status) VALUES ({akun}, 'midtrans', 1000, 'Penerima', '0800', 'Alamat', 'lunas')$s$, 'transaksi_status_valid'),
      ('T02 sah: transaksi kedaluwarsa', $s$INSERT INTO transaksi (id_user, metode_pembayaran, total_harga, nama_penerima, telp_penerima, alamat_pengiriman, status) VALUES ({akun}, 'midtrans', 1000, 'Penerima', '0800', 'Alamat', 'kedaluwarsa')$s$, NULL),
      ('B01 order_id ganda', $s$INSERT INTO pembayaran_toko (transaksi_id, order_id, jumlah, status_pembayaran, tanggal_kedaluwarsa) VALUES ({trx}, 'uji-3-1-order-1', 50000, 'pending', now() + interval '1 day')$s$, 'pembayaran_toko_order_id_key'),
      ('B02 transaksi tidak ada', $s$INSERT INTO pembayaran_toko (transaksi_id, order_id, jumlah, status_pembayaran, tanggal_kedaluwarsa) VALUES (-1, 'uji-3-1-order-2', 50000, 'pending', now() + interval '1 day')$s$, 'pembayaran_toko_transaksi_id_transaksi_id_transaksi_fkey'),
      ('B03 sah: order_id lain', $s$INSERT INTO pembayaran_toko (transaksi_id, order_id, jumlah, status_pembayaran, tanggal_kedaluwarsa) VALUES ({trx}, 'uji-3-1-order-3', 50000, 'pending', now() + interval '1 day')$s$, NULL),
      ('R01 status permintaan di luar daftar', $s$INSERT INTO permintaan_produk (id_user, produk_id, jumlah_kg, nama_pic, telp_pic, alamat_pengiriman, status) VALUES ({akun}, {pp}, 1, 'PIC', '0800', 'Alamat', 'ditolak')$s$, 'permintaan_produk_status_valid'),
      ('R02 jumlah kg 0', $s$INSERT INTO permintaan_produk (id_user, produk_id, jumlah_kg, nama_pic, telp_pic, alamat_pengiriman) VALUES ({akun}, {pp}, 0, 'PIC', '0800', 'Alamat')$s$, 'permintaan_produk_jumlah_kg_positif'),
      ('R03 jumlah kg negatif', $s$INSERT INTO permintaan_produk (id_user, produk_id, jumlah_kg, nama_pic, telp_pic, alamat_pengiriman) VALUES ({akun}, {pp}, -1.5, 'PIC', '0800', 'Alamat')$s$, 'permintaan_produk_jumlah_kg_positif'),
      ('R04 jumlah kg dibulatkan menjadi 0', $s$INSERT INTO permintaan_produk (id_user, produk_id, jumlah_kg, nama_pic, telp_pic, alamat_pengiriman) VALUES ({akun}, {pp}, 0.004, 'PIC', '0800', 'Alamat')$s$, 'permintaan_produk_jumlah_kg_positif'),
      ('R05 akun tidak ada', $s$INSERT INTO permintaan_produk (id_user, produk_id, jumlah_kg, nama_pic, telp_pic, alamat_pengiriman) VALUES (-1, {pp}, 1, 'PIC', '0800', 'Alamat')$s$, 'permintaan_produk_id_user_users_id_user_fkey'),
      ('R06 produk tidak ada', $s$INSERT INTO permintaan_produk (id_user, produk_id, jumlah_kg, nama_pic, telp_pic, alamat_pengiriman) VALUES ({akun}, -1, 1, 'PIC', '0800', 'Alamat')$s$, 'permintaan_produk_produk_id_produk_id_produk_fkey'),
      ('R07 sah: 0,01 kg', $s$INSERT INTO permintaan_produk (id_user, produk_id, jumlah_kg, nama_pic, telp_pic, alamat_pengiriman) VALUES ({akun}, {pp}, 0.01, 'PIC', '0800', 'Alamat')$s$, NULL)
    ) AS t(kode, perintah, harapan)
  LOOP
    perintah := replace(replace(replace(replace(replace(kasus.perintah,
      '{akun}', akun::text), '{pk}', pk::text), '{pp}', pp::text),
      '{toko}', toko::text), '{trx}', trx::text);
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

  -- 3. Nilai bawaan dari data uji di langkah 1, yang sengaja tidak mengisi kolom itu.
  IF (SELECT cara_beli FROM produk WHERE id_produk = pk) = 'keranjang' THEN
    lolos := lolos + 1;
  ELSE
    gagal := gagal + 1;
    rincian := rincian || E'\n  GAGAL D01: cara_beli bawaan bukan keranjang';
  END IF;
  IF (SELECT status FROM transaksi WHERE id_transaksi = trx) = 'menunggu_bayar' THEN
    lolos := lolos + 1;
  ELSE
    gagal := gagal + 1;
    rincian := rincian || E'\n  GAGAL D02: status transaksi bawaan bukan menunggu_bayar';
  END IF;
  IF (SELECT status FROM permintaan_produk WHERE id_permintaan = minta) = 'baru' THEN
    lolos := lolos + 1;
  ELSE
    gagal := gagal + 1;
    rincian := rincian || E'\n  GAGAL D03: status permintaan bawaan bukan baru';
  END IF;
  IF (SELECT aktif FROM toko_mitra WHERE id_toko = toko) THEN
    lolos := lolos + 1;
  ELSE
    gagal := gagal + 1;
    rincian := rincian || E'\n  GAGAL D04: toko mitra baru tidak aktif';
  END IF;

  -- 4. Cascade, masing-masing di blok sendiri supaya error tidak menghentikan ringkasan.
  BEGIN
    DELETE FROM produk WHERE id_produk = ph;
    IF EXISTS (SELECT 1 FROM detail_keranjang WHERE produk_id = ph)
      OR EXISTS (SELECT 1 FROM produk_toko WHERE produk_id = ph)
      OR EXISTS (SELECT 1 FROM foto_produk WHERE product_id = ph) THEN
      gagal := gagal + 1;
      rincian := rincian || E'\n  GAGAL C01: isi keranjang, produk_toko, atau foto tertinggal setelah produk dihapus';
    ELSE
      lolos := lolos + 1;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    gagal := gagal + 1;
    rincian := rincian || E'\n  GAGAL C01: produk tidak bisa dihapus: ' || SQLERRM;
  END;
  BEGIN
    DELETE FROM toko_mitra WHERE id_toko = toko;
    IF EXISTS (SELECT 1 FROM produk_toko WHERE toko_id = toko) THEN
      gagal := gagal + 1;
      rincian := rincian || E'\n  GAGAL C02: produk_toko tertinggal setelah toko dihapus';
    ELSE
      lolos := lolos + 1;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    gagal := gagal + 1;
    rincian := rincian || E'\n  GAGAL C02: toko tidak bisa dihapus: ' || SQLERRM;
  END;

  -- 5. Ringkasan sengaja dikirim sebagai error supaya semua data uji di atas dibatalkan.
  RAISE EXCEPTION 'Uji skema 3.1 (toko) selesai: % lolos, % gagal.%', lolos, gagal, rincian;
END
$uji$;
```

## TKO-02: Admin menghapus produk yang ada di keranjang pelanggan

- **Kode tugas:** 3.1
- **Peran:** pelanggan dan admin
- **Persiapan data:** migrasi 3.1 sudah diterapkan. Siapkan satu akun `user` dan satu akun `admin` (`CONTRIBUTING.md` bagian 6.4). Admin membuat satu produk uji baru di `/admin/produk`, supaya produk itu belum punya transaksi atau permintaan.
- **Langkah:**
  1. Login sebagai `user`, buka `/toko`, masukkan produk uji ke keranjang, lalu buka `/toko/keranjang`.
  2. Di browser lain atau jendela private, login sebagai admin, buka `/admin/produk`, lalu hapus produk uji.
  3. Kembali ke akun `user`, lalu muat ulang `/toko/keranjang`.
  4. Di SQL Editor Neon, jalankan `SELECT count(*) FROM detail_keranjang WHERE produk_id = <id produk uji>;`.
- **Hasil yang diharapkan:**
  - Langkah 2: dialog tertutup dan produk hilang dari daftar admin. Sebelum 3.1, penghapusan ini gagal dengan pesan "Terjadi kesalahan. Silakan coba lagi." karena produk masih ada di keranjang pelanggan.
  - Langkah 3: produk uji tidak ada lagi di keranjang, dan halaman tidak error.
  - Langkah 4: hasilnya `0`.
- **Keadaan gagal yang dicek:** produk yang sudah punya transaksi atau permintaan tetap tidak bisa dihapus (kasus `H01` dan `H02` di `TKO-01`). Lewat halaman admin, penghapusan itu menampilkan "Terjadi kesalahan. Silakan coba lagi.", dan foto ImageKit produk itu sudah terlanjur terhapus karena `hapusProduk()` menghapus foto lebih dulu. Urutan itu diperbaiki di 3.6 (#175).
- **Hasil uji terakhir:** belum diuji
