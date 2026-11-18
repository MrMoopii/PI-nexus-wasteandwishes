CREATE TABLE IF NOT EXISTS "pembayaran_event" (
	"id_pembayaran_event" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pembayaran_event_id_pembayaran_event_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"pendaftaran_id" integer NOT NULL,
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pembayaran_event_4Ab5bf6J9Gxj_fkey'
      AND conrelid = 'pembayaran_event'::regclass
  ) THEN
    ALTER TABLE "pembayaran_event"
      ADD CONSTRAINT "pembayaran_event_4Ab5bf6J9Gxj_fkey"
      FOREIGN KEY ("pendaftaran_id")
      REFERENCES "pendaftaran_event"("id_pendaftaran");
  END IF;
END $$;
