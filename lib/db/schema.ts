import {
  date,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Data akun pengguna. Kata sandi disimpan sebagai hash, bukan teks biasa.
export const users = pgTable(
  "users",
  {
    idUser: integer("id_user").primaryKey().generatedAlwaysAsIdentity(),
    username: text("username"),
    namaPelanggan: text("nama_pelanggan"),
    peran: text("peran").notNull().default("user"),
    password: text("password"),
    email: text("email").notNull(),
    nomorTelp: text("nomor_telp"),
    alamat: text("alamat"),
    tanggalLahir: date("tanggal_lahir"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    uniqueIndex("users_email_unique").on(table.email),
  ],
);

export const dataLangganan = pgTable("data_langganan", {
  idLangganan: integer("id_langganan").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("id_user")
    .notNull()
    .unique()
    .references(() => users.idUser),
  statusLangganan: text("status_langganan").notNull(),
  tanggalMulaiLangganan: date("tanggal_mulai_langganan"),
  tanggalAkhirLangganan: date("tanggal_akhir_langganan"),
});

export const pembayaranLangganan = pgTable(
  "pembayaran_langganan",
  {
    idPembayaranLangganan: integer("id_pembayaran_langganan")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    langgananId: integer("langganan_id")
      .notNull()
      .references(() => dataLangganan.idLangganan),
    orderId: text("order_id").notNull().unique(),
    midtransTransactionId: text("midtrans_transaction_id"),
    jumlah: numeric("jumlah", { precision: 12, scale: 2 }).notNull(),
    statusPembayaran: text("status_pembayaran").notNull(),
    tanggalDibuat: timestamp("tanggal_dibuat", { withTimezone: true })
      .notNull()
      .defaultNow(),
    tanggalDibayar: timestamp("tanggal_dibayar", { withTimezone: true }),
  },
);

export const jadwal = pgTable("jadwal", {
  idJadwal: integer("id_jadwal").primaryKey().generatedAlwaysAsIdentity(),
  langgananId: integer("langganan_id")
    .notNull()
    .references(() => dataLangganan.idLangganan),
  hariPengambilan: text("hari_pengambilan").notNull(),
  jamPengambilan: time("jam_pengambilan").notNull(),
  jenisJadwal: text("jenis_jadwal").notNull(),
});

export const jadwalJanjian = pgTable("jadwal_janjian", {
  jadwalId: integer("jadwal_id")
    .primaryKey()
    .references(() => jadwal.idJadwal),
  tanggalJanjian: date("tanggal_janjian"),
  keteranganTujuan: text("keterangan_tujuan").notNull(),
  statusKonfirmasi: text("status_konfirmasi").notNull(),
});

export const jadwalRutin = pgTable("jadwal_rutin", {
  jadwalId: integer("jadwal_id")
    .primaryKey()
    .references(() => jadwal.idJadwal),
  tanggalMulai: date("tanggal_mulai").notNull(),
  tanggalSelesai: date("tanggal_selesai").notNull(),
});

export const riwayatPengambilan = pgTable("riwayat_pengambilan", {
  idRiwayat: integer("id_riwayat").primaryKey().generatedAlwaysAsIdentity(),
  jadwalId: integer("jadwal_id")
    .notNull()
    .references(() => jadwal.idJadwal),
  tanggalPengambilan: timestamp("tanggal_pengambilan", {
    withTimezone: true,
  }).notNull(),
  fotoBuktiPengambilan: text("foto_bukti_pengambilan"),
  bobotSampah: numeric("bobot_sampah", { precision: 10, scale: 2 }).notNull(),
});

export * from "./schema-langganan";
export * from "./schema-kunjungan";
export * from "./schema-event";
export * from "./schema-toko";
