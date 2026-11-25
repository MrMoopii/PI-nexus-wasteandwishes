import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getDetailPengajuan } from "@/features/langganan/queries/admin";
import { skemaIdPengajuan } from "@/features/langganan/validasi/admin";
import { DetailPengajuan } from "./_components/detail-pengajuan";
import { KerangkaDetailPengajuan } from "./_components/kerangka-detail";

/**
 * Halaman detail pengajuan langganan untuk review admin.
 * ID dari URL divalidasi; ID salah atau pengajuan tidak ada menjadi 404 (CONTRIBUTING 9.3).
 */
export default function HalamanDetailLanggananAdmin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<KerangkaDetailPengajuan />}>
      <IsiDetail params={params} />
    </Suspense>
  );
}

// Bagian yang membaca URL dan database, dirender di dalam <Suspense>.
async function IsiDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();

  // 1. Validasi ID sebelum query; ID tidak valid berarti halaman tidak ada.
  const { id } = await params;
  const hasil = skemaIdPengajuan.safeParse({ id });
  if (!hasil.success) notFound();

  // 2. Query admin memanggil requireAdmin() sendiri (CONTRIBUTING 7.2).
  const pengajuan = await getDetailPengajuan(hasil.data.id);
  if (!pengajuan) notFound();

  return <DetailPengajuan pengajuan={pengajuan} />;
}
