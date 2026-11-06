"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ProdukContent } from "./ProdukContent";

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>
  );
}

export default function AdminProdukPage() {
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
        <ProdukContent />
      </Suspense>
    </div>
  );
}
