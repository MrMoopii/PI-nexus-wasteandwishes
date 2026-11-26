"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { tandaiTertunda } from "@/features/kunjungan/actions/tertunda";
import type { HasilPencatatan } from "@/features/kunjungan/actions/pencatatan";
import { tanggalPalingLambatMin } from "@/features/kunjungan/validasi/pencatatan";

const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

type FormTandaiTertundaProps = {
  idKunjungan: number;
  /** Tanggal kunjungan ("YYYY-MM-DD"), batas bawah tanggal paling lambat. */
  tanggal: string;
};

/**
 * Form tandai tertunda satu kunjungan, tampil di dropdown baris yang dicentang.
 * Hanya alasan dan tanggal paling lambat; status berubah menjadi tertunda saat
 * disimpan. Server mengecek ulang status dan tanggal.
 */
export function FormTandaiTertunda({
  idKunjungan,
  tanggal,
}: FormTandaiTertundaProps) {
  const [hasil, aksi, sedangMenyimpan] = useActionState<
    HasilPencatatan | null,
    FormData
  >(tandaiTertunda, null);
  const [alasan, setAlasan] = useState("");
  const [tanggalPalingLambat, setTanggalPalingLambat] = useState("");
  const gagal = hasil?.ok === false ? hasil : null;

  return (
    <form action={aksi} noValidate className="space-y-3">
      <input type="hidden" name="idKunjungan" value={idKunjungan} />
      <Field label="Alasan tertunda" error={gagal?.galat?.alasan?.[0]}>
        <textarea
          name="alasan"
          rows={2}
          maxLength={300}
          required
          placeholder="Contoh: truk pengangkut rusak"
          value={alasan}
          onChange={(event) => setAlasan(event.target.value)}
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
          min={tanggalPalingLambatMin(tanggal)}
          required
          value={tanggalPalingLambat}
          onChange={(event) => setTanggalPalingLambat(event.target.value)}
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
      <Button
        type="submit"
        disabled={
          sedangMenyimpan ||
          alasan.trim() === "" ||
          tanggalPalingLambat.trim() === ""
        }
        className="w-full"
      >
        {sedangMenyimpan ? "Menyimpan…" : "Tandai tertunda"}
      </Button>
    </form>
  );
}
