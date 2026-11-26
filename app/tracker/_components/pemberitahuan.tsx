import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { namaHari, type IsiTracker } from "@/features/kunjungan/types";
import { formatTanggal } from "@/lib/format-tanggal";
import { keteranganKunjungan, teksJam, teksTanggal } from "./daftar-kunjungan";

// Warna garis kiri per jenis pemberitahuan.
const KELAS_NADA = {
  pola: "border-waste",
  tertunda: "border-amber-400",
  libur: "border-sky-400",
} as const;

/** Satu pemberitahuan: judul dan isinya, dengan garis warna di kiri. */
function ItemPemberitahuan({
  nada,
  judul,
  children,
}: {
  nada: keyof typeof KELAS_NADA;
  judul: string;
  children: ReactNode;
}) {
  return (
    <li className="px-1 py-3.5">
      <div className={`border-l-4 pl-4 ${KELAS_NADA[nada]}`}>
        <p className="text-sm font-semibold text-slate-900">{judul}</p>
        <div className="mt-1 space-y-1 text-sm text-slate-600">{children}</div>
      </div>
    </li>
  );
}

type PemberitahuanProps = Pick<
  IsiTracker,
  "hariIni" | "tertunda" | "libur" | "perubahanPola"
> & {
  /** Ada kunjungan hari ini. Jika tidak, libur hari ini sudah tampil di kartu "Hari ini". */
  adaKunjunganHariIni: boolean;
};

/**
 * Pemberitahuan untuk pelanggan: perubahan pola dari admin (2.7), kunjungan
 * tertunda, dan hari libur di hari pola. Tidak ditampilkan jika tidak ada isinya.
 */
export function Pemberitahuan({
  hariIni,
  tertunda,
  libur,
  perubahanPola,
  adaKunjunganHariIni,
}: PemberitahuanProps) {
  // Libur hari ini tetap diberitahukan jika kunjungannya sudah dibuat sebelum libur
  // ditambahkan (keputusan 2.2: kunjungan yang sudah ada tidak diubah).
  const daftarLibur = libur.filter(
    (hari) => hari.tanggal !== hariIni || adaKunjunganHariIni,
  );
  const jumlah = perubahanPola.length + tertunda.length + daftarLibur.length;
  if (jumlah === 0) return null;

  return (
    <Card>
      <div className="flex items-center gap-2 px-1 pb-3">
        <h2 className="text-base font-semibold text-slate-900">
          Pemberitahuan
        </h2>
        <span className="rounded-full bg-waste px-2 py-0.5 text-xs font-semibold text-white">
          {jumlah}
        </span>
      </div>
      <ul className="divide-y divide-slate-100 border-t border-slate-100">
        {perubahanPola.map((perubahan) => (
          <ItemPemberitahuan
            key={`pola-${perubahan.idPerubahan}`}
            nada="pola"
            judul={`Jadwal berubah ${perubahan.berlakuMulai > hariIni ? "mulai" : "sejak"} ${formatTanggal(perubahan.berlakuMulai)}`}
          >
            <p>
              Hari pengambilan menjadi{" "}
              {perubahan.hariPengambilan.map(namaHari).join(", ")},{" "}
              {teksJam(perubahan.jamMulai, perubahan.jamSelesai)}.
            </p>
            <p className="text-slate-500">Alasan: {perubahan.alasan}</p>
          </ItemPemberitahuan>
        ))}

        {tertunda.map((kunjungan) => (
          <ItemPemberitahuan
            key={`tertunda-${kunjungan.idKunjungan}`}
            nada="tertunda"
            judul={`Pengambilan ${teksTanggal(kunjungan.tanggal, kunjungan.hari)} tertunda`}
          >
            <p>{keteranganKunjungan(kunjungan)}</p>
          </ItemPemberitahuan>
        ))}

        {daftarLibur.map((hari) => (
          <ItemPemberitahuan
            key={`libur-${hari.tanggal}`}
            nada="libur"
            judul={`Libur ${teksTanggal(hari.tanggal, hari.hari)}`}
          >
            {/* Format pesan libur dari keputusan mitra: "Ditunda: <keterangan>. Diambil paling lambat <tanggal>." */}
            <p>
              {hari.diambilPalingLambat
                ? `Ditunda: ${hari.keterangan}. Diambil paling lambat ${formatTanggal(hari.diambilPalingLambat)}.`
                : `${hari.keterangan}. Tidak ada pengambilan di tanggal ini.`}
            </p>
          </ItemPemberitahuan>
        ))}
      </ul>
    </Card>
  );
}
