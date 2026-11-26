import { Card } from "@/components/ui/card";
import { BadgeStatusKunjungan } from "@/features/kunjungan/components/badge-status-kunjungan";
import { namaHari, type KunjunganTracker } from "@/features/kunjungan/types";
import { formatTanggal, formatWaktu } from "@/lib/format-tanggal";

// Teks kecil yang dipakai bersama komponen tracker. Tanpa database dan sesi, jadi
// juga aman dipakai form klien.

/** "Senin, 30 November 2026" dari tanggal kolom date dan nomor hari ISO-nya. */
export function teksTanggal(tanggal: string, hari: number): string {
  return `${namaHari(hari)}, ${formatTanggal(tanggal)}`;
}

/** Rentang jam kunjungan, atau "Jam menyesuaikan Waste and Wishes" jika kosong (keputusan mitra). */
export function teksJam(jamMulai: string | null, jamSelesai: string | null): string {
  // Jam diisi berpasangan (CHECK di skema), jadi cukup cek keduanya.
  if (jamMulai !== null && jamSelesai !== null) {
    return formatWaktu(jamMulai, jamSelesai);
  }
  return "Jam menyesuaikan Waste and Wishes";
}

/** Angka dengan pemisah Indonesia, paling banyak dua desimal, misalnya "1.234,5". */
export function teksAngka(angka: number): string {
  return angka.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

/**
 * Keterangan hasil atau kendala satu kunjungan untuk pelanggan, atau null jika tidak
 * ada yang perlu ditulis (dijadwalkan). Kolom yang dijamin CHECK tetap dicek null,
 * supaya data yang rusak tidak tampil sebagai angka karangan.
 */
export function keteranganKunjungan(kunjungan: KunjunganTracker): string | null {
  const { jumlahEmber, beratKg, alasanKendala, tanggalPalingLambat } = kunjungan;
  const ember = jumlahEmber === null ? null : `${jumlahEmber} ember`;

  switch (kunjungan.status) {
    case "dijadwalkan":
      return null;
    case "diambil":
      return ember
        ? `${ember} sudah diambil. Berat menyusul setelah ditimbang.`
        : "Sudah diambil. Berat menyusul setelah ditimbang.";
    case "ditimbang":
      return [ember, beratKg === null ? null : `${teksAngka(beratKg)} kg`]
        .filter((bagian) => bagian !== null)
        .join(" · ");
    case "tertunda":
      // Format pesan tertunda dari keputusan mitra: "Ditunda: alasan. Diambil paling lambat tanggal."
      return [
        alasanKendala ? `Ditunda: ${alasanKendala}.` : "Ditunda.",
        tanggalPalingLambat
          ? `Diambil paling lambat ${formatTanggal(tanggalPalingLambat)}.`
          : null,
      ]
        .filter((bagian) => bagian !== null)
        .join(" ");
    case "batal":
      return alasanKendala
        ? `Pengambilan dibatalkan: ${alasanKendala}.`
        : "Pengambilan dibatalkan.";
    case "dilewati":
      return "Dilewati atas permintaan Anda.";
  }
}

/** Kotak tanggal kecil berisi singkatan hari dan tanggal, misalnya "SEN 30". */
function KotakTanggal({
  tanggal,
  hari,
  redup = false,
}: {
  tanggal: string;
  hari: number;
  /** Warna abu-abu untuk kunjungan batal atau dilewati. */
  redup?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${
        redup ? "bg-slate-100 text-slate-400" : "bg-waste/10 text-waste-dark"
      }`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide">
        {namaHari(hari).slice(0, 3)}
      </span>
      <span className="text-lg font-bold leading-none">
        {Number(tanggal.slice(8, 10))}
      </span>
    </div>
  );
}

/** Satu baris kunjungan: tanggal, jam, status, dan keterangannya. */
function BarisKunjungan({ kunjungan }: { kunjungan: KunjunganTracker }) {
  const keterangan = keteranganKunjungan(kunjungan);
  const redup = kunjungan.status === "batal" || kunjungan.status === "dilewati";

  return (
    <li className="flex items-start gap-4 px-1 py-3.5">
      <KotakTanggal
        tanggal={kunjungan.tanggal}
        hari={kunjungan.hari}
        redup={redup}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-slate-900">
            {teksTanggal(kunjungan.tanggal, kunjungan.hari)}
          </p>
          <BadgeStatusKunjungan status={kunjungan.status} />
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {teksJam(kunjungan.jamMulai, kunjungan.jamSelesai)}
          {kunjungan.penggantiDari !== null && " · Kunjungan pengganti"}
        </p>
        {keterangan && (
          <p className="mt-1.5 text-sm text-slate-700">{keterangan}</p>
        )}
      </div>
    </li>
  );
}

type DaftarKunjunganProps = {
  judul: string;
  /** Kalimat singkat di bawah judul, misalnya batas jumlah yang ditampilkan. */
  keterangan: string;
  daftar: KunjunganTracker[];
  /** Teks saat daftar kosong. */
  kosong: string;
};

/** Kartu daftar kunjungan (jadwal mendatang atau riwayat). Hanya menerima props. */
export function DaftarKunjungan({
  judul,
  keterangan,
  daftar,
  kosong,
}: DaftarKunjunganProps) {
  return (
    <Card>
      <div className="px-1 pb-3">
        <h2 className="text-base font-semibold text-slate-900">{judul}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{keterangan}</p>
      </div>
      {daftar.length === 0 ? (
        <p className="border-t border-slate-100 py-10 text-center text-sm text-slate-500">
          {kosong}
        </p>
      ) : (
        <ol className="divide-y divide-slate-100 border-t border-slate-100">
          {daftar.map((kunjungan) => (
            <BarisKunjungan key={kunjungan.idKunjungan} kunjungan={kunjungan} />
          ))}
        </ol>
      )}
    </Card>
  );
}
