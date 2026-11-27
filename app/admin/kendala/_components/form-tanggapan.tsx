"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  tanggapiLaporan,
  type HasilTanggapan,
} from "@/features/kunjungan/actions/tanggapi-kendala";
import { PANJANG_PESAN_LAPORAN_MAKS } from "@/features/kunjungan/types";
import type { IsianTanggapiLaporan } from "@/features/kunjungan/validasi/tanggapi-kendala";

/** Kelas isian form admin kendala, sama dengan form hari libur. */
export const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

/** Pengingat di bawah setiap isian tanggapan, karena teksnya dibaca pelanggan. */
export const KETERANGAN_TANGGAPAN =
  "Tampil apa adanya di tracker pelanggan, jadi tulis dengan bahasa untuk pelanggan.";

type FormTanggapanProps = {
  idLaporan: number;
  /** Contoh isi tanggapan sesuai jenis laporan. */
  contoh: string;
};

/**
 * Form admin untuk menanggapi laporan kendala, atau lewati tanpa tanggal pengganti.
 * Tanggapan wajib. Berhasil: notifikasi, dan laporan pindah ke Terakhir ditanggapi.
 * Gagal: pesan tampil di form dan teks yang diketik tetap ada.
 */
export function FormTanggapan({ idLaporan, contoh }: FormTanggapanProps) {
  const [tanggapan, setTanggapan] = useState("");
  const [hasil, aksi, sedangMengirim] = useActionState<
    HasilTanggapan<IsianTanggapiLaporan> | null,
    FormData
  >(async (sebelumnya, formData) => {
    const baru = await tanggapiLaporan(sebelumnya, formData);
    // Kartu ini hilang dari kotak masuk setelah berhasil, jadi suksesnya lewat notifikasi.
    if (baru.ok) toast.success(baru.pesan);
    return baru;
  }, null);
  const gagal = hasil?.ok === false ? hasil : null;

  return (
    <form
      action={aksi}
      noValidate
      className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4"
    >
      <input type="hidden" name="idLaporan" value={idLaporan} />
      <Field
        label="Tanggapan untuk pelanggan"
        error={gagal?.galat?.tanggapan?.[0]}
      >
        <textarea
          name="tanggapan"
          value={tanggapan}
          onChange={(e) => setTanggapan(e.target.value)}
          rows={3}
          maxLength={PANJANG_PESAN_LAPORAN_MAKS}
          placeholder={contoh}
          className={KELAS_ISIAN}
        />
      </Field>
      <p className="text-xs text-gray-500">{KETERANGAN_TANGGAPAN}</p>

      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button type="submit" disabled={sedangMengirim}>
        {sedangMengirim ? "Mengirim…" : "Kirim tanggapan"}
      </Button>
    </form>
  );
}
