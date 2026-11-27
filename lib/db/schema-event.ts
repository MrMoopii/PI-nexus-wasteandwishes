import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./schema";

/** Tabel event (kode tugas 3.1). Dipindah dari schema.ts supaya file itu tidak
    bertambah panjang (CONTRIBUTING 4.2 no. 9), lalu diekspor ulang dari schema.ts
    sehingga impor tetap dari "@/lib/db/schema". Pemindahan tidak mengubah database.

    Event hanya informasi: WW diundang pihak lain sebagai narasumber, peserta, atau
    mitra. kuota_peserta, biaya_event, pendaftaran_event, dan pembayaran_event tidak
    dihapus dulu karena masih berisi data alur lama. Penghapusannya setelah rilis.

    Daftar peran di CHECK HARUS sama dengan PERAN_WW di features/event/types.ts.
    lib/ tidak boleh mengimpor dari features/ (4.2 no. 6), jadi daftarnya ditulis dua
    kali. Mengubah daftar berarti migrasi baru.
*/

/** Event pihak lain yang dihadiri WW. Kolom dari 3.1 boleh kosong untuk event lama. */
export const events = pgTable(
  "events",
  {
    idEvent: integer("id_event").primaryKey().generatedAlwaysAsIdentity(),
    namaEvent: text("nama_event").notNull(),
    jenisEvent: text("jenis_event").notNull(),
    deskripsi: text("deskripsi"),
    kuotaPeserta: integer("kuota_peserta").notNull().default(0),
    tanggalPelaksanaan: date("tanggal_pelaksanaan").notNull(),
    waktuMulai: time("waktu_mulai"),
    waktuSelesai: time("waktu_selesai"),
    lokasi: text("lokasi"),
    gambarUrl: text("gambar_url"),
    gambarFileId: text("gambar_file_id"),
    statusEvent: text("status_event").notNull().default("draft"),
    biayaEvent: numeric("biaya_event", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    // Wajib untuk event baru lewat skema Zod form admin (3.3), bukan di database.
    penyelenggara: text("penyelenggara"),
    peranWw: text("peran_ww"),
    // Syarat https:// juga dicek skema Zod 3.3, karena event lama tidak punya isiannya.
    tautanInfo: text("tautan_info"),
  },
  (table) => [
    // Nilai kosong lolos CHECK, jadi event lama tanpa peran WW tetap sah.
    check(
      "events_peran_ww_valid",
      sql`${table.peranWw} IN ('narasumber', 'peserta', 'mitra')`,
    ),
  ],
);

/** Pendaftaran event alur lama. Tidak berubah, dibiarkan sampai rilis. */
export const pendaftaranEvent = pgTable(
  "pendaftaran_event",
  {
    idPendaftaran: integer("id_pendaftaran")
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.idEvent),
    userId: integer("id_user")
      .notNull()
      .references(() => users.idUser),
    tanggalDaftar: timestamp("tanggal_daftar", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("pendaftaran_event_event_user_unique").on(
      table.eventId,
      table.userId,
    ),
  ],
);

/** Pembayaran event alur lama. Tidak berubah; webhook Midtrans masih membacanya. */
export const pembayaranEvent = pgTable("pembayaran_event", {
  idPembayaranEvent: integer("id_pembayaran_event")
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.idEvent),
  userId: integer("id_user")
    .notNull()
    .references(() => users.idUser),
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
