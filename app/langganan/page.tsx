import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Alert } from "@/components/ui/alert";
import {
  getAkunLanggananSaya,
  getPengajuanSaya,
} from "@/features/langganan/queries/pelanggan";
import { FormPengajuan } from "./_components/form-pengajuan";
import { KartuKeadaanLangganan } from "./_components/keadaan-langganan";
import { KerangkaLangganan } from "./_components/kerangka-langganan";
import { KartuStatusPengajuan } from "./_components/status-pengajuan";

/** Halaman langganan pelanggan: keadaan langganan, status pengajuan, atau form pengajuan baru. */
export default function HalamanLangganan() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Langganan Saya
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Ajukan dan pantau langganan pengambilan sampah organik Anda.
        </p>
      </header>
      <Suspense fallback={<KerangkaLangganan />}>
        <IsiLangganan />
      </Suspense>
    </main>
  );
}

// Bagian yang membaca data per pengguna, dirender di dalam <Suspense> (CONTRIBUTING 8).
async function IsiLangganan() {
  await connection();
  const [akun, pengajuan] = await Promise.all([
    getAkunLanggananSaya(),
    getPengajuanSaya(),
  ]);

  // Pengajuan ditolak atau dibatalkan tetap tampil sebagai hasil terakhir,
  // dan form pengajuan baru muncul di bawahnya.
  const bolehMengajukanLagi =
    pengajuan === null ||
    pengajuan.status === "ditolak" ||
    pengajuan.status === "dibatalkan";

  return (
    <div className="space-y-6">
      {akun.langganan.keadaan !== "belum_berlangganan" && (
        <KartuKeadaanLangganan
          keadaan={akun.langganan.keadaan}
          tanggalMulai={akun.langganan.tanggalMulai}
          tanggalAkhir={akun.langganan.tanggalAkhir}
        />
      )}

      {pengajuan && <KartuStatusPengajuan pengajuan={pengajuan} />}

      {bolehMengajukanLagi && akun.halangan === "bukan_pelanggan" && (
        <Alert>Akun admin tidak dapat mengajukan langganan.</Alert>
      )}

      {bolehMengajukanLagi && akun.halangan === "profil_belum_lengkap" && (
        <Alert>
          Lengkapi profil Anda terlebih dahulu sebelum mengajukan langganan.{" "}
          <Link href="/lengkapi-profil" className="underline">
            Lengkapi profil
          </Link>
        </Alert>
      )}

      {bolehMengajukanLagi && akun.halangan === null && (
        <FormPengajuan
          isianAwal={{
            alamatPengambilan: akun.profil.alamat ?? undefined,
            namaPic: akun.profil.namaPelanggan ?? undefined,
            telpPic: akun.profil.nomorTelp ?? undefined,
          }}
        />
      )}
    </div>
  );
}
