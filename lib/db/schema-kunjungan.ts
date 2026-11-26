import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./schema";
import { pengajuanLangganan } from "./schema-langganan";

/** Tabel Tahap 2: hari libur, kunjungan pengambilan, laporan kendala, dan riwayat
    perubahan pola jadwal (kode tugas 2.1). Dipisah dari schema.ts supaya file itu tidak
    bertambah panjang (CONTRIBUTING 4.2 no. 9), lalu diekspor ulang dari schema.ts.

    Daftar nilai di setiap CHECK status/jenis/aturan HARUS sama dengan daftarnya di
    features/kunjungan/types.ts. lib/ tidak boleh mengimpor dari features/ (4.2 no. 6),
    jadi daftarnya ditulis dua kali. Mengubah daftar berarti migrasi baru.

    CHECK di Postgres lolos jika hasilnya NULL. Itu sengaja untuk kolom angka yang boleh
    kosong (>= 0), tetapi syarat yang mewajibkan isian selalu menyebut IS NULL /
    IS NOT NULL secara eksplisit (pelajaran dari 0.2).

    Foreign key ditulis dengan foreignKey() bernama, karena nama otomatis yang lebih dari
    63 karakter diganti nama acak oleh drizzle-kit, dan karena tiga di antaranya gabungan
    (pemilik data harus sama dengan pemilik baris yang dirujuk).
*/

/** Hari libur yang memengaruhi pembuatan kunjungan (2.2). Satu baris per tanggal. */
export const hariLibur = pgTable(
  "hari_libur",
  {
    idHariLibur: integer("id_hari_libur")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    tanggal: date("tanggal").notNull(),
    keterangan: text("keterangan").notNull(),
    // geser: pindah ke hari kerja berikutnya yang bukan libur; lewati: tidak diambil.
    aturan: text("aturan").notNull().default("geser"),
  },
  (table) => [
    uniqueIndex("hari_libur_tanggal_unique").on(table.tanggal),
    check(
      "hari_libur_aturan_valid",
      sql`${table.aturan} IN ('geser', 'lewati')`,
    ),
  ],
);

/** Satu kunjungan pengambilan untuk satu pelanggan pada satu tanggal. */
export const kunjunganPengambilan = pgTable(
  "kunjungan_pengambilan",
  {
    idKunjungan: integer("id_kunjungan")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    idUser: integer("id_user").notNull(),
    // Wajib: data lama riwayat_pengambilan tidak dipindahkan (keputusan 2.1).
    // Harus pengajuan milik id_user yang sama (foreign key gabungan di bawah).
    pengajuanId: integer("pengajuan_id").notNull(),
    tanggal: date("tanggal").notNull(),
    // Jam kosong berarti "Jam menyesuaikan WW", sama dengan pengajuan_langganan.
    jamMulai: time("jam_mulai"),
    jamSelesai: time("jam_selesai"),
    status: text("status").notNull().default("dijadwalkan"),
    jumlahEmber: integer("jumlah_ember"),
    beratKg: numeric("berat_kg", { precision: 10, scale: 2 }),
    fotoBukti: text("foto_bukti"),
    // fileId ImageKit, dibutuhkan deleteImageKitFile() saat foto diganti atau dihapus.
    fotoBuktiFileId: text("foto_bukti_file_id"),
    catatan: text("catatan"),
    alasanKendala: text("alasan_kendala"),
    tanggalPalingLambat: date("tanggal_paling_lambat"),
    // Kunjungan asal yang digantikan baris ini (lewati dengan tanggal pengganti).
    penggantiDari: integer("pengganti_dari"),
    dicatatOleh: integer("dicatat_oleh"),
    ditimbangPada: timestamp("ditimbang_pada", { withTimezone: true }),
    dibuatPada: timestamp("dibuat_pada", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Satu kunjungan per pelanggan per tanggal, termasuk baris batal dan dilewati.
    // Membuat ulang jadwal (2.2, 2.7) memperbarui baris yang ada lewat ON CONFLICT.
    uniqueIndex("kunjungan_pengambilan_user_tanggal_unique").on(
      table.idUser,
      table.tanggal,
    ),
    // Target foreign key gabungan di bawah: memastikan kunjungan pengganti dan
    // laporan kendala milik pelanggan yang sama dengan kunjungan yang dirujuk.
    unique("kunjungan_pengambilan_kunjungan_user_unique").on(
      table.idKunjungan,
      table.idUser,
    ),
    index("kunjungan_pengambilan_tanggal_idx").on(table.tanggal),
    check(
      "kunjungan_pengambilan_status_valid",
      sql`${table.status} IN ('dijadwalkan', 'diambil', 'ditimbang', 'tertunda', 'batal', 'dilewati')`,
    ),
    // Jam diisi berpasangan, dan jam selesai setelah jam mulai.
    check(
      "kunjungan_pengambilan_rentang_jam_valid",
      sql`(${table.jamMulai} IS NULL AND ${table.jamSelesai} IS NULL) OR (${table.jamMulai} IS NOT NULL AND ${table.jamSelesai} IS NOT NULL AND ${table.jamMulai} < ${table.jamSelesai})`,
    ),
    check(
      "kunjungan_pengambilan_jumlah_ember_tidak_negatif",
      sql`${table.jumlahEmber} >= 0`,
    ),
    check(
      "kunjungan_pengambilan_berat_kg_tidak_negatif",
      sql`${table.beratKg} >= 0`,
    ),
    // Sabtu dan Minggu tidak ada pengambilan (ISODOW: Senin = 1, Minggu = 7).
    check(
      "kunjungan_pengambilan_tanggal_hari_kerja",
      sql`EXTRACT(ISODOW FROM ${table.tanggal}) BETWEEN 1 AND 5`,
    ),
    // Admin menandai tertunda dengan alasan dan tanggal paling lambat.
    check(
      "kunjungan_pengambilan_tertunda_lengkap",
      sql`${table.status} <> 'tertunda' OR (${table.alasanKendala} IS NOT NULL AND ${table.tanggalPalingLambat} IS NOT NULL)`,
    ),
    check(
      "kunjungan_pengambilan_tanggal_paling_lambat_valid",
      sql`${table.tanggalPalingLambat} IS NULL OR ${table.tanggalPalingLambat} >= ${table.tanggal}`,
    ),
    // Pencatatan dua langkah: jumlah ember saat diambil, lalu berat setelah ditimbang.
    check(
      "kunjungan_pengambilan_ember_tercatat",
      sql`${table.status} NOT IN ('diambil', 'ditimbang') OR ${table.jumlahEmber} IS NOT NULL`,
    ),
    check(
      "kunjungan_pengambilan_timbang_lengkap",
      sql`${table.status} <> 'ditimbang' OR (${table.beratKg} IS NOT NULL AND ${table.ditimbangPada} IS NOT NULL)`,
    ),
    // URL foto dan fileId ImageKit selalu diisi atau dikosongkan bersama.
    check(
      "kunjungan_pengambilan_foto_berpasangan",
      sql`(${table.fotoBukti} IS NULL AND ${table.fotoBuktiFileId} IS NULL) OR (${table.fotoBukti} IS NOT NULL AND ${table.fotoBuktiFileId} IS NOT NULL)`,
    ),
    // Gabungan: pengajuan harus milik pelanggan yang sama. Sekaligus menjaga id_user
    // ke users, karena pengajuan_langganan.id_user merujuk users.
    foreignKey({
      name: "kunjungan_pengambilan_pengajuan_user_fkey",
      columns: [table.pengajuanId, table.idUser],
      foreignColumns: [
        pengajuanLangganan.idPengajuan,
        pengajuanLangganan.idUser,
      ],
    }),
    // Gabungan: kunjungan asal harus milik pelanggan yang sama. Dilewati jika kosong.
    foreignKey({
      name: "kunjungan_pengambilan_pengganti_dari_fkey",
      columns: [table.penggantiDari, table.idUser],
      foreignColumns: [table.idKunjungan, table.idUser],
    }),
    foreignKey({
      name: "kunjungan_pengambilan_dicatat_oleh_fkey",
      columns: [table.dicatatOleh],
      foreignColumns: [users.idUser],
    }),
  ],
);

/** Laporan dari pelanggan untuk satu kunjungan: kendala, atau permintaan dilewati. */
export const laporanKendala = pgTable(
  "laporan_kendala",
  {
    idLaporan: integer("id_laporan").primaryKey().generatedAlwaysAsIdentity(),
    idUser: integer("id_user").notNull(),
    kunjunganId: integer("kunjungan_id").notNull(),
    jenis: text("jenis").notNull(),
    // Alasan atau isi kendala, wajib supaya admin tahu kenapa.
    pesan: text("pesan").notNull(),
    // Usulan pelanggan. Tanggal yang disetujui admin ada di kunjungan pengganti.
    tanggalPengganti: date("tanggal_pengganti"),
    // menunggu sampai admin membaca, termasuk lewati yang langsung berlaku.
    status: text("status").notNull().default("menunggu"),
    tanggapanAdmin: text("tanggapan_admin"),
    dibuatPada: timestamp("dibuat_pada", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("laporan_kendala_kunjungan_id_idx").on(table.kunjunganId),
    check(
      "laporan_kendala_jenis_valid",
      sql`${table.jenis} IN ('kendala', 'lewati')`,
    ),
    check(
      "laporan_kendala_status_valid",
      sql`${table.status} IN ('menunggu', 'ditanggapi')`,
    ),
    check(
      "laporan_kendala_pesan_tidak_kosong",
      sql`btrim(${table.pesan}) <> ''`,
    ),
    check(
      "laporan_kendala_tanggal_pengganti_hanya_lewati",
      sql`${table.tanggalPengganti} IS NULL OR ${table.jenis} = 'lewati'`,
    ),
    // Gabungan: kunjungan yang dilaporkan harus milik pelapor. id_user ikut terjaga
    // ke users lewat kunjungan_pengambilan.
    foreignKey({
      name: "laporan_kendala_kunjungan_user_fkey",
      columns: [table.kunjunganId, table.idUser],
      foreignColumns: [
        kunjunganPengambilan.idKunjungan,
        kunjunganPengambilan.idUser,
      ],
    }),
  ],
);

/** Riwayat perubahan pola jadwal oleh admin (2.7), sekaligus sumber pemberitahuan tracker. */
export const perubahanJadwal = pgTable(
  "perubahan_jadwal",
  {
    idPerubahan: integer("id_perubahan")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    pengajuanId: integer("pengajuan_id").notNull(),
    hariPengambilan: integer("hari_pengambilan").array().notNull(),
    jamMulai: time("jam_mulai"),
    jamSelesai: time("jam_selesai"),
    berlakuMulai: date("berlaku_mulai").notNull(),
    alasan: text("alasan").notNull(),
    diubahOleh: integer("diubah_oleh").notNull(),
    dibuatPada: timestamp("dibuat_pada", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("perubahan_jadwal_pengajuan_id_idx").on(table.pengajuanId),
    // Sama dengan pengajuan_langganan: minimal satu hari, setiap hari Senin–Jumat.
    check(
      "perubahan_jadwal_hari_valid",
      sql`cardinality(${table.hariPengambilan}) > 0 AND ${table.hariPengambilan} <@ ARRAY[1, 2, 3, 4, 5]`,
    ),
    check(
      "perubahan_jadwal_rentang_jam_valid",
      sql`(${table.jamMulai} IS NULL AND ${table.jamSelesai} IS NULL) OR (${table.jamMulai} IS NOT NULL AND ${table.jamSelesai} IS NOT NULL AND ${table.jamMulai} < ${table.jamSelesai})`,
    ),
    foreignKey({
      name: "perubahan_jadwal_pengajuan_id_fkey",
      columns: [table.pengajuanId],
      foreignColumns: [pengajuanLangganan.idPengajuan],
    }),
    foreignKey({
      name: "perubahan_jadwal_diubah_oleh_fkey",
      columns: [table.diubahOleh],
      foreignColumns: [users.idUser],
    }),
  ],
);
