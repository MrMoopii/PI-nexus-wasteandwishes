import { Suspense } from "react";
import { connection } from "next/server";
import { Alert } from "@/components/ui/alert";
import { getDaftarHariLibur } from "@/features/kunjungan/queries/hari-libur";
import { PANJANG_RENTANG_MAKS } from "@/features/kunjungan/validasi/jadwal";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { FormBuatKunjungan } from "./_components/form-buat-kunjungan";
import { KerangkaBuatKunjungan } from "./_components/kerangka-buat-kunjungan";
import { RingkasanHariLibur } from "./_components/ringkasan-hari-libur";

/**
 * Halaman admin "Buat kunjungan" (kode tugas 2.2): membuat kunjungan pengambilan
 * untuk satu rentang tanggal dari pola hari pelanggan aktif dan hari libur.
 * Hanya admin; dicek middleware, query, dan Server Action.
 */
export default function HalamanBuatKunjungan() {
  return (
    <div className="mx-auto w-full max-w-5xl font-(family-name:--font-plus-jakarta-sans)">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buat Kunjungan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kunjungan pengambilan dibuat dari pola hari setiap pelanggan dengan
          langganan aktif, sampai tanggal akhir langganannya.
        </p>
      </header>
      <Alert className="mb-6">
        Hari libur di bawah ikut dihitung saat kunjungan dibuat. Kunjungan yang
        sudah dibuat tidak ikut berubah jika hari libur diubah belakangan. Aksi
        ini aman dijalankan ulang: tanggal yang sudah punya kunjungan dilewati.
      </Alert>
      <Suspense fallback={<KerangkaBuatKunjungan />}>
        <IsiBuatKunjungan />
      </Suspense>
    </div>
  );
}

// Bagian yang membaca database dan tanggal hari ini, dirender di dalam <Suspense>.
async function IsiBuatKunjungan() {
  await connection();

  // Query admin memanggil requireAdmin() sendiri (CONTRIBUTING 7.2).
  const daftar = await getDaftarHariLibur();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">
          Rentang tanggal
        </h2>
        <FormBuatKunjungan
          hariIni={tanggalHariIniJakarta()}
          panjangMaks={PANJANG_RENTANG_MAKS}
        />
      </section>
      <RingkasanHariLibur daftar={daftar} />
    </div>
  );
}
