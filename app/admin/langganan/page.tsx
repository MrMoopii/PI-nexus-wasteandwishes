import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getHalamanDaftarPengajuan } from "@/features/langganan/queries/admin";
import { skemaFilterStatus } from "@/features/langganan/validasi/admin";
import { DaftarPengajuan } from "./_components/daftar-pengajuan";
import { KerangkaDaftarPengajuan } from "./_components/kerangka-daftar";

/**
 * Halaman daftar pengajuan langganan untuk admin.
 * Filter status dibaca dari ?status=; kosong berarti semua (CONTRIBUTING 9.3).
 */
export default function HalamanLanggananAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<KerangkaDaftarPengajuan />}>
      <IsiDaftar searchParams={searchParams} />
    </Suspense>
  );
}

// Bagian yang membaca URL dan database, dirender di dalam <Suspense>.
async function IsiDaftar({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await connection();

  // 1. Validasi ?status= sebelum query; nilai yang diisi tetapi tidak dikenal = 404.
  const params = await searchParams;
  const hasil = skemaFilterStatus.safeParse({ status: params.status });
  if (!hasil.success) notFound();

  // 2. Query admin memanggil requireAdmin() sendiri (CONTRIBUTING 7.2).
  const data = await getHalamanDaftarPengajuan(hasil.data.status);

  return (
    <DaftarPengajuan
      daftar={data.daftar}
      jumlahMenunggu={data.jumlahMenunggu}
      statusAktif={hasil.data.status}
    />
  );
}
