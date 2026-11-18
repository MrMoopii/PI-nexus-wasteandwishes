DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pembayaran_event'
      AND column_name = 'pendaftaran_id'
  ) THEN
    ALTER TABLE "pembayaran_event"
      ADD COLUMN "event_id" integer,
      ADD COLUMN "id_user" integer;

    UPDATE "pembayaran_event" AS pembayaran
    SET "event_id" = pendaftaran."event_id",
        "id_user" = pendaftaran."id_user"
    FROM "pendaftaran_event" AS pendaftaran
    WHERE pembayaran."pendaftaran_id" = pendaftaran."id_pendaftaran";

    IF EXISTS (
      SELECT 1 FROM "pembayaran_event"
      WHERE "event_id" IS NULL OR "id_user" IS NULL
    ) THEN
      RAISE EXCEPTION 'Tidak dapat memetakan semua pembayaran event ke event dan pengguna';
    END IF;

    ALTER TABLE "pembayaran_event"
      ALTER COLUMN "event_id" SET NOT NULL,
      ALTER COLUMN "id_user" SET NOT NULL;

    ALTER TABLE "pembayaran_event"
      DROP CONSTRAINT "pembayaran_event_4Ab5bf6J9Gxj_fkey",
      DROP COLUMN "pendaftaran_id";

    ALTER TABLE "pembayaran_event"
      ADD CONSTRAINT "pembayaran_event_event_id_events_id_event_fkey"
        FOREIGN KEY ("event_id") REFERENCES "events"("id_event"),
      ADD CONSTRAINT "pembayaran_event_id_user_users_id_user_fkey"
        FOREIGN KEY ("id_user") REFERENCES "users"("id_user");
  END IF;
END $$;
