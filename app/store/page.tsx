import EtalaseProduk from "@/app/store/etalase-produk";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { produk } from "@/lib/db/schema";

export default function TokoPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-(--hx-canvas)"
          aria-label="Memuat toko"
        />
      }
    >
      <DaftarProduk />
    </Suspense>
  );
}

async function DaftarProduk() {
  await connection();
  const produkAktif = await getDb()
    .select()
    .from(produk)
    .where(eq(produk.statusProduk, "aktif"))
    .orderBy(desc(produk.createdAt));

  return <EtalaseProduk produkList={produkAktif} />;
}
