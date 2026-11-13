CREATE TABLE "foto_produk" (
	"id_foto" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "foto_produk_id_foto_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"url" text NOT NULL,
	"file_id" text NOT NULL,
	"urutan" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "foto_produk" ADD CONSTRAINT "foto_produk_product_id_produk_id_produk_fkey" FOREIGN KEY ("product_id") REFERENCES "produk"("id_produk") ON DELETE CASCADE;