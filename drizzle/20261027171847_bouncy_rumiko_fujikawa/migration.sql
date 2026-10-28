ALTER TABLE "events" ADD COLUMN "deskripsi" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "kuota_peserta" integer DEFAULT 0 NOT NULL;