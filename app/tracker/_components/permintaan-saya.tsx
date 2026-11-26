import { Card } from "@/components/ui/card";
import { BadgeStatusLaporan } from "@/features/kunjungan/components/badge-status-laporan";
import {
  LABEL_JENIS_LAPORAN,
  type LaporanTracker,
} from "@/features/kunjungan/types";
import { formatTanggal } from "@/lib/format-tanggal";
import { teksTanggal } from "./daftar-kunjungan";

/** Tanggal kirim laporan. Kolom timestamp diformat di zona Jakarta (CONTRIBUTING 9.2). */
function teksDikirim(waktu: Date): string {
  return waktu.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

/** Penjelasan keadaan laporan yang belum ditanggapi, atau null jika tidak perlu. */
function penjelasanMenunggu(laporan: LaporanTracker): string | null {
  if (laporan.status !== "menunggu" || laporan.jenis !== "lewati") return null;
  if (laporan.tanggalPengganti !== null && !laporan.tanggalPenggantiDisetujui) {
    return "Kunjungan sudah dilewati. Tanggal pengganti menunggu persetujuan admin.";
  }
  return "Kunjungan sudah dilewati. Admin akan membaca alasan Anda.";
}

/** Satu laporan: jenis, status, isi, tanggal pengganti, dan tanggapan admin. */
function ItemLaporan({ laporan }: { laporan: LaporanTracker }) {
  const penjelasan = penjelasanMenunggu(laporan);

  return (
    <li className="space-y-2 px-1 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          {LABEL_JENIS_LAPORAN[laporan.jenis]}
        </p>
        <BadgeStatusLaporan status={laporan.status} />
      </div>
      <p className="text-xs text-slate-500">
        Kunjungan {teksTanggal(laporan.tanggalKunjungan, laporan.hariKunjungan)}{" "}
        · dikirim {teksDikirim(laporan.dibuatPada)}
      </p>
      <p className="whitespace-pre-line wrap-break-word text-sm text-slate-700">
        {laporan.pesan}
      </p>

      {laporan.tanggalPengganti !== null && (
        <p className="text-xs text-slate-600">
          Usulan tanggal pengganti:{" "}
          <span className="font-medium text-slate-800">
            {formatTanggal(laporan.tanggalPengganti)}
          </span>
        </p>
      )}
      {laporan.tanggalPenggantiDisetujui && (
        <p className="text-xs text-slate-600">
          Tanggal pengganti dari admin:{" "}
          <span className="font-medium text-waste-dark">
            {formatTanggal(laporan.tanggalPenggantiDisetujui)}
          </span>
        </p>
      )}
      {penjelasan && <p className="text-xs text-slate-500">{penjelasan}</p>}

      {/* Tanggapan admin (2.6) tampil apa adanya ke pelanggan. */}
      {laporan.tanggapanAdmin && (
        <div className="rounded-lg bg-waste/5 px-3 py-2 text-sm text-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-waste-dark">
            Tanggapan admin
          </p>
          <p className="mt-1 whitespace-pre-line wrap-break-word">
            {laporan.tanggapanAdmin}
          </p>
        </div>
      )}
    </li>
  );
}

/** Kartu 10 laporan terakhir pelanggan beserta tanggapan admin. Hanya menerima props. */
export function PermintaanSaya({ daftar }: { daftar: LaporanTracker[] }) {
  return (
    <Card>
      <div className="px-1 pb-3">
        <h2 className="text-base font-semibold text-slate-900">
          Permintaan saya
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          10 laporan terakhir dan tanggapan admin.
        </p>
      </div>
      {daftar.length === 0 ? (
        <p className="border-t border-slate-100 py-10 text-center text-sm text-slate-500">
          Belum ada laporan.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {daftar.map((laporan) => (
            <ItemLaporan key={laporan.idLaporan} laporan={laporan} />
          ))}
        </ul>
      )}
    </Card>
  );
}
