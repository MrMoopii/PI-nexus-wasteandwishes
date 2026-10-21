CREATE TABLE "data_langganan" (
	"id_langganan" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "data_langganan_id_langganan_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id_user" integer NOT NULL UNIQUE,
	"status_langganan" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detail_keranjang" (
	"keranjang_id" integer,
	"produk_id" integer,
	"jumlah_produk" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "detail_keranjang_pkey" PRIMARY KEY("keranjang_id","produk_id")
);
--> statement-breakpoint
CREATE TABLE "detail_transaksi" (
	"id_detail_transaksi" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "detail_transaksi_id_detail_transaksi_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"transaksi_id" integer NOT NULL,
	"produk_id" integer NOT NULL,
	"jumlah_produk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id_event" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_id_event_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nama_event" text NOT NULL,
	"jenis_event" text NOT NULL,
	"tanggal_pelaksanaan" date NOT NULL,
	"biaya_event" numeric(12,2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jadwal" (
	"id_jadwal" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "jadwal_id_jadwal_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"langganan_id" integer NOT NULL,
	"hari_pengambilan" text NOT NULL,
	"jam_pengambilan" time NOT NULL,
	"jenis_jadwal" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jadwal_janjian" (
	"jadwal_id" integer PRIMARY KEY,
	"keterangan_tujuan" text NOT NULL,
	"status_konfirmasi" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jadwal_rutin" (
	"jadwal_id" integer PRIMARY KEY,
	"tanggal_mulai" date NOT NULL,
	"tanggal_selesai" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keranjang" (
	"id_keranjang" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "keranjang_id_keranjang_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id_user" integer NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "pendaftaran_event" (
	"id_pendaftaran" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pendaftaran_event_id_pendaftaran_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"id_user" integer NOT NULL,
	"tanggal_daftar" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produk" (
	"id_produk" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "produk_id_produk_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nama_produk" text NOT NULL,
	"jenis_produk" text NOT NULL,
	"harga_produk" numeric(12,2) NOT NULL,
	"jumlah_stok" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riwayat_pengambilan" (
	"id_riwayat" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "riwayat_pengambilan_id_riwayat_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"jadwal_id" integer NOT NULL,
	"tanggal_pengambilan" timestamp with time zone NOT NULL,
	"foto_bukti_pengambilan" text,
	"bobot_sampah" numeric(10,2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaksi" (
	"id_transaksi" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transaksi_id_transaksi_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id_user" integer NOT NULL,
	"tanggal_transaksi" timestamp with time zone DEFAULT now() NOT NULL,
	"metode_pembayaran" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id_user" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_user_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"username" text NOT NULL,
	"nama_pelanggan" text NOT NULL,
	"peran" text DEFAULT 'user' NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"nomor_telp" text NOT NULL,
	"alamat" text NOT NULL,
	"tanggal_lahir" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "test_koneksi";--> statement-breakpoint
CREATE UNIQUE INDEX "detail_transaksi_transaksi_produk_unique" ON "detail_transaksi" ("transaksi_id","produk_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pendaftaran_event_event_user_unique" ON "pendaftaran_event" ("event_id","id_user");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "data_langganan" ADD CONSTRAINT "data_langganan_id_user_users_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user");--> statement-breakpoint
ALTER TABLE "detail_keranjang" ADD CONSTRAINT "detail_keranjang_keranjang_id_keranjang_id_keranjang_fkey" FOREIGN KEY ("keranjang_id") REFERENCES "keranjang"("id_keranjang");--> statement-breakpoint
ALTER TABLE "detail_keranjang" ADD CONSTRAINT "detail_keranjang_produk_id_produk_id_produk_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id_produk");--> statement-breakpoint
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "detail_transaksi_transaksi_id_transaksi_id_transaksi_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("id_transaksi");--> statement-breakpoint
ALTER TABLE "detail_transaksi" ADD CONSTRAINT "detail_transaksi_produk_id_produk_id_produk_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id_produk");--> statement-breakpoint
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_langganan_id_data_langganan_id_langganan_fkey" FOREIGN KEY ("langganan_id") REFERENCES "data_langganan"("id_langganan");--> statement-breakpoint
ALTER TABLE "jadwal_janjian" ADD CONSTRAINT "jadwal_janjian_jadwal_id_jadwal_id_jadwal_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "jadwal"("id_jadwal");--> statement-breakpoint
ALTER TABLE "jadwal_rutin" ADD CONSTRAINT "jadwal_rutin_jadwal_id_jadwal_id_jadwal_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "jadwal"("id_jadwal");--> statement-breakpoint
ALTER TABLE "keranjang" ADD CONSTRAINT "keranjang_id_user_users_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user");--> statement-breakpoint
ALTER TABLE "pendaftaran_event" ADD CONSTRAINT "pendaftaran_event_event_id_events_id_event_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id_event");--> statement-breakpoint
ALTER TABLE "pendaftaran_event" ADD CONSTRAINT "pendaftaran_event_id_user_users_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user");--> statement-breakpoint
ALTER TABLE "riwayat_pengambilan" ADD CONSTRAINT "riwayat_pengambilan_jadwal_id_jadwal_id_jadwal_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "jadwal"("id_jadwal");--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_id_user_users_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user");