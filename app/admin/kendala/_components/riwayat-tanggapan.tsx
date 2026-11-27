import type { LaporanAdmin } from "@/features/kunjungan/queries/kendala";
import { KartuLaporan, tanggalPanjang } from "./kartu-laporan";

/** Hasil keputusan untuk permintaan lewati, atau null untuk laporan kendala. */
function teksHasil(laporan: LaporanAdmin): string | null {
  if (laporan.jenis === "kendala") return null;
  if (laporan.tanggalPengganti === null) {
    return "Dilewati tanpa tanggal pengganti.";
  }
  if (laporan.tanggalPenggantiDisetujui === null) {
    return "Tanggal pengganti ditolak.";
  }
  return `Kunjungan pengganti: ${tanggalPanjang(laporan.tanggalPenggantiDisetujui)}.`;
}

/**
 * Riwayat 20 laporan terbaru yang sudah ditanggapi, hanya untuk dibaca. Diurut menurut
 * waktu kirim pelanggan, karena tabel tidak menyimpan waktu ditanggapi. Tertutup saat
 * halaman dibuka supaya perhatian tetap ke kotak masuk. Hanya menerima props.
 */
export function RiwayatTanggapan({ daftar }: { daftar: LaporanAdmin[] }) {
  return (
    <details className="rounded-xl border border-gray-200 bg-white p-6">
      <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-gray-400">
        Terakhir ditanggapi
      </summary>
      <p className="mt-2 text-xs text-gray-500">
        20 laporan terbaru menurut waktu kirim. Tanggapan yang sudah terkirim
        tidak bisa diubah.
      </p>
      {daftar.length === 0 ? (
        <p className="py-10 text-center text-sm font-medium text-gray-500">
          Belum ada laporan yang ditanggapi.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {daftar.map((laporan) => {
            const hasil = teksHasil(laporan);
            return (
              <KartuLaporan key={laporan.idLaporan} laporan={laporan}>
                {hasil && (
                  <p className="text-sm font-medium text-gray-900">{hasil}</p>
                )}
                {laporan.tanggapanAdmin && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-gray-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Tanggapan admin
                    </p>
                    <p className="mt-1 whitespace-pre-line wrap-break-word">
                      {laporan.tanggapanAdmin}
                    </p>
                  </div>
                )}
              </KartuLaporan>
            );
          })}
        </ul>
      )}
    </details>
  );
}
