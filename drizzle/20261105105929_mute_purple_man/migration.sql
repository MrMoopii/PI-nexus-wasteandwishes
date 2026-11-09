CREATE TABLE "pembayaran_langganan" (
	"id_pembayaran_langganan" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pembayaran_langganan_id_pembayaran_langganan_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"langganan_id" integer NOT NULL,
	"order_id" text NOT NULL UNIQUE,
	"midtrans_transaction_id" text,
	"jumlah" numeric(12,2) NOT NULL,
	"status_pembayaran" text NOT NULL,
	"tanggal_dibuat" timestamp with time zone DEFAULT now() NOT NULL,
	"tanggal_dibayar" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "data_langganan" ADD COLUMN "tanggal_mulai_langganan" date;--> statement-breakpoint
ALTER TABLE "data_langganan" ADD COLUMN "tanggal_akhir_langganan" date;--> statement-breakpoint
ALTER TABLE "pembayaran_langganan" ADD CONSTRAINT "pembayaran_langganan_Myzn9HGb1tT9_fkey" FOREIGN KEY ("langganan_id") REFERENCES "data_langganan"("id_langganan");