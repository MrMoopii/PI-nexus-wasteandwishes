import { Card } from "@/components/ui/card";
import { isHariKerja } from "@/features/kunjungan/jadwal";
import {
  LABEL_STATUS_KUNJUNGAN,
  namaHari,
  type IsiTracker,
  type KunjunganTracker,
} from "@/features/kunjungan/types";
import { formatTanggal } from "@/lib/format-tanggal";
import {
  keteranganKunjungan,
  teksAngka,
  teksJam,
  teksTanggal,
} from "./daftar-kunjungan";

type StatusHariIniProps = Pick<
  IsiTracker,
  "hariIni" | "jadwalTetap" | "mendatang" | "total" | "libur"
> & {
  /** Kunjungan hari ini; null jika tidak ada jadwal hari ini. */
  kunjungan: KunjunganTracker | null;
};

/** Judul dan penjelasan kartu hari ini, dari kunjungan hari ini atau alasan tidak ada kunjungan. */
function isiHariIni({
  hariIni,
  kunjungan,
  libur,
}: Pick<StatusHariIniProps, "hariIni" | "kunjungan" | "libur">): {
  judul: string;
  penjelasan: string;
} {
  if (kunjungan) {
    return {
      judul: LABEL_STATUS_KUNJUNGAN[kunjungan.status],
      penjelasan:
        keteranganKunjungan(kunjungan) ??
        "Sampah Anda dijadwalkan diambil hari ini.",
    };
  }
  if (!isHariKerja(hariIni)) {
    return {
      judul: "Tidak ada pengambilan",
      penjelasan: "Sabtu dan Minggu tidak ada pengambilan.",
    };
  }
  const liburHariIni = libur.find((hari) => hari.tanggal === hariIni);
  if (liburHariIni) {
    return {
      judul: "Hari libur",
      penjelasan: liburHariIni.diambilPalingLambat
        ? `Ditunda: ${liburHariIni.keterangan}. Diambil paling lambat ${formatTanggal(liburHariIni.diambilPalingLambat)}.`
        : `${liburHariIni.keterangan}. Tidak ada pengambilan hari ini.`,
    };
  }
  return {
    judul: "Tidak ada pengambilan",
    penjelasan: "Tidak ada jadwal pengambilan hari ini.",
  };
}

/** Satu angka ringkasan dengan label dan satuannya. */
function Angka({
  label,
  nilai,
  satuan,
}: {
  label: string;
  nilai: string;
  satuan: string;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">
        {nilai}{" "}
        <span className="text-sm font-normal text-slate-500">{satuan}</span>
      </p>
    </div>
  );
}

/**
 * Kartu utama tracker: status pengambilan hari ini, jadwal berikutnya, total ember
 * dan berat, serta pola jadwal tetap. Hanya menerima props.
 */
export function StatusHariIni({
  hariIni,
  kunjungan,
  mendatang,
  total,
  jadwalTetap,
  libur,
}: StatusHariIniProps) {
  const { judul, penjelasan } = isiHariIni({ hariIni, kunjungan, libur });
  const berikutnya =
    mendatang.find((jadwal) => jadwal.status === "dijadwalkan") ?? null;

  return (
    <Card className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-lg bg-linear-to-br from-waste-dark to-teal-900 p-6 text-white sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">
            Hari ini · {formatTanggal(hariIni)}
          </p>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{judul}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-teal-50">
            {penjelasan}
          </p>
          {kunjungan && (
            <p className="mt-4 inline-flex rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium">
              {teksJam(kunjungan.jamMulai, kunjungan.jamSelesai)}
            </p>
          )}
          <div className="mt-6">
            <a
              href="#laporan"
              className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-waste-dark transition hover:bg-teal-50"
            >
              Lapor kendala atau minta lewati
            </a>
          </div>
        </section>

        <section className="flex flex-col divide-y divide-waste/10 rounded-lg border border-waste/15">
          <div className="flex-1 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Jadwal berikutnya
            </p>
            {berikutnya ? (
              <>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {teksTanggal(berikutnya.tanggal, berikutnya.hari)}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {teksJam(berikutnya.jamMulai, berikutnya.jamSelesai)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                Belum ada jadwal berikutnya. Jadwal dibuat oleh tim Waste and
                Wishes.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 divide-x divide-waste/10">
            <Angka
              label="Total ember"
              nilai={teksAngka(total.ember)}
              satuan="ember"
            />
            <Angka label="Total berat" nilai={teksAngka(total.kg)} satuan="kg" />
          </div>
        </section>
      </div>

      {jadwalTetap && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-waste/5 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">
            {jadwalTetap.namaInstansi}
          </span>
          {/* Pemisah hanya di layar lebar; di HP teks jadwal turun ke baris baru. */}
          <span aria-hidden="true" className="hidden sm:inline">
            ·
          </span>
          <span>
            Jadwal tetap{" "}
            {jadwalTetap.hariPengambilan.length > 0
              ? jadwalTetap.hariPengambilan.map(namaHari).join(", ")
              : "belum ditetapkan"}
            , {teksJam(jadwalTetap.jamMulai, jadwalTetap.jamSelesai)}
          </span>
          <span className="text-xs text-slate-500">
            (pola jadwal hanya bisa diubah admin)
          </span>
        </div>
      )}
    </Card>
  );
}
