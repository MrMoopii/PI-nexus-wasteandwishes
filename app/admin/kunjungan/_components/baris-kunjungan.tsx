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
import { FormTandaiTertunda } from "./form-tandai-tertunda";
import { FormUbahPencatatan } from "./form-ubah-pencatatan";
import { FormUbahTertunda } from "./form-ubah-tertunda";
import { TombolBatalkanTertunda } from "./tombol-batalkan-tertunda";

type BarisKunjunganProps = {
  kunjungan: KunjunganHarian;
  /** Tanggal halaman ("YYYY-MM-DD"), batas bawah tanggal paling lambat. */
  tanggal: string;
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
  tanggal,
  dipilih,
  onPilih,
}: BarisKunjunganProps) {
  // Checkbox hanya bisa diklik untuk kunjungan dijadwalkan. Baris tertunda
  // ditampilkan selalu tercentang tapi nonaktif, dan pembatalannya hanya lewat
  // tombol Batalkan penundaan di baris itu (permintaan bos).
  const bisaDipilih = kunjungan.status === "dijadwalkan";
  const tertunda = kunjungan.status === "tertunda";
  const perluLangkah1 = kunjungan.status === "dijadwalkan";

  return (
    <tr className="align-top hover:bg-gray-50/60">
      <td className="p-3">
        <input
          type="checkbox"
          aria-label={`Pilih ${kunjungan.namaInstansi} untuk ditandai tertunda`}
          checked={tertunda || dipilih}
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
        {/* Dicentang: hanya dropdown tandai tertunda yang tampil, berisi alasan
            dan tanggal paling lambat. Status baru berubah saat form disimpan. */}
        {dipilih ? (
          <details open>
            <summary className="cursor-pointer text-sm font-medium text-amber-800">
              Tandai tertunda
            </summary>
            <div className="mt-3 min-w-72 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <FormTandaiTertunda
                idKunjungan={kunjungan.idKunjungan}
                tanggal={tanggal}
              />
            </div>
          </details>
        ) : (
          <>
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
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-(--hx-accent)">
                  Catat berat
                </summary>
                <div className="mt-3 min-w-64 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <FormCatatBerat idKunjungan={kunjungan.idKunjungan} />
                </div>
              </details>
            )}
            {kunjungan.status === "ditimbang" && (
              <p className="mt-2 text-xs text-gray-500">Pencatatan selesai.</p>
            )}
            {(kunjungan.status === "diambil" ||
              kunjungan.status === "ditimbang") && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-(--hx-accent)">
                  Edit pencatatan
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
            {kunjungan.status === "tertunda" && (
              <>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium text-(--hx-accent)">
                    Edit penundaan
                  </summary>
                  <div className="mt-3 min-w-72 rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <FormUbahTertunda
                      idKunjungan={kunjungan.idKunjungan}
                      alasan={kunjungan.alasanKendala}
                      tanggalPalingLambat={kunjungan.tanggalPalingLambat}
                      tanggal={tanggal}
                    />
                  </div>
                </details>
                {/* Pembatalan penundaan hanya lewat tombol ini; centang baris
                    sudah tidak bisa dipakai untuk kunjungan tertunda. */}
                <TombolBatalkanTertunda
                  idKunjungan={kunjungan.idKunjungan}
                  namaInstansi={kunjungan.namaInstansi}
                />
              </>
            )}
            {(kunjungan.status === "batal" ||
              kunjungan.status === "dilewati") && (
              <p className="mt-2 text-xs text-gray-500">Tidak ada aksi.</p>
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
          </>
        )}
      </td>
    </tr>
  );
}
