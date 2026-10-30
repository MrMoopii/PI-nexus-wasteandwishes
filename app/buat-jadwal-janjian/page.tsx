import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  dataLangganan,
  jadwal,
  jadwalJanjian,
} from "@/lib/db/schema";
import { formatJam } from "@/lib/format-tanggal";
import { ajukanJadwalJanjian } from "./actions";

export const instant = false;

export default async function LanggananPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Langganan Saya
        </h1>
        <nav
          aria-label="Tab langganan"
          className="mb-6 flex overflow-x-auto border-b border-gray-200"
        >
          <Link
            href="/buat-jadwal-janjian"
            aria-current="page"
            className="whitespace-nowrap border-b-2 border-blue-600 px-6 py-4 text-sm font-medium text-blue-600"
          >
            JADWAL PENGAMBILAN JANJIAN
          </Link>
        </nav>
        {status === "permintaan-terkirim" && (
          <p className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800" role="status">
            Permintaan jadwal berhasil dikirim. Silakan menunggu kabar dari
            pihak pengelola mengenai persetujuan jadwal janjian Anda.
          </p>
        )}
        {status === "input-tidak-valid" && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
            Data permintaan belum valid. Periksa kembali hari, jam, dan
            keterangan tujuan.
          </p>
        )}
        {status === "langganan-tidak-aktif" && (
          <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="status">
            Permintaan jadwal hanya tersedia untuk pengguna dengan langganan
            aktif.
          </p>
        )}
        <JadwalJanjianContent />
      </div>
    </main>
  );
}

async function JadwalJanjianContent() {
  await connection();
  const session = await auth();
  const idUser = Number(session?.user?.idUser);

  if (!(Number.isInteger(idUser) && idUser > 0)) {
    redirect("/auth/login");
  }

  const schedules = await getDb()
    .select({
      idJadwal: jadwal.idJadwal,
      hariPengambilan: jadwal.hariPengambilan,
      jamPengambilan: jadwal.jamPengambilan,
      statusLangganan: dataLangganan.statusLangganan,
      keteranganTujuan: jadwalJanjian.keteranganTujuan,
      statusKonfirmasi: jadwalJanjian.statusKonfirmasi,
    })
    .from(dataLangganan)
    .innerJoin(jadwal, eq(jadwal.langgananId, dataLangganan.idLangganan))
    .innerJoin(jadwalJanjian, eq(jadwalJanjian.jadwalId, jadwal.idJadwal))
    .where(
      and(
        eq(dataLangganan.userId, idUser),
        eq(jadwal.jenisJadwal, "janjian"),
      ),
    );

  const [langgananAktif] = await getDb()
    .select({ idLangganan: dataLangganan.idLangganan })
    .from(dataLangganan)
    .where(
      and(
        eq(dataLangganan.userId, idUser),
        eq(dataLangganan.statusLangganan, "aktif"),
      ),
    )
    .limit(1);

  return (
    <>
      {langgananAktif ? (
        <form
          action={ajukanJadwalJanjian}
          className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900">
            Ajukan Jadwal Pengambilan
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Isi waktu dan tujuan pengambilan yang Anda inginkan. Pengajuan akan
            berstatus menunggu sampai dikonfirmasi oleh pihak pengelola.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Hari pengambilan
              <select
                name="hariPengambilan"
                required
                defaultValue=""
                className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              >
                <option value="" disabled>Pilih hari</option>
                {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((hari) => (
                  <option key={hari} value={hari}>{hari}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Jam pengambilan
              <input
                name="jamPengambilan"
                type="time"
                required
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
              Keterangan tujuan
              <textarea
                name="keteranganTujuan"
                required
                minLength={5}
                maxLength={500}
                rows={3}
                placeholder="Jelaskan alamat atau kebutuhan pengambilan"
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400"
              />
              <span className="mt-1 block text-xs font-normal text-gray-500">
                Maksimal 500 karakter.
              </span>
            </label>
          </div>
          <button
            type="submit"
            className="mt-5 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Kirim Permintaan
          </button>
        </form>
      ) : (
        <p className="mb-8 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Anda memerlukan langganan aktif untuk mengajukan jadwal pengambilan
          janjian.
        </p>
      )}
      {schedules.length === 0 ? (
    <section className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-gray-900">
        Belum ada permintaan jadwal pengambilan
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Setelah mengirim permintaan, status dan detail jadwal akan ditampilkan di sini.
      </p>
    </section>
  ) : (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Hari Pengambilan</th>
              <th className="px-5 py-4 font-semibold">Jam</th>
              <th className="px-5 py-4 font-semibold">Keterangan Tujuan</th>
              <th className="px-5 py-4 font-semibold">Status Konfirmasi</th>
              <th className="px-5 py-4 font-semibold">Status Langganan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {schedules.map((schedule) => (
              <tr key={schedule.idJadwal}>
                <td className="px-5 py-4 font-medium text-gray-900">
                  {schedule.hariPengambilan}
                </td>
                <td className="px-5 py-4">{formatJam(schedule.jamPengambilan)} WIB</td>
                <td className="px-5 py-4">{schedule.keteranganTujuan}</td>
                <td className="px-5 py-4">{schedule.statusKonfirmasi}</td>
                <td className="px-5 py-4">{schedule.statusLangganan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
      )}
    </>
  );
}
