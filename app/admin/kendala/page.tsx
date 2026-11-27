import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getHalamanKendala } from "@/features/kunjungan/queries/kendala";
import { KerangkaKendala } from "./_components/kerangka-kendala";
import { KotakMasuk } from "./_components/kotak-masuk";
import { RiwayatTanggapan } from "./_components/riwayat-tanggapan";

/**
 * Halaman admin laporan kendala (kode tugas 2.6): laporan dan permintaan lewati yang
 * menunggu tanggapan, keputusan tanggal pengganti, dan riwayat yang sudah ditanggapi.
 * Hanya admin; dicek middleware, query, dan setiap Server Action.
 */
export default function HalamanKendala() {
  return (
    <div className="mx-auto w-full max-w-5xl font-(family-name:--font-plus-jakarta-sans)">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Kendala</h1>
        <p className="mt-1 text-sm text-gray-500">
          Laporan dan permintaan lewati dari pelanggan. Kunjungan pengganti yang
          disetujui tampil di halaman{" "}
          <Link
            href="/admin/kunjungan"
            className="font-medium text-(--hx-accent) hover:underline"
          >
            Pencatatan Kunjungan
          </Link>{" "}
          pada tanggalnya.
        </p>
      </header>
      <Suspense fallback={<KerangkaKendala />}>
        <IsiKendala />
      </Suspense>
    </div>
  );
}

// Bagian yang membaca database, dirender di dalam <Suspense> (CONTRIBUTING 8).
async function IsiKendala() {
  await connection();

  // Query admin memanggil requireAdmin() sendiri (CONTRIBUTING 7.2).
  const { hariIni, menunggu, ditanggapi } = await getHalamanKendala();

  return (
    <div className="space-y-6">
      <KotakMasuk menunggu={menunggu} hariIni={hariIni} />
      <RiwayatTanggapan daftar={ditanggapi} />
    </div>
  );
}
