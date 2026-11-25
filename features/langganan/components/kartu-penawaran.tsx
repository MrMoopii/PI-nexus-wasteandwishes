import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format-angka";
import { formatWaktu } from "@/lib/format-tanggal";

// Angka di hari_pengambilan: 1 = Senin sampai 5 = Jumat (CHECK di schema-langganan.ts).
const NAMA_HARI: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
};

const BELUM_DITETAPKAN = "Belum ditetapkan";

type KartuPenawaranProps = {
  /**
   * Harga per 30 hari yang dipilih pemanggil: harga usulan admin terakhir saat
   * penawaran, atau harga_final setelah disepakati (CONTRIBUTING 9.7).
   */
  harga: number;
  /** Hari pengambilan 1–5; null jika admin belum menetapkan. */
  hariPengambilan: number[] | null;
  /** Format kolom time "HH:MM:SS"; keduanya null berarti jam menyesuaikan WW. */
  jamMulai: string | null;
  jamSelesai: string | null;
  /** Jumlah ember per pengambilan; null jika admin belum menetapkan. */
  jumlahEmber: number | null;
  /** Tempat tombol aksi, misalnya Setujui dan Tawar dari tugas 1.3. */
  aksi?: ReactNode;
};

/** Nama hari pengambilan. Angka di luar 1–5 ditampilkan apa adanya, tidak disembunyikan. */
function teksHari(hariPengambilan: number[] | null): string {
  if (hariPengambilan === null || hariPengambilan.length === 0) {
    return BELUM_DITETAPKAN;
  }
  return hariPengambilan
    .map((angka) => NAMA_HARI[angka] ?? `hari ke-${angka}`)
    .join(", ");
}

/** Rentang jam pengambilan, atau keterangan jam menyesuaikan WW jika kosong. */
function teksJam(jamMulai: string | null, jamSelesai: string | null): string {
  // Jam diisi berpasangan (CHECK di skema); kosong berarti jam menyesuaikan WW (keputusan mitra).
  if (jamMulai !== null && jamSelesai !== null) {
    return formatWaktu(jamMulai, jamSelesai);
  }
  return "Jam menyesuaikan Waste and Wishes";
}

/**
 * Kartu penawaran langganan: harga per 30 hari, hari, jam, dan jumlah ember.
 * Hanya menerima props, dipakai halaman pelanggan dan admin. Tombol aksinya
 * dikirim pemanggil lewat `aksi`; larangannya tetap dicek di Server Action.
 */
export function KartuPenawaran({
  harga,
  hariPengambilan,
  jamMulai,
  jamSelesai,
  jumlahEmber,
  aksi,
}: KartuPenawaranProps) {
  const rincian: [string, string][] = [
    ["Hari pengambilan", teksHari(hariPengambilan)],
    ["Jam pengambilan", teksJam(jamMulai, jamSelesai)],
    [
      "Jumlah ember",
      jumlahEmber === null ? BELUM_DITETAPKAN : `${jumlahEmber} ember`,
    ],
  ];

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h3 className="text-xs uppercase tracking-wide text-slate-500">
          Penawaran harga
        </h3>
        <p className="mt-1 text-2xl font-semibold text-waste">
          {formatRupiah(harga)}{" "}
          <span className="text-sm font-normal text-slate-500">/ 30 hari</span>
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        {rincian.map(([label, isi]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{isi}</dd>
          </div>
        ))}
      </dl>

      {aksi ? (
        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
          {aksi}
        </div>
      ) : null}
    </Card>
  );
}
