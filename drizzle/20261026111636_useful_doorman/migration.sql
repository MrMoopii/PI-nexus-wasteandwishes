ALTER TABLE "events" ADD COLUMN "waktu_mulai" time;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "waktu_selesai" time;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "lokasi" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "gambar_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "status_event" text DEFAULT 'draft' NOT NULL;