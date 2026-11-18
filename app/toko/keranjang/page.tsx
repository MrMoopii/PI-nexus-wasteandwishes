import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ambilKeranjang } from "@/app/toko/keranjang/actions";
import KeranjangClient from "@/app/toko/keranjang/keranjang-client";

export default function KeranjangPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-(--hx-canvas)"
          aria-label="Memuat keranjang"
        />
      }
    >
      <KeranjangData />
    </Suspense>
  );
}

async function KeranjangData() {
  await connection();
  const hasil = await ambilKeranjang();

  if (!hasil.ok) {
    return (
      <div className="min-h-screen bg-(--hx-canvas) px-4 py-20 text-center text-(--hx-ink)">
        <div className="mb-6 flex justify-start px-4 container mx-auto max-w-7xl">
          <Link href="/toko" className="hx-btn-outline">
            Kembali ke Toko
          </Link>
        </div>
        <h1 className="mb-4 text-2xl font-semibold">Keranjang Belanja</h1>
        <p className="mb-6 text-sm text-(--hx-ink-2)">{hasil.error}</p>
        <a href="/auth/login" className="hx-btn-primary">
          Login
        </a>
      </div>
    );
  }

  const keyKeranjang = hasil.items
    .map((item) => `${item.id}:${item.jumlah}`)
    .join(",");

  return <KeranjangClient key={keyKeranjang} itemsAwal={hasil.items} />;
}
