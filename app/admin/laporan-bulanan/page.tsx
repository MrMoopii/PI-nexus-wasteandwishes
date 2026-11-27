import { Suspense } from "react";
import { connection } from "next/server";
import { getLaporanBulanan } from "@/features/laporan/queries/admin";
import { TabelLaporanBulanan } from "./_components/tabel-laporan-bulanan";
import { TombolCetak } from "./_components/tombol-cetak";
import {
  KerangkaLaporanBulanan,
  PemilihLaporan,
} from "./_components/pemilih-laporan-bulanan";

/**
 * Halaman laporan bulanan (kode tugas 2.5): admin memilih bulan dan satu
 * instansi atau semua lewat URL (?bulan=, ?instansi=), melihat tabel berat
 * per pengambilan per instansi, lalu mencetak. Hanya admin; dicek
 * middleware, query, dan Server Action.
 */
export default function HalamanLaporanBulanan({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; instansi?: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl font-(family-name:--font-plus-jakarta-sans)">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Berat per pengambilan per instansi untuk satu bulan, hanya
          kunjungan yang sudah ditimbang. Emisi karbon belum dihitung.
        </p>
      </header>
      <Suspense fallback={<KerangkaLaporanBulanan />}>
        <IsiLaporanBulanan searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

// Bagian yang membaca URL dan database, dirender di dalam <Suspense> (CONTRIBUTING 8).
async function IsiLaporanBulanan({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; instansi?: string }>;
}) {
  await connection();
  const params = await searchParams;

  // Query admin memvalidasi ?bulan= dan ?instansi= serta memanggil
  // requireAdmin() sendiri (CONTRIBUTING 7.2 dan 9.8).
  const hasil = await getLaporanBulanan(params.bulan, params.instansi);

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between gap-4">
        <PemilihLaporan hasil={hasil} />
        <TombolCetak />
      </div>
      <TabelLaporanBulanan hasil={hasil} />
    </div>
  );
}
