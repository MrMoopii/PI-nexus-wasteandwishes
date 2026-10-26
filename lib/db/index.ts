import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Hanya untuk kode server
let dbTersimpan: ReturnType<typeof buatDb> | undefined;

// Fungsi untuk membuat koneksi ke database menggunakan Drizzle ORM dan Neon
function buatDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL belum diisi di .env.local");
  }
  return drizzle({ client: neon(databaseUrl) });
}

// Fungsi untuk mendapatkan instance database yang tersimpan atau membuat baru jika belum ada
export function getDb() {
  dbTersimpan ??= buatDb();
  return dbTersimpan;
}
