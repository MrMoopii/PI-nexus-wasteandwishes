import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { getTrackerSaya } from "@/features/kunjungan/queries/pelanggan";
import { DaftarKunjungan } from "./_components/daftar-kunjungan";
import { FormLaporan } from "./_components/form-laporan";
import { KerangkaTracker } from "./_components/kerangka-tracker";
import { Pemberitahuan } from "./_components/pemberitahuan";
import { PermintaanSaya } from "./_components/permintaan-saya";
import { StatusHariIni } from "./_components/status-hari-ini";

/**
 * Halaman tracker pelanggan (kode tugas 2.4): status hari ini, jadwal, riwayat,
 * pemberitahuan, dan laporan ke admin. Login dicek middleware dan query; langganan
 * aktif dicek query dan setiap Server Action, bukan hanya di tampilan.
 */
export default function HalamanTracker() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-waste">
          Tracker pengambilan
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Pengambilan Sampah Saya
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Pantau jadwal dan hasil pengambilan sampah organik Anda, sampaikan
          kendala, atau minta satu pengambilan dilewati.
        </p>
      </header>
      <Suspense fallback={<KerangkaTracker />}>
        <IsiTracker />
      </Suspense>
    </div>
  );
}

// Bagian yang membaca sesi dan database, dirender di dalam <Suspense> (CONTRIBUTING 8).
async function IsiTracker() {
  await connection();
  const data = await getTrackerSaya();

  // Pesan tampil di halaman ini, tidak dialihkan, supaya pelanggan tahu alasannya (CONTRIBUTING 9.4).
  if (!data.aktif) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          Tracker belum tersedia
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Tracker hanya untuk pelanggan dengan langganan aktif. Ajukan langganan
          atau perpanjang langganan Anda terlebih dahulu.
        </p>
        <Link
          href="/langganan"
          className="mt-6 inline-flex rounded-lg bg-waste px-4 py-2 text-sm font-semibold text-white transition hover:bg-waste-dark"
        >
          Buka halaman langganan
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StatusHariIni
        hariIni={data.hariIni}
        kunjungan={data.kunjunganHariIni}
        mendatang={data.mendatang}
        total={data.total}
        jadwalTetap={data.jadwalTetap}
        libur={data.libur}
      />
      <Pemberitahuan
        hariIni={data.hariIni}
        tertunda={data.tertunda}
        libur={data.libur}
        perubahanPola={data.perubahanPola}
        adaKunjunganHariIni={data.kunjunganHariIni !== null}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <DaftarKunjungan
            judul="Jadwal mendatang"
            keterangan="20 kunjungan berikutnya yang sudah dibuat tim Waste and Wishes."
            daftar={data.mendatang}
            kosong="Belum ada jadwal mendatang."
          />
          <DaftarKunjungan
            judul="Riwayat"
            keterangan="20 kunjungan terakhir. Total di atas dihitung dari seluruh riwayat."
            daftar={data.riwayat}
            kosong="Belum ada riwayat pengambilan."
          />
        </div>
        <div className="space-y-6">
          <FormLaporan
            pilihanKendala={data.pilihanKendala}
            pilihanLewati={data.pilihanLewati}
            akhirLangganan={data.akhirLangganan}
          />
          <PermintaanSaya daftar={data.permintaan} />
        </div>
      </div>
    </div>
  );
}
