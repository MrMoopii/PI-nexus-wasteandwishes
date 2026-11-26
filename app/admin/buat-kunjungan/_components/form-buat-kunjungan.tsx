"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  buatKunjungan,
  type HasilBuatKunjungan,
} from "@/features/kunjungan/actions/jadwal";
import { formatTanggal } from "@/lib/format-tanggal";

const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

type HasilBerhasil = Extract<HasilBuatKunjungan, { ok: true }>;

/** Kalimat ringkasan hasil; setiap angka hanya disebut jika bermakna. */
function ringkasanHasil(hasil: HasilBerhasil): string[] {
  const rentang = `${formatTanggal(hasil.mulai)} – ${formatTanggal(hasil.selesai)}`;
  if (hasil.jumlahPelanggan === 0 && hasil.tanpaPola === 0) {
    return [`Rentang ${rentang}: tidak ada pelanggan dengan langganan aktif.`];
  }
  const kalimat = [
    `Rentang ${rentang}: ${hasil.dibuat} kunjungan baru dibuat untuk ${hasil.jumlahPelanggan} pelanggan aktif.`,
  ];
  if (hasil.sudahAda > 0) {
    kalimat.push(
      `${hasil.sudahAda} tanggal sudah punya kunjungan, jadi dilewati.`,
    );
  }
  if (hasil.tanpaPola > 0) {
    kalimat.push(
      `${hasil.tanpaPola} pelanggan aktif dilewati karena belum punya pengajuan siap bayar dengan pola hari.`,
    );
  }
  return kalimat;
}

type FormBuatKunjunganProps = {
  /** Tanggal hari ini (WIB), batas bawah dan isian awal tanggal mulai. */
  hariIni: string;
  /** Panjang rentang maksimal, dari skema validasi. Server tetap mengecek ulang. */
  panjangMaks: number;
};

/**
 * Form admin untuk membuat kunjungan dalam satu rentang tanggal. Ringkasan hasil
 * tampil di bawah form; mengirim ulang rentang yang sama tidak membuat kunjungan ganda.
 */
export function FormBuatKunjungan({
  hariIni,
  panjangMaks,
}: FormBuatKunjunganProps) {
  const [hasil, aksi, sedangMembuat] = useActionState<
    HasilBuatKunjungan | null,
    FormData
  >(buatKunjungan, null);
  const gagal = hasil?.ok === false ? hasil : null;

  return (
    <form action={aksi} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tanggal mulai" error={gagal?.galat?.mulai?.[0]}>
          <input
            type="date"
            name="mulai"
            min={hariIni}
            required
            defaultValue={gagal?.nilai?.mulai ?? hariIni}
            className={KELAS_ISIAN}
          />
        </Field>
        <Field label="Tanggal selesai" error={gagal?.galat?.selesai?.[0]}>
          <input
            type="date"
            name="selesai"
            min={hariIni}
            required
            defaultValue={gagal?.nilai?.selesai}
            className={KELAS_ISIAN}
          />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-gray-500">
        Paling panjang {panjangMaks} hari. Kunjungan dari hari libur yang
        digeser boleh jatuh setelah tanggal selesai.
      </p>

      {hasil?.ok === true && (
        <Alert varian={hasil.dibuat > 0 ? "sukses" : "info"}>
          {ringkasanHasil(hasil).map((kalimat) => (
            <p key={kalimat}>{kalimat}</p>
          ))}
        </Alert>
      )}
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button type="submit" disabled={sedangMembuat}>
        {sedangMembuat ? "Membuat kunjungan…" : "Buat kunjungan"}
      </Button>
    </form>
  );
}
