import {
  date,
  integer,
  numeric,
  pgTable,
  primaryKey,
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
    username: text("username").notNull(),
    namaPelanggan: text("nama_pelanggan").notNull(),
    peran: text("peran").notNull().default("user"),
    passwordHash: text("password_hash").notNull(),
    email: text("email").notNull(),
    nomorTelp: text("nomor_telp").notNull(),
    alamat: text("alamat").notNull(),
    tanggalLahir: date("tanggal_lahir").notNull(),
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

export const events = pgTable("events", {
  idEvent: integer("id_event").primaryKey().generatedAlwaysAsIdentity(),
  namaEvent: text("nama_event").notNull(),
  jenisEvent: text("jenis_event").notNull(),
  tanggalPelaksanaan: date("tanggal_pelaksanaan").notNull(),
  biayaEvent: numeric("biaya_event", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const pendaftaranEvent = pgTable(
  "pendaftaran_event",
  {
    idPendaftaran: integer("id_pendaftaran").primaryKey().generatedAlwaysAsIdentity(),
    eventId: integer("event_id").notNull().references(() => events.idEvent),
    userId: integer("user_id").notNull().references(() => users.idUser),
    tanggalDaftar: timestamp("tanggal_daftar", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("pendaftaran_event_event_user_unique").on(table.eventId, table.userId)],
);

export const produk = pgTable("produk", {
  idProduk: integer("id_produk").primaryKey().generatedAlwaysAsIdentity(),
  namaProduk: text("nama_produk").notNull(),
  jenisProduk: text("jenis_produk").notNull(),
  hargaProduk: numeric("harga_produk", { precision: 12, scale: 2 }).notNull(),
  jumlahStok: integer("jumlah_stok").notNull().default(0),
});

export const transaksi = pgTable("transaksi", {
  idTransaksi: integer("id_transaksi").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.idUser),
  tanggalTransaksi: timestamp("tanggal_transaksi", { withTimezone: true }).notNull().defaultNow(),
  metodePembayaran: text("metode_pembayaran").notNull(),
});

export const detailTransaksi = pgTable(
  "detail_transaksi",
  {
    idDetailTransaksi: integer("id_detail_transaksi").primaryKey().generatedAlwaysAsIdentity(),
    transaksiId: integer("transaksi_id").notNull().references(() => transaksi.idTransaksi),
    produkId: integer("produk_id").notNull().references(() => produk.idProduk),
    jumlahProduk: integer("jumlah_produk").notNull(),
  },
  (table) => [uniqueIndex("detail_transaksi_transaksi_produk_unique").on(table.transaksiId, table.produkId)],
);

export const keranjang = pgTable(
  "keranjang",
  {
    idKeranjang: integer("id_keranjang").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").notNull().unique().references(() => users.idUser),
  },
);

export const detailKeranjang = pgTable(
  "detail_keranjang",
  {
    keranjangId: integer("keranjang_id").notNull().references(() => keranjang.idKeranjang),
    produkId: integer("produk_id").notNull().references(() => produk.idProduk),
    jumlahProduk: integer("jumlah_produk").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.keranjangId, table.produkId] })],
);

export const dataLangganan = pgTable("data_langganan", {
  idLangganan: integer("id_langganan").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().unique().references(() => users.idUser),
  statusLangganan: text("status_langganan").notNull(),
});

export const jadwal = pgTable("jadwal", {
  idJadwal: integer("id_jadwal").primaryKey().generatedAlwaysAsIdentity(),
  langgananId: integer("langganan_id").notNull().references(() => dataLangganan.idLangganan),
  hariPengambilan: text("hari_pengambilan").notNull(),
  jamPengambilan: time("jam_pengambilan").notNull(),
  jenisJadwal: text("jenis_jadwal").notNull(),
});

export const jadwalJanjian = pgTable("jadwal_janjian", {
  jadwalId: integer("jadwal_id").primaryKey().references(() => jadwal.idJadwal),
  keteranganTujuan: text("keterangan_tujuan").notNull(),
  statusKonfirmasi: text("status_konfirmasi").notNull(),
});

export const jadwalRutin = pgTable("jadwal_rutin", {
  jadwalId: integer("jadwal_id").primaryKey().references(() => jadwal.idJadwal),
  tanggalMulai: date("tanggal_mulai").notNull(),
  tanggalSelesai: date("tanggal_selesai").notNull(),
});

export const riwayatPengambilan = pgTable("riwayat_pengambilan", {
  idRiwayat: integer("id_riwayat").primaryKey().generatedAlwaysAsIdentity(),
  jadwalId: integer("jadwal_id").notNull().references(() => jadwal.idJadwal),
  tanggalPengambilan: timestamp("tanggal_pengambilan", { withTimezone: true }).notNull(),
  fotoBuktiPengambilan: text("foto_bukti_pengambilan"),
  bobotSampah: numeric("bobot_sampah", { precision: 10, scale: 2 }).notNull(),
});