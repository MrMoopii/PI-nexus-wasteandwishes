import { Suspense } from "react";
import { connection } from "next/server";
import { Alert } from "@/components/ui/alert";
import { getPelangganPolaAktif } from "@/features/kunjungan/queries/jadwal-pelanggan";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { DaftarJadwalPelanggan } from "./_components/daftar-jadwal-pelanggan";
import { KerangkaJadwalPelanggan } from "./_components/kerangka-jadwal-pelanggan";

/**
 * Halaman admin "Jadwal Pelanggan" (kode tugas 2.7): daftar pelanggan aktif beserta
 * pola jadwal tetapnya, dan form ubah pola. Hanya admin; dicek middleware, query,
 * dan Server Action.
 */
export default function HalamanJadwalPelanggan() {
  return (
    <div className="mx-auto w-full max-w-5xl font-(family-name:--font-plus-jakarta-sans)">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jadwal Pelanggan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pola jadwal tetap ditentukan Waste and Wishes. Pelanggan tidak bisa
          mengajukan perubahan pola.
        </p>
      </header>
      <Alert className="mb-6">
        Menyimpan pola baru mencatat riwayat perubahan, membatalkan kunjungan
        berstatus dijadwalkan sejak tanggal berlaku, lalu membuat ulang kunjungan
        dari pola baru. Kunjungan yang sudah diambil, ditimbang, tertunda, atau
        dilewati tidak diubah.
      </Alert>
      <Suspense fallback={<KerangkaJadwalPelanggan />}>
        <IsiJadwalPelanggan />
      </Suspense>
    </div>
  );
}

// Bagian yang membaca database dan tanggal hari ini, dirender di dalam <Suspense>.
async function IsiJadwalPelanggan() {
  await connection();

  // Query admin memanggil requireAdmin() sendiri (CONTRIBUTING 7.2).
  const daftar = await getPelangganPolaAktif();

  return (
    <DaftarJadwalPelanggan daftar={daftar} hariIni={tanggalHariIniJakarta()} />
  );
}
