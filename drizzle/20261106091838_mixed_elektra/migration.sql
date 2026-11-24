ALTER TABLE "produk" ADD COLUMN "deskripsi" text;--> statement-breakpoint
ALTER TABLE "produk" ADD COLUMN "gambar_url" text;--> statement-breakpoint
ALTER TABLE "produk" ADD COLUMN "berat" text;--> statement-breakpoint
ALTER TABLE "produk" ADD COLUMN "status_produk" text DEFAULT 'aktif' NOT NULL;--> statement-breakpoint
ALTER TABLE "produk" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;