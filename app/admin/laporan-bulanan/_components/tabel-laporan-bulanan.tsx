import { formatBulan, formatJam, formatTanggal } from "@/lib/format-tanggal";
import type {
  BarisLaporan,
  HasilLaporanBulanan,
} from "@/features/laporan/types";

/** Rentang jam satu kunjungan; jam kosong berarti menyesuaikan WW (jam selalu berpasangan). */
function teksJam(baris: BarisLaporan): string {
  if (baris.jamMulai === null || baris.jamSelesai === null) {
    return "Jam menyesuaikan WW";
  }
  return `${formatJam(baris.jamMulai)}–${formatJam(baris.jamSelesai)} WIB`;
}

/** Tabel laporan bulanan: per instansi, daftar berat per pengambilan, dan total. */
export function TabelLaporanBulanan({
  hasil,
}: {
  hasil: HasilLaporanBulanan;
}) {
  return (
    <div className="print-area space-y-6">
      <section className="hidden print:block">
        <p className="text-sm font-semibold text-gray-900">
          Laporan Bulanan {formatBulan(hasil.bulan)}
        </p>
        <p className="text-xs text-gray-500">
          Hanya kunjungan yang sudah ditimbang. Cetak oleh admin Waste and
          Wishes.
        </p>
      </section>

      {hasil.daftar.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
          Belum ada kunjungan ditimbang di bulan ini untuk filter yang dipilih.
        </p>
      ) : (
        hasil.daftar.map((rekap) => (
          <section
            key={rekap.idPengajuan}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm print:break-inside-avoid"
          >
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                {rekap.namaInstansi}
              </h2>
              <p className="text-xs text-gray-500">
                Total {rekap.totalEmber} ember, {rekap.totalBeratKg.toFixed(2)} kg
              </p>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Jam</th>
                  <th className="px-4 py-3 font-semibold">Ember</th>
                  <th className="px-4 py-3 font-semibold">Berat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rekap.daftar.map((baris, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{formatTanggal(baris.tanggal)}</td>
                    <td className="px-4 py-2">{teksJam(baris)}</td>
                    <td className="px-4 py-2">{baris.jumlahEmber ?? "-"}</td>
                    <td className="px-4 py-2">{baris.beratKg.toFixed(2)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))
      )}

      {hasil.daftar.length > 0 && (
        <p className="text-sm font-semibold text-gray-700 print:break-inside-avoid">
          Total semua instansi: {hasil.totalEmber} ember,{" "}
          {hasil.totalBeratKg.toFixed(2)} kg
        </p>
      )}
    </div>
  );
}
