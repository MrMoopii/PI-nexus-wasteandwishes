CREATE TABLE "pembayaran_toko" (
	"id_pembayaran_toko" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pembayaran_toko_id_pembayaran_toko_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"transaksi_id" integer NOT NULL,
	"order_id" text NOT NULL UNIQUE,
	"midtrans_transaction_id" text,
	"redirect_url" text,
	"jumlah" numeric(12,2) NOT NULL,
	"status_pembayaran" text NOT NULL,
	"tanggal_dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"tanggal_dibayar" timestamp with time zone,
	"tanggal_kedaluwarsa" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permintaan_produk" (
	"id_permintaan" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "permintaan_produk_id_permintaan_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id_user" integer NOT NULL,
	"produk_id" integer NOT NULL,
	"jumlah_kg" numeric(10,2) NOT NULL,
	"nama_pic" text NOT NULL,
	"telp_pic" text NOT NULL,
	"alamat_pengiriman" text NOT NULL,
	"catatan" text,
	"status" text DEFAULT 'baru' NOT NULL,
	"catatan_admin" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permintaan_produk_status_valid" CHECK ("status" IN ('baru', 'diproses', 'selesai', 'dibatalkan')),
	CONSTRAINT "permintaan_produk_jumlah_kg_positif" CHECK ("jumlah_kg" > 0)
);
--> statement-breakpoint
CREATE TABLE "produk_toko" (
	"toko_id" integer,
	"produk_id" integer,
	CONSTRAINT "produk_toko_pkey" PRIMARY KEY("toko_id","produk_id")
);
--> statement-breakpoint
CREATE TABLE "toko_mitra" (
	"id_toko" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "toko_mitra_id_toko_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nama_toko" text NOT NULL,
	"alamat" text NOT NULL,
	"latitude" numeric(9,6) NOT NULL,
	"longitude" numeric(9,6) NOT NULL,
	"jam_buka" text,
	"kontak" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "toko_mitra_latitude_valid" CHECK ("latitude" BETWEEN -90 AND 90),
	CONSTRAINT "toko_mitra_longitude_valid" CHECK ("longitude" BETWEEN -180 AND 180)
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "penyelenggara" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "peran_ww" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "tautan_info" text;--> statement-breakpoint
ALTER TABLE "detail_transaksi" ADD COLUMN "harga_beli" numeric(12,2) NOT NULL;--> statement-breakpoint
ALTER TABLE "produk" ADD COLUMN "cara_beli" text DEFAULT 'keranjang' NOT NULL;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "status" text DEFAULT 'menunggu_bayar' NOT NULL;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "total_harga" numeric(12,2) NOT NULL;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "nama_penerima" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "telp_penerima" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "alamat_pengiriman" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "catatan" text;--> statement-breakpoint
ALTER TABLE "pembayaran_toko" ADD CONSTRAINT "pembayaran_toko_transaksi_id_transaksi_id_transaksi_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi"("id_transaksi");--> statement-breakpoint
ALTER TABLE "permintaan_produk" ADD CONSTRAINT "permintaan_produk_id_user_users_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user");--> statement-breakpoint
ALTER TABLE "permintaan_produk" ADD CONSTRAINT "permintaan_produk_produk_id_produk_id_produk_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id_produk");--> statement-breakpoint
ALTER TABLE "produk_toko" ADD CONSTRAINT "produk_toko_toko_id_toko_mitra_id_toko_fkey" FOREIGN KEY ("toko_id") REFERENCES "toko_mitra"("id_toko") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "produk_toko" ADD CONSTRAINT "produk_toko_produk_id_produk_id_produk_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id_produk") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "detail_keranjang" DROP CONSTRAINT "detail_keranjang_produk_id_produk_id_produk_fkey", ADD CONSTRAINT "detail_keranjang_produk_id_produk_id_produk_fkey" FOREIGN KEY ("produk_id") REFERENCES "produk"("id_produk") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_peran_ww_valid" CHECK ("peran_ww" IN ('narasumber', 'peserta', 'mitra'));--> statement-breakpoint
ALTER TABLE "produk" ADD CONSTRAINT "produk_cara_beli_valid" CHECK ("cara_beli" IN ('keranjang', 'permintaan'));--> statement-breakpoint
ALTER TABLE "produk" ADD CONSTRAINT "produk_jumlah_stok_tidak_negatif" CHECK ("jumlah_stok" >= 0);--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_status_valid" CHECK ("status" IN ('menunggu_bayar', 'dibayar', 'selesai', 'kedaluwarsa', 'dibatalkan'));