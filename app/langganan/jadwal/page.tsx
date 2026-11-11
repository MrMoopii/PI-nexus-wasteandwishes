import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { requireLogin } from "@/lib/require-login";
import { getDb } from "@/lib/db";
import {
  dataLangganan,
  jadwal,
  jadwalRutin,
} from "@/lib/db/schema";
import { simpanJadwalRutin } from "./actions";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function buatPilihanJam(): string[] {
  return Array.from({ length: 29 }, (_, index) => {
    const totalMenit = 8 * 60 + index * 15;
    return `${String(Math.floor(totalMenit / 60)).padStart(2, "0")}:${String(totalMenit % 60).padStart(2, "0")}`;
  });
}

export default function JadwalRutinPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-12">Memuat jadwal rutin...</main>}>
      <JadwalRutinContent searchParams={searchParams} />
    </Suspense>
  );
}

async function JadwalRutinContent({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  await connection();
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");

  const hariIni = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const db = getDb();
  const [langganan] = await db
    .select({ id: dataLangganan.idLangganan })
    .from(dataLangganan)
    .where(and(
      eq(dataLangganan.userId, cek.idUser),
      eq(dataLangganan.statusLangganan, "aktif"),
      sql`${dataLangganan.tanggalAkhirLangganan} >= ${hariIni}::date`,
    ))
    .limit(1);

  if (!langganan) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><p>Jadwal rutin hanya dapat diatur selama langganan aktif.</p><Link href="/langganan" className="mt-4 inline-block text-teal-700 underline">Kembali ke langganan</Link></main>;
  }

  const jadwalMilik = await db
    .select({
      id: jadwal.idJadwal,
      hari: jadwal.hariPengambilan,
      jam: jadwal.jamPengambilan,
      mulai: jadwalRutin.tanggalMulai,
      selesai: jadwalRutin.tanggalSelesai,
    })
    .from(jadwal)
    .innerJoin(jadwalRutin, eq(jadwalRutin.jadwalId, jadwal.idJadwal))
    .where(and(eq(jadwal.langgananId, langganan.id), eq(jadwal.jenisJadwal, "rutin")));

  const bolehUbah = jadwalMilik.length === 0 || jadwalMilik.every((item) => {
    const mulai = new Date(`${item.mulai}T00:00:00Z`);
    const sekarang = new Date(`${hariIni}T00:00:00Z`);
    const senin = new Date(mulai);
    senin.setUTCDate(senin.getUTCDate() - ((senin.getUTCDay() + 6) % 7));
    return sekarang.getTime() >= senin.getTime() + 7 * 24 * 60 * 60 * 1000;
  });
  const jadwalAwal = jadwalMilik.length === 2 ? jadwalMilik : [];
  const slotJam = buatPilihanJam();
  const queryStatus = jadwalMilik.length === 0 ? "baru" : "ubah";

  return (
    <main className="min-h-screen bg-(--hx-canvas) px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/langganan" className="text-sm text-teal-700 underline">Kembali ke langganan</Link>
        <h1 className="mt-5 text-3xl font-bold text-gray-900">Jadwal Pengambilan Rutin</h1>
        <p className="mt-2 text-gray-600">Pilih dua hari yang berbeda. Jadwal tersedia pukul 08.00–15.00 dengan interval 15 menit.</p>
        {status && (
          <p role={status === "tersimpan" ? "status" : "alert"} className={`mt-5 rounded-lg p-4 text-sm ${status === "tersimpan" ? "border border-green-200 bg-green-50 text-green-800" : "border border-red-200 bg-red-50 text-red-800"}`}>
            {status === "tersimpan" && "Jadwal rutin berhasil disimpan."}
            {status === "input-tidak-valid" && "Pilihan hari atau jam tidak valid. Silakan periksa kembali."}
            {status === "sudah-ada" && "Jadwal rutin sudah tersedia. Gunakan ubah jadwal setelah dua pengambilan minggu ini dicatat."}
            {status === "jadwal-tidak-lengkap" && "Jadwal rutin tidak lengkap. Hubungi pengelola untuk bantuan."}
            {status === "belum-boleh-ubah" && "Jadwal dapat diubah setelah admin mencatat dua pengambilan pada minggu ini."}
            {status === "slot-terisi" && "Salah satu slot telah dipakai pelanggan lain. Silakan pilih slot yang berbeda."}
          </p>
        )}
        {jadwalMilik.length > 0 && !bolehUbah ? (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Jadwal belum dapat diubah. Anda dapat mengganti kedua pilihan setelah minggu pertama jadwal selesai; perubahan berlaku mulai minggu depan.
          </p>
        ) : (
          <form action={simpanJadwalRutin} className="mt-6 space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <input type="hidden" name="mode" value={queryStatus} />
            {[0, 1].map((nomor) => {
              const nilai = jadwalAwal[nomor];
              const jamDefault = nilai?.jam.slice(0, 5) ?? "";
              return (
                <fieldset key={nomor} className="grid gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
                  <legend className="px-2 font-semibold text-gray-800">Jadwal {nomor + 1}</legend>
                  <label className="text-sm font-medium text-gray-700">Hari
                    <select name={`hari${nomor + 1}`} required defaultValue={nilai?.hari ?? ""} className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2">
                      <option value="" disabled>Pilih hari</option>
                      {HARI.map((hari) => <option key={hari} value={hari}>{hari}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700">Jam
                    <select name={`jam${nomor + 1}`} required defaultValue={jamDefault} className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2">
                      <option value="" disabled>Pilih jam</option>
                      {slotJam.map((jam) => <option key={jam} value={jam}>{jam}</option>)}
                    </select>
                  </label>
                </fieldset>
              );
            })}
            <button type="submit" className="rounded-md bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800">Simpan Jadwal</button>
          </form>
        )}
      </div>
    </main>
  );
}
