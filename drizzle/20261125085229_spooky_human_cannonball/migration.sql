CREATE TABLE "pengajuan_langganan" (
	"id_pengajuan" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pengajuan_langganan_id_pengajuan_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id_user" integer NOT NULL,
	"nama_instansi" text NOT NULL,
	"jenis_instansi" text NOT NULL,
	"jenis_instansi_lain" text,
	"alamat_pengambilan" text NOT NULL,
	"nama_pic" text NOT NULL,
	"telp_pic" text NOT NULL,
	"jenis_limbah" text,
	"estimasi_ember" integer NOT NULL,
	"catatan_pelanggan" text,
	"jenis_pelanggan" text,
	"hari_pengambilan" integer[],
	"jam_mulai" time,
	"jam_selesai" time,
	"jumlah_ember" integer,
	"harga_final" numeric(12,2),
	"alasan_ditolak" text,
	"status" text DEFAULT 'menunggu_review' NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"diperbarui_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pengajuan_langganan_status_valid" CHECK ("status" IN ('menunggu_review', 'ditawarkan', 'negosiasi', 'disetujui_pelanggan', 'siap_bayar', 'ditolak', 'dibatalkan')),
	CONSTRAINT "pengajuan_langganan_estimasi_ember_positif" CHECK ("estimasi_ember" > 0),
	CONSTRAINT "pengajuan_langganan_jumlah_ember_positif" CHECK ("jumlah_ember" > 0),
	CONSTRAINT "pengajuan_langganan_harga_final_positif" CHECK ("harga_final" > 0),
	CONSTRAINT "pengajuan_langganan_hari_valid" CHECK (cardinality("hari_pengambilan") > 0 AND "hari_pengambilan" <@ ARRAY[1, 2, 3, 4, 5]),
	CONSTRAINT "pengajuan_langganan_rentang_jam_valid" CHECK (("jam_mulai" IS NULL AND "jam_selesai" IS NULL) OR ("jam_mulai" IS NOT NULL AND "jam_selesai" IS NOT NULL AND "jam_mulai" < "jam_selesai"))
);
--> statement-breakpoint
CREATE TABLE "pesan_negosiasi" (
	"id_pesan" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pesan_negosiasi_id_pesan_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"pengajuan_id" integer NOT NULL,
	"pengirim" text NOT NULL,
	"id_pengirim" integer NOT NULL,
	"harga_usulan" numeric(12,2),
	"pesan" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pesan_negosiasi_harga_usulan_positif" CHECK ("harga_usulan" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "pengajuan_langganan_satu_berjalan_per_user" ON "pengajuan_langganan" ("id_user") WHERE "status" NOT IN ('ditolak', 'dibatalkan');--> statement-breakpoint
CREATE INDEX "pesan_negosiasi_pengajuan_id_idx" ON "pesan_negosiasi" ("pengajuan_id");--> statement-breakpoint
ALTER TABLE "pengajuan_langganan" ADD CONSTRAINT "pengajuan_langganan_id_user_users_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user");--> statement-breakpoint
ALTER TABLE "pesan_negosiasi" ADD CONSTRAINT "pesan_negosiasi_ORORxLSRZATu_fkey" FOREIGN KEY ("pengajuan_id") REFERENCES "pengajuan_langganan"("id_pengajuan");--> statement-breakpoint
ALTER TABLE "pesan_negosiasi" ADD CONSTRAINT "pesan_negosiasi_id_pengirim_users_id_user_fkey" FOREIGN KEY ("id_pengirim") REFERENCES "users"("id_user");