import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./schema";

/** Tabel alur pengajuan langganan baru (kode tugas 0.2).
    Dipisah dari schema.ts supaya file itu tidak bertambah panjang (CONTRIBUTING 4.2 no. 9),
    lalu diekspor ulang dari schema.ts sehingga impor tetap dari "@/lib/db/schema".

    Daftar status di CHECK di bawah HARUS sama dengan STATUS_PENGAJUAN di
    features/langganan/types.ts. lib/ tidak boleh mengimpor dari features/ (4.2 no. 6),
    jadi daftarnya ditulis dua kali. Mengubah daftar berarti migrasi baru.

    diperbarui_pada tidak diisi otomatis: setiap UPDATE (termasuk WITH … UPDATE lewat sql)
    wajib menulis diperbarui_pada = now() sendiri. 
*/

/** Pengajuan langganan dari pelanggan, beserta syarat yang ditetapkan admin. */
export const pengajuanLangganan = pgTable(
  "pengajuan_langganan",
  {
    idPengajuan: integer("id_pengajuan")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    idUser: integer("id_user")
      .notNull()
      .references(() => users.idUser),

    namaInstansi: text("nama_instansi").notNull(),
    jenisInstansi: text("jenis_instansi").notNull(),
    jenisInstansiLain: text("jenis_instansi_lain"),
    alamatPengambilan: text("alamat_pengambilan").notNull(),
    namaPic: text("nama_pic").notNull(),
    telpPic: text("telp_pic").notNull(),
    jenisLimbah: text("jenis_limbah"),
    estimasiEmber: integer("estimasi_ember").notNull(),
    catatanPelanggan: text("catatan_pelanggan"),
    jenisPelanggan: text("jenis_pelanggan"),
    hariPengambilan: integer("hari_pengambilan").array(),
    jamMulai: time("jam_mulai"),
    jamSelesai: time("jam_selesai"),
    jumlahEmber: integer("jumlah_ember"),
    hargaFinal: numeric("harga_final", { precision: 12, scale: 2 }),
    alasanDitolak: text("alasan_ditolak"),
    status: text("status").notNull().default("menunggu_review"),
    dibuatPada: timestamp("dibuat_pada", { withTimezone: true })
      .notNull()
      .defaultNow(),
    diperbaruiPada: timestamp("diperbarui_pada", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Satu pengajuan berjalan per akun. Status di luar daftar ditolak CHECK di bawah,
    // supaya salah ketik (misalnya 'Ditolak') tidak ikut terhitung berjalan.
    uniqueIndex("pengajuan_langganan_satu_berjalan_per_user")
      .on(table.idUser)
      .where(sql`${table.status} NOT IN ('ditolak', 'dibatalkan')`),
    check(
      "pengajuan_langganan_status_valid",
      sql`${table.status} IN ('menunggu_review', 'ditawarkan', 'negosiasi', 'disetujui_pelanggan', 'siap_bayar', 'ditolak', 'dibatalkan')`,
    ),
    check(
      "pengajuan_langganan_estimasi_ember_positif",
      sql`${table.estimasiEmber} > 0`,
    ),
    check(
      "pengajuan_langganan_jumlah_ember_positif",
      sql`${table.jumlahEmber} > 0`,
    ),
    check(
      "pengajuan_langganan_harga_final_positif",
      sql`${table.hargaFinal} > 0`,
    ),
    // Minimal satu hari, dan setiap hari di rentang Senin–Jumat.
    check(
      "pengajuan_langganan_hari_valid",
      sql`cardinality(${table.hariPengambilan}) > 0 AND ${table.hariPengambilan} <@ ARRAY[1, 2, 3, 4, 5]`,
    ),
    // Jam diisi berpasangan, dan jam selesai setelah jam mulai.
    check(
      "pengajuan_langganan_rentang_jam_valid",
      sql`(${table.jamMulai} IS NULL AND ${table.jamSelesai} IS NULL) OR (${table.jamMulai} IS NOT NULL AND ${table.jamSelesai} IS NOT NULL AND ${table.jamMulai} < ${table.jamSelesai})`,
    ),
  ],
);

/** Riwayat pesan dan harga usulan dalam negosiasi satu pengajuan. */
export const pesanNegosiasi = pgTable(
  "pesan_negosiasi",
  {
    idPesan: integer("id_pesan").primaryKey().generatedAlwaysAsIdentity(),
    pengajuanId: integer("pengajuan_id")
      .notNull()
      .references(() => pengajuanLangganan.idPengajuan),
    pengirim: text("pengirim").notNull(),
    idPengirim: integer("id_pengirim")
      .notNull()
      .references(() => users.idUser),
    hargaUsulan: numeric("harga_usulan", { precision: 12, scale: 2 }),
    pesan: text("pesan"),
    dibuatPada: timestamp("dibuat_pada", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pesan_negosiasi_pengajuan_id_idx").on(table.pengajuanId),
    check(
      "pesan_negosiasi_harga_usulan_positif",
      sql`${table.hargaUsulan} > 0`,
    ),
  ],
);
