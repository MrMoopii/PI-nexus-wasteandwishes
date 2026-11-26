import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./schema";

/** Tabel toko (kode tugas 3.1): produk, keranjang, transaksi toko online beserta
    pembayarannya, permintaan produk by request, dan toko mitra. Tabel yang sudah ada
    dipindah dari schema.ts supaya file itu tidak bertambah panjang (CONTRIBUTING 4.2
    no. 9), lalu diekspor ulang dari schema.ts. Pemindahan tidak mengubah database.

    Daftar nilai di CHECK cara beli dan status HARUS sama dengan daftarnya di
    features/toko/types.ts. lib/ tidak boleh mengimpor dari features/ (4.2 no. 6),
    jadi daftarnya ditulis dua kali. Mengubah daftar berarti migrasi baru.

    Kolom numeric dikembalikan Drizzle sebagai string (CONTRIBUTING 9.2).
    permintaan_produk.diperbarui_pada tidak diisi otomatis: setiap UPDATE wajib
    menulis diperbarui_pada = now() sendiri.
*/

/** Produk WW. cara_beli menentukan lewat keranjang (3.8) atau form permintaan (3.6). */
export const produk = pgTable(
  "produk",
  {
    idProduk: integer("id_produk").primaryKey().generatedAlwaysAsIdentity(),
    namaProduk: text("nama_produk").notNull(),
    jenisProduk: text("jenis_produk").notNull(),
    hargaProduk: numeric("harga_produk", { precision: 12, scale: 2 }).notNull(),
    jumlahStok: integer("jumlah_stok").notNull().default(0),
    deskripsi: text("deskripsi"),
    gambarUrl: text("gambar_url"),
    berat: text("berat"),
    statusProduk: text("status_produk").notNull().default("aktif"),
    caraBeli: text("cara_beli").notNull().default("keranjang"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "produk_cara_beli_valid",
      sql`${table.caraBeli} IN ('keranjang', 'permintaan')`,
    ),
    // Checkout (3.8) mengurangi stok di satu perintah SQL. Stok yang kurang membuat
    // perintah itu gagal di sini, jadi stok tidak pernah minus.
    check("produk_jumlah_stok_tidak_negatif", sql`${table.jumlahStok} >= 0`),
  ],
);

/** Foto produk di ImageKit. Ikut terhapus saat produknya dihapus. */
export const fotoProduk = pgTable("foto_produk", {
  idFoto: integer("id_foto").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id")
    .notNull()
    .references(() => produk.idProduk, { onDelete: "cascade" }),
  url: text("url").notNull(),
  fileId: text("file_id").notNull(),
  urutan: integer("urutan").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Pesanan toko online (3.8). Ongkir dan pengiriman diatur WW di luar sistem. */
export const transaksi = pgTable(
  "transaksi",
  {
    idTransaksi: integer("id_transaksi")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: integer("id_user")
      .notNull()
      .references(() => users.idUser),
    tanggalTransaksi: timestamp("tanggal_transaksi", { withTimezone: true })
      .notNull()
      .defaultNow(),
    metodePembayaran: text("metode_pembayaran").notNull(),
    status: text("status").notNull().default("menunggu_bayar"),
    // Dihitung di server dari harga di database saat checkout (CONTRIBUTING 9.7).
    totalHarga: numeric("total_harga", { precision: 12, scale: 2 }).notNull(),
    namaPenerima: text("nama_penerima").notNull(),
    telpPenerima: text("telp_penerima").notNull(),
    alamatPengiriman: text("alamat_pengiriman").notNull(),
    catatan: text("catatan"),
  },
  (table) => [
    check(
      "transaksi_status_valid",
      sql`${table.status} IN ('menunggu_bayar', 'dibayar', 'selesai', 'kedaluwarsa', 'dibatalkan')`,
    ),
  ],
);

/** Isi satu pesanan, satu baris per produk. */
export const detailTransaksi = pgTable(
  "detail_transaksi",
  {
    idDetailTransaksi: integer("id_detail_transaksi")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    transaksiId: integer("transaksi_id")
      .notNull()
      .references(() => transaksi.idTransaksi),
    // Tanpa cascade: produk yang sudah dibeli tidak bisa dihapus, supaya riwayatnya ada.
    produkId: integer("produk_id")
      .notNull()
      .references(() => produk.idProduk),
    jumlahProduk: integer("jumlah_produk").notNull(),
    // Harga satuan saat checkout. Riwayat pesanan (3.9) memakai ini, bukan harga sekarang.
    hargaBeli: numeric("harga_beli", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    uniqueIndex("detail_transaksi_transaksi_produk_unique").on(
      table.transaksiId,
      table.produkId,
    ),
  ],
);

/** Keranjang belanja, satu per akun. */
export const keranjang = pgTable("keranjang", {
  idKeranjang: integer("id_keranjang").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("id_user")
    .notNull()
    .unique()
    .references(() => users.idUser),
});

/** Isi keranjang. Ikut terhapus saat produknya dihapus admin (cascade sejak 3.1). */
export const detailKeranjang = pgTable(
  "detail_keranjang",
  {
    keranjangId: integer("keranjang_id")
      .notNull()
      .references(() => keranjang.idKeranjang),
    produkId: integer("produk_id")
      .notNull()
      .references(() => produk.idProduk, { onDelete: "cascade" }),
    jumlahProduk: integer("jumlah_produk").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.keranjangId, table.produkId] })],
);

/** Pembayaran Midtrans untuk satu transaksi toko (3.8), polanya sama dengan
    pembayaran_event. order_id hanya unik di tabel ini, jadi awalannya harus berbeda
    dari order_id pembayaran event dan langganan. */
export const pembayaranToko = pgTable("pembayaran_toko", {
  idPembayaranToko: integer("id_pembayaran_toko")
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  transaksiId: integer("transaksi_id")
    .notNull()
    .references(() => transaksi.idTransaksi),
  orderId: text("order_id").notNull().unique(),
  midtransTransactionId: text("midtrans_transaction_id"),
  redirectUrl: text("redirect_url"),
  jumlah: numeric("jumlah", { precision: 12, scale: 2 }).notNull(),
  statusPembayaran: text("status_pembayaran").notNull(),
  tanggalDibuat: timestamp("tanggal_dibuat", { withTimezone: true })
    .notNull()
    .defaultNow(),
  tanggalDibayar: timestamp("tanggal_dibayar", { withTimezone: true }),
  tanggalKedaluwarsa: timestamp("tanggal_kedaluwarsa", { withTimezone: true })
    .notNull(),
});

/** Permintaan produk by request dari pelanggan (3.6), ditindaklanjuti admin (3.7).
    Tidak ada pembayaran online untuk permintaan. */
export const permintaanProduk = pgTable(
  "permintaan_produk",
  {
    idPermintaan: integer("id_permintaan")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    idUser: integer("id_user")
      .notNull()
      .references(() => users.idUser),
    // Tanpa cascade: produk yang sudah diminta tidak bisa dihapus, supaya riwayatnya ada.
    produkId: integer("produk_id")
      .notNull()
      .references(() => produk.idProduk),
    jumlahKg: numeric("jumlah_kg", { precision: 10, scale: 2 }).notNull(),
    namaPic: text("nama_pic").notNull(),
    telpPic: text("telp_pic").notNull(),
    alamatPengiriman: text("alamat_pengiriman").notNull(),
    catatan: text("catatan"),
    status: text("status").notNull().default("baru"),
    catatanAdmin: text("catatan_admin"),
    dibuatPada: timestamp("dibuat_pada", { withTimezone: true })
      .notNull()
      .defaultNow(),
    diperbaruiPada: timestamp("diperbarui_pada", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "permintaan_produk_status_valid",
      sql`${table.status} IN ('baru', 'diproses', 'selesai', 'dibatalkan')`,
    ),
    // Angka dibulatkan ke dua desimal sebelum dicek, jadi 0.004 kg juga ditolak.
    check("permintaan_produk_jumlah_kg_positif", sql`${table.jumlahKg} > 0`),
  ],
);

/** Toko mitra yang menjual produk WW (3.4), ditampilkan di /toko-terdekat (3.5).
    Tanpa stok. Toko dinonaktifkan lewat aktif, tidak dihapus. */
export const tokoMitra = pgTable(
  "toko_mitra",
  {
    idToko: integer("id_toko").primaryKey().generatedAlwaysAsIdentity(),
    namaToko: text("nama_toko").notNull(),
    alamat: text("alamat").notNull(),
    latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
    longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
    // Teks bebas, misalnya "Senin–Sabtu 08.00–17.00".
    jamBuka: text("jam_buka"),
    kontak: text("kontak"),
    aktif: boolean("aktif").notNull().default(true),
    dibuatPada: timestamp("dibuat_pada", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "toko_mitra_latitude_valid",
      sql`${table.latitude} BETWEEN -90 AND 90`,
    ),
    check(
      "toko_mitra_longitude_valid",
      sql`${table.longitude} BETWEEN -180 AND 180`,
    ),
  ],
);

/** Produk WW yang dijual di setiap toko mitra (3.4). Barisnya ikut terhapus jika
    toko atau produknya dihapus. */
export const produkToko = pgTable(
  "produk_toko",
  {
    tokoId: integer("toko_id")
      .notNull()
      .references(() => tokoMitra.idToko, { onDelete: "cascade" }),
    produkId: integer("produk_id")
      .notNull()
      .references(() => produk.idProduk, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tokoId, table.produkId] })],
);
