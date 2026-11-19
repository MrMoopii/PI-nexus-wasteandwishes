import EtalaseProduk from "@/app/store/etalase-produk";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { produk } from "@/lib/db/schema";
import FadeInOnMount from "@/components/FadeInOnMount";
import PageLoadingWrapper from "@/components/PageLoadingWrapper";
import LoadingPage from "@/components/LoadingPage";

export default function TokoPage() {
  return (
    <PageLoadingWrapper>
      <Suspense fallback={<LoadingPage />}>
        <DaftarProduk />
      </Suspense>
    </PageLoadingWrapper>
  );
}

async function DaftarProduk() {
  await connection();
  const produkAktif = await getDb()
    .select()
    .from(produk)
    .where(eq(produk.statusProduk, "aktif"))
    .orderBy(desc(produk.createdAt));

  return (
    <FadeInOnMount>
      <EtalaseProduk produkList={produkAktif} />
    </FadeInOnMount>
  );
}
