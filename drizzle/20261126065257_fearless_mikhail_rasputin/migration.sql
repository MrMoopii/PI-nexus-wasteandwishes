CREATE TABLE "hari_libur" (
	"id_hari_libur" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hari_libur_id_hari_libur_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tanggal" date NOT NULL,
	"keterangan" text NOT NULL,
	"aturan" text DEFAULT 'geser' NOT NULL,
	CONSTRAINT "hari_libur_aturan_valid" CHECK ("aturan" IN ('geser', 'lewati'))
);
--> statement-breakpoint
CREATE TABLE "kunjungan_pengambilan" (
	"id_kunjungan" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "kunjungan_pengambilan_id_kunjungan_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id_user" integer NOT NULL,
	"pengajuan_id" integer NOT NULL,
	"tanggal" date NOT NULL,
	"jam_mulai" time,
	"jam_selesai" time,
	"status" text DEFAULT 'dijadwalkan' NOT NULL,
	"jumlah_ember" integer,
	"berat_kg" numeric(10,2),
	"foto_bukti" text,
	"foto_bukti_file_id" text,
	"catatan" text,
	"alasan_kendala" text,
	"tanggal_paling_lambat" date,
	"pengganti_dari" integer,
	"dicatat_oleh" integer,
	"ditimbang_pada" timestamp with time zone,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kunjungan_pengambilan_kunjungan_user_unique" UNIQUE("id_kunjungan","id_user"),
	CONSTRAINT "kunjungan_pengambilan_status_valid" CHECK ("status" IN ('dijadwalkan', 'diambil', 'ditimbang', 'tertunda', 'batal', 'dilewati')),
	CONSTRAINT "kunjungan_pengambilan_rentang_jam_valid" CHECK (("jam_mulai" IS NULL AND "jam_selesai" IS NULL) OR ("jam_mulai" IS NOT NULL AND "jam_selesai" IS NOT NULL AND "jam_mulai" < "jam_selesai")),
	CONSTRAINT "kunjungan_pengambilan_jumlah_ember_tidak_negatif" CHECK ("jumlah_ember" >= 0),
	CONSTRAINT "kunjungan_pengambilan_berat_kg_tidak_negatif" CHECK ("berat_kg" >= 0),
	CONSTRAINT "kunjungan_pengambilan_tanggal_hari_kerja" CHECK (EXTRACT(ISODOW FROM "tanggal") BETWEEN 1 AND 5),
	CONSTRAINT "kunjungan_pengambilan_tertunda_lengkap" CHECK ("status" <> 'tertunda' OR ("alasan_kendala" IS NOT NULL AND "tanggal_paling_lambat" IS NOT NULL)),
	CONSTRAINT "kunjungan_pengambilan_tanggal_paling_lambat_valid" CHECK ("tanggal_paling_lambat" IS NULL OR "tanggal_paling_lambat" >= "tanggal"),
	CONSTRAINT "kunjungan_pengambilan_ember_tercatat" CHECK ("status" NOT IN ('diambil', 'ditimbang') OR "jumlah_ember" IS NOT NULL),
	CONSTRAINT "kunjungan_pengambilan_timbang_lengkap" CHECK ("status" <> 'ditimbang' OR ("berat_kg" IS NOT NULL AND "ditimbang_pada" IS NOT NULL)),
	CONSTRAINT "kunjungan_pengambilan_foto_berpasangan" CHECK (("foto_bukti" IS NULL AND "foto_bukti_file_id" IS NULL) OR ("foto_bukti" IS NOT NULL AND "foto_bukti_file_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "laporan_kendala" (
	"id_laporan" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "laporan_kendala_id_laporan_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"id_user" integer NOT NULL,
	"kunjungan_id" integer NOT NULL,
	"jenis" text NOT NULL,
	"pesan" text NOT NULL,
	"tanggal_pengganti" date,
	"status" text DEFAULT 'menunggu' NOT NULL,
	"tanggapan_admin" text,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "laporan_kendala_jenis_valid" CHECK ("jenis" IN ('kendala', 'lewati')),
	CONSTRAINT "laporan_kendala_status_valid" CHECK ("status" IN ('menunggu', 'ditanggapi')),
	CONSTRAINT "laporan_kendala_pesan_tidak_kosong" CHECK (btrim("pesan") <> ''),
	CONSTRAINT "laporan_kendala_tanggal_pengganti_hanya_lewati" CHECK ("tanggal_pengganti" IS NULL OR "jenis" = 'lewati')
);
--> statement-breakpoint
CREATE TABLE "perubahan_jadwal" (
	"id_perubahan" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "perubahan_jadwal_id_perubahan_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"pengajuan_id" integer NOT NULL,
	"hari_pengambilan" integer[] NOT NULL,
	"jam_mulai" time,
	"jam_selesai" time,
	"berlaku_mulai" date NOT NULL,
	"alasan" text NOT NULL,
	"diubah_oleh" integer NOT NULL,
	"dibuat_pada" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "perubahan_jadwal_hari_valid" CHECK (cardinality("hari_pengambilan") > 0 AND "hari_pengambilan" <@ ARRAY[1, 2, 3, 4, 5]),
	CONSTRAINT "perubahan_jadwal_rentang_jam_valid" CHECK (("jam_mulai" IS NULL AND "jam_selesai" IS NULL) OR ("jam_mulai" IS NOT NULL AND "jam_selesai" IS NOT NULL AND "jam_mulai" < "jam_selesai"))
);
--> statement-breakpoint
ALTER TABLE "pengajuan_langganan" ADD CONSTRAINT "pengajuan_langganan_pengajuan_user_unique" UNIQUE("id_pengajuan","id_user");--> statement-breakpoint
CREATE UNIQUE INDEX "hari_libur_tanggal_unique" ON "hari_libur" ("tanggal");--> statement-breakpoint
CREATE UNIQUE INDEX "kunjungan_pengambilan_user_tanggal_unique" ON "kunjungan_pengambilan" ("id_user","tanggal");--> statement-breakpoint
CREATE INDEX "kunjungan_pengambilan_tanggal_idx" ON "kunjungan_pengambilan" ("tanggal");--> statement-breakpoint
CREATE INDEX "laporan_kendala_kunjungan_id_idx" ON "laporan_kendala" ("kunjungan_id");--> statement-breakpoint
CREATE INDEX "perubahan_jadwal_pengajuan_id_idx" ON "perubahan_jadwal" ("pengajuan_id");--> statement-breakpoint
ALTER TABLE "kunjungan_pengambilan" ADD CONSTRAINT "kunjungan_pengambilan_pengajuan_user_fkey" FOREIGN KEY ("pengajuan_id","id_user") REFERENCES "pengajuan_langganan"("id_pengajuan","id_user");--> statement-breakpoint
ALTER TABLE "kunjungan_pengambilan" ADD CONSTRAINT "kunjungan_pengambilan_pengganti_dari_fkey" FOREIGN KEY ("pengganti_dari","id_user") REFERENCES "kunjungan_pengambilan"("id_kunjungan","id_user");--> statement-breakpoint
ALTER TABLE "kunjungan_pengambilan" ADD CONSTRAINT "kunjungan_pengambilan_dicatat_oleh_fkey" FOREIGN KEY ("dicatat_oleh") REFERENCES "users"("id_user");--> statement-breakpoint
ALTER TABLE "laporan_kendala" ADD CONSTRAINT "laporan_kendala_kunjungan_user_fkey" FOREIGN KEY ("kunjungan_id","id_user") REFERENCES "kunjungan_pengambilan"("id_kunjungan","id_user");--> statement-breakpoint
ALTER TABLE "perubahan_jadwal" ADD CONSTRAINT "perubahan_jadwal_pengajuan_id_fkey" FOREIGN KEY ("pengajuan_id") REFERENCES "pengajuan_langganan"("id_pengajuan");--> statement-breakpoint
ALTER TABLE "perubahan_jadwal" ADD CONSTRAINT "perubahan_jadwal_diubah_oleh_fkey" FOREIGN KEY ("diubah_oleh") REFERENCES "users"("id_user");--> statement-breakpoint
ALTER TABLE "pesan_negosiasi" ADD CONSTRAINT "pesan_negosiasi_pengirim_valid" CHECK ("pengirim" IN ('pelanggan', 'admin'));