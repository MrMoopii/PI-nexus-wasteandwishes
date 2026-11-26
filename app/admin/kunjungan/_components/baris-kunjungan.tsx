"use client";

import { Badge } from "@/components/ui/badge";
import {
  LABEL_STATUS_KUNJUNGAN,
  type StatusKunjungan,
} from "@/features/kunjungan/types";
import type { KunjunganHarian } from "@/features/kunjungan/queries/admin";
import { formatJam, formatTanggal } from "@/lib/format-tanggal";
import { FormCatatBerat } from "./form-catat-berat";
import { FormCatatEmber } from "./form-catat-ember";
import { FormUbahPencatatan } from "./form-ubah-pencatatan";

type BarisKunjunganProps = {
  kunjungan: KunjunganHarian;
  dipilih: boolean;
  onPilih: (id: number, dicentang: boolean) => void;
};

/** Warna badge per status, tanpa logika bisnis di komponen umum. */
function varianStatus(
  status: StatusKunjungan,
): "sukses" | "peringatan" | "bahaya" | "netral" {
  if (status === "ditimbang") return "sukses";
  if (status === "tertunda") return "peringatan";
  if (status === "batal" || status === "dilewati") return "bahaya";
  return "netral";
}

/** Rentang jam kunjungan; jam kosong berarti menyesuaikan WW. */
function teksJam(kunjungan: KunjunganHarian): string {
  if (kunjungan.jamMulai === null || kunjungan.jamSelesai === null) {
    return "Jam menyesuaikan";
  }
  return `${formatJam(kunjungan.jamMulai)}–${formatJam(kunjungan.jamSelesai)} WIB`;
}

/** Satu baris tabel pencatatan: data kunjungan dan aksi sesuai statusnya. */
export function BarisKunjungan({
  kunjungan,
  dipilih,
  onPilih,
}: BarisKunjunganProps) {
  const bisaDipilih = kunjungan.status === "dijadwalkan";
  const perluLangkah1 =
    kunjungan.status === "dijadwalkan" || kunjungan.status === "tertunda";

  return (
    <tr className="align-top hover:bg-gray-50/60">
      <td className="p-3">
        <input
          type="checkbox"
          aria-label={`Pilih ${kunjungan.namaInstansi} untuk ditandai tertunda`}
          checked={dipilih}
          disabled={!bisaDipilih}
          onChange={(event) => onPilih(kunjungan.idKunjungan, event.target.checked)}
        />
      </td>
      <td className="p-3">
        <p className="font-medium text-gray-900">{kunjungan.namaInstansi}</p>
        {kunjungan.status === "tertunda" && (
          <p className="mt-1 text-xs text-amber-800">
            {kunjungan.alasanKendala}
            {kunjungan.tanggalPalingLambat
              ? ` · paling lambat ${formatTanggal(kunjungan.tanggalPalingLambat)}`
              : ""}
          </p>
        )}
      </td>
      <td className="p-3 text-gray-600">{teksJam(kunjungan)}</td>
      <td className="p-3">
        <Badge varian={varianStatus(kunjungan.status)}>
          {LABEL_STATUS_KUNJUNGAN[kunjungan.status]}
        </Badge>
      </td>
      <td className="p-3 text-gray-600">{kunjungan.jumlahEmber ?? "-"}</td>
      <td className="p-3 text-gray-600">
        {kunjungan.beratKg === null ? "-" : `${kunjungan.beratKg} kg`}
      </td>
      <td className="p-3">
        {perluLangkah1 && (
          <details>
            <summary className="cursor-pointer text-sm font-medium text-(--hx-accent)">
              Catat ember &amp; foto
            </summary>
            <div className="mt-3 min-w-72 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <FormCatatEmber idKunjungan={kunjungan.idKunjungan} />
            </div>
          </details>
        )}
        {kunjungan.status === "diambil" && (
          <details>
            <summary className="cursor-pointer text-sm font-medium text-(--hx-accent)">
              Catat berat
            </summary>
            <div className="mt-3 min-w-64 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <FormCatatBerat idKunjungan={kunjungan.idKunjungan} />
            </div>
          </details>
        )}
        {kunjungan.status === "ditimbang" && (
          <p className="text-xs text-gray-500">Pencatatan selesai.</p>
        )}
        {(kunjungan.status === "diambil" || kunjungan.status === "ditimbang") && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-(--hx-accent)">
              Edit
            </summary>
            <div className="mt-3 min-w-72 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <FormUbahPencatatan
                idKunjungan={kunjungan.idKunjungan}
                jumlahEmber={kunjungan.jumlahEmber}
                beratKg={kunjungan.beratKg}
                fotoBukti={kunjungan.fotoBukti}
                bolehUbahBerat={kunjungan.status === "ditimbang"}
              />
            </div>
          </details>
        )}
        {(kunjungan.status === "batal" || kunjungan.status === "dilewati") && (
          <p className="text-xs text-gray-500">Tidak ada aksi.</p>
        )}
        {kunjungan.fotoBukti !== null && (
          <a
            href={kunjungan.fotoBukti}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-xs font-medium text-(--hx-accent) hover:underline"
          >
            Lihat foto bukti
          </a>
        )}
      </td>
    </tr>
  );
}
