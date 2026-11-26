import { Suspense } from "react";
import { connection } from "next/server";
import { getKunjunganPerTanggal } from "@/features/kunjungan/queries/admin";
import { KerangkaKunjungan } from "./_components/kerangka-kunjungan";
import { PemilihTanggal } from "./_components/pemilih-tanggal";
import { PencatatanHarian } from "./_components/pencatatan-harian";

/**
 * Halaman admin pencatatan kunjungan harian (kode tugas 2.3): daftar kunjungan
 * per tanggal, catat ember dan foto, catat berat, dan tandai tertunda.
 * Hanya admin; dicek middleware, query, dan setiap Server Action.
 */
export default function HalamanKunjungan({
  searchParams,
}: {
  searchParams: Promise<{ tanggal?: string | string[] }>;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl font-(family-name:--font-plus-jakarta-sans)">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pencatatan Kunjungan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Catat jumlah ember dan foto saat pengambilan, lalu berat setelah
          ditimbang. Kunjungan yang belum bisa diambil ditandai tertunda.
        </p>
      </header>
      <Suspense fallback={<KerangkaKunjungan />}>
        <IsiKunjungan searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// Bagian yang membaca URL dan database, dirender di dalam <Suspense> (CONTRIBUTING 8).
async function IsiKunjungan({
  searchParams,
}: {
  searchParams: Promise<{ tanggal?: string | string[] }>;
}) {
  await connection();

  // Query admin memvalidasi ?tanggal= dan memanggil requireAdmin() sendiri (7.2, 9.8).
  const params = await searchParams;
  const { tanggal, daftar } = await getKunjunganPerTanggal(params.tanggal);

  return (
    <div className="space-y-6">
      <PemilihTanggal tanggal={tanggal} />
      <PencatatanHarian tanggal={tanggal} daftar={daftar} />
    </div>
  );
}
