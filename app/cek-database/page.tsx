import { count } from "drizzle-orm";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { testKoneksi } from "@/lib/db/schema";

async function HasilTes() {
  await connection();
  try {
    const [baris] = await db.select({ jumlah: count() }).from(testKoneksi);
    return <p>Koneksi berhasil. Jumlah baris: {baris.jumlah}</p>;
  } catch {
    return <p>Koneksi gagal. Cek .env.local dan pastikan migrasi sudah jalan.</p>;
  }
}

export default function CekDatabasePage() {
  return (
    <>
      <h1>Cek koneksi database</h1>
      <Suspense fallback={<p>Memeriksa koneksi...</p>}>
        <HasilTes />
      </Suspense>
    </>
  );
}