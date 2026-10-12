import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Tabel uji coba koneksi database melalui ORM Drizzle
export const testKoneksi = pgTable("test_koneksi", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  pesan: text("pesan").notNull(),
  dibuatPada: timestamp("dibuat_pada", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
