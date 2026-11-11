import { Suspense } from "react";
import Link from "next/link";
import { ProdukContent } from "./ProdukContent";
import { getDb } from "@/lib/db";
import { produk, fotoProduk } from "@/lib/db/schema";
import { desc, asc } from "drizzle-orm";
import { connection } from "next/server";

export const instant = false;

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>
  );
}

export default async function AdminProdukPage() {
  await connection();

  const allProduk = await getDb()
    .select()
    .from(produk)
    .orderBy(desc(produk.createdAt));

  const allFoto = await getDb()
    .select()
    .from(fotoProduk)
    .orderBy(asc(fotoProduk.urutan));

  // Kelompokkan foto berdasarkan productId
  const fotoByProduct: Record<
    number,
    Array<{
      idFoto: number;
      url: string;
      fileId: string;
      urutan: number;
      isPrimary: boolean;
    }>
  > = {};

  for (const f of allFoto) {
    if (!fotoByProduct[f.productId]) {
      fotoByProduct[f.productId] = [];
    }
    fotoByProduct[f.productId].push({
      idFoto: f.idFoto,
      url: f.url,
      fileId: f.fileId,
      urutan: f.urutan,
      isPrimary: f.isPrimary,
    });
  }

  const produkWithPhotos = allProduk.map((p) => {
    const photos = fotoByProduct[p.idProduk] || [];
    const primary = photos.find((x) => x.isPrimary) || photos[0];
    return {
      ...p,
      gambarUtama: primary ? primary.url : p.gambarUrl,
      fotoList: photos,
    };
  });

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/admin" className="hover:text-blue-400 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-medium">Produk</span>
      </nav>

      <Suspense fallback={<LoadingSkeleton />}>
        <ProdukContent produkList={produkWithPhotos} />
      </Suspense>
    </div>
  );
}
