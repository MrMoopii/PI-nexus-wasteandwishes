import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Alert } from "@/components/ui/alert";
import { getDaftarHariLibur } from "@/features/kunjungan/queries/hari-libur";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { DaftarHariLibur } from "./_components/daftar-hari-libur";
import { FormHariLibur } from "./_components/form-hari-libur";
import { KerangkaHariLibur } from "./_components/kerangka-hari-libur";

/**
 * Halaman admin hari libur (kode tugas 2.2): tambah, ubah, dan hapus tanggal libur
 * beserta aturannya. Hanya admin; dicek middleware, query, dan setiap Server Action.
 */
export default function HalamanHariLibur() {
  return (
    <div className="mx-auto w-full max-w-5xl font-(family-name:--font-plus-jakarta-sans)">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hari Libur</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tanggal libur dipakai saat membuat kunjungan di halaman{" "}
          <Link
            href="/admin/buat-kunjungan"
            className="font-medium text-(--hx-accent) hover:underline"
          >
            Buat Kunjungan
          </Link>
          .
        </p>
      </header>
      <Alert className="mb-6">
        Isi hari libur sebelum membuat kunjungan. Kunjungan yang sudah dibuat
        tidak ikut berubah saat hari libur ditambah, diubah, atau dihapus.
        Aturan bawaan &quot;geser&quot; masih usulan dan belum dikonfirmasi WW.
      </Alert>
      <Suspense fallback={<KerangkaHariLibur />}>
        <IsiHariLibur />
      </Suspense>
    </div>
  );
}

// Bagian yang membaca database dan tanggal hari ini, dirender di dalam <Suspense>.
async function IsiHariLibur() {
  await connection();

  // Query admin memanggil requireAdmin() sendiri (CONTRIBUTING 7.2).
  const daftar = await getDaftarHariLibur();
  const hariIni = tanggalHariIniJakarta();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">
          Tambah hari libur
        </h2>
        <FormHariLibur hariIni={hariIni} />
      </section>
      <DaftarHariLibur daftar={daftar} hariIni={hariIni} />
    </div>
  );
}
