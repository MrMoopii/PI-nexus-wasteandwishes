import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import DetailProdukClient from "./detail-produk-client";
import { getDb } from "@/lib/db";
import { produk } from "@/lib/db/schema";

export default function DetailProdukPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-(--hx-canvas)" aria-label="Memuat produk" />}>
      <ProdukDetail params={params} />
    </Suspense>
  );
}

async function ProdukDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id: idText } = await params;
  const id = Number(idText);

  if (!(Number.isInteger(id) && id > 0)) {
    notFound();
  }

  const [produkUtama] = await getDb()
    .select()
    .from(produk)
    .where(eq(produk.idProduk, id))
    .limit(1);

  if (!produkUtama || produkUtama.statusProduk !== "aktif") {
    notFound();
  }

  const produkLainnya = await getDb()
    .select()
    .from(produk)
    .where(eq(produk.statusProduk, "aktif"))
    .orderBy(produk.createdAt)
    .limit(3);

  return (
    <DetailProdukClient
      produkUtama={produkUtama}
      produkLainnya={produkLainnya.filter((item) => item.idProduk !== id)}
    />
  );
}
