"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  tandaiTertunda,
} from "@/features/kunjungan/actions/tertunda";
import type { HasilPencatatan } from "@/features/kunjungan/actions/pencatatan";

const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

type FormTertundaMassalProps = {
  /** Tanggal halaman ("YYYY-MM-DD"), batas bawah tanggal paling lambat. */
  tanggal: string;
  /** ID kunjungan berstatus dijadwalkan yang dicentang di tabel. */
  idTerpilih: number[];
  /** Jumlah kunjungan yang bisa dipilih, untuk pesan saat belum ada pilihan. */
  jumlahBisaDipilih: number;
};

/**
 * Form tandai tertunda untuk semua kunjungan yang dicentang di tabel.
 * Alasan dan tanggal paling lambat dikirim bersama ID terpilih; tanggal paling
 * lambat tidak boleh sebelum tanggal kunjungan (dicek server dan database).
 */
export function FormTertundaMassal({
  tanggal,
  idTerpilih,
  jumlahBisaDipilih,
}: FormTertundaMassalProps) {
  const [hasil, aksi, sedangMenyimpan] = useActionState<
    HasilPencatatan | null,
    FormData
  >(tandaiTertunda, null);
  const gagal = hasil?.ok === false ? hasil : null;
  const adaPilihan = idTerpilih.length > 0;

  return (
    <form
      action={aksi}
      noValidate
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
    >
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">
          Tandai tertunda
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Centang kunjungan berstatus dijadwalkan di tabel, lalu isi alasan dan
          tanggal paling lambat. {adaPilihan
            ? `${idTerpilih.length} kunjungan dipilih.`
            : jumlahBisaDipilih === 0
              ? "Tidak ada kunjungan yang bisa ditandai tertunda pada tanggal ini."
              : "Belum ada kunjungan yang dicentang."}
        </p>
      </div>

      {idTerpilih.map((id) => (
        <input key={id} type="hidden" name="idKunjungan" value={id} />
      ))}

      <Field label="Alasan" error={gagal?.galat?.alasan?.[0]}>
        <textarea
          name="alasan"
          rows={2}
          maxLength={300}
          required
          placeholder="Contoh: truk pengangkut rusak"
          className={KELAS_ISIAN}
        />
      </Field>
      <Field
        label="Tanggal paling lambat"
        error={gagal?.galat?.tanggalPalingLambat?.[0]}
      >
        <input
          type="date"
          name="tanggalPalingLambat"
          min={tanggal}
          required
          className={KELAS_ISIAN}
        />
      </Field>
      {gagal?.galat?.idKunjungan?.[0] && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {gagal.galat.idKunjungan[0]}
        </p>
      )}

      {hasil?.ok === true && <Alert varian="sukses">{hasil.pesan}</Alert>}
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button type="submit" disabled={sedangMenyimpan || !adaPilihan}>
        {sedangMenyimpan ? "Menyimpan…" : "Tandai tertunda"}
      </Button>
    </form>
  );
}
