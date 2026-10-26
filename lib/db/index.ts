import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Hanya untuk kode server
let dbTersimpan: ReturnType<typeof buatDb> | undefined;

// Fungsi untuk membuat koneksi ke database menggunakan Drizzle ORM dan Neon
function buatDb() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    throw new Error("DIRECT_URL belum diisi di .env.local");
  }
  return drizzle({ client: neon(directUrl) });
}

// Fungsi untuk mendapatkan instance database yang tersimpan atau membuat baru jika belum ada
export function getDb() {
  dbTersimpan ??= buatDb();
  return dbTersimpan;
}
