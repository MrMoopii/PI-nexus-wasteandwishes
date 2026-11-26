"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ubahTertunda } from "@/features/kunjungan/actions/tertunda";
import type { HasilPencatatan } from "@/features/kunjungan/actions/pencatatan";
import { tanggalPalingLambatMin } from "@/features/kunjungan/validasi/pencatatan";

const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

type FormUbahTertundaProps = {
  idKunjungan: number;
  /** Alasan tersimpan, tampil sebagai isian awal. */
  alasan: string | null;
  /** Tanggal paling lambat tersimpan ("YYYY-MM-DD"). */
  tanggalPalingLambat: string | null;
  /** Tanggal kunjungan, batas bawah tanggal paling lambat. */
  tanggal: string;
};

/**
 * Form edit penundaan satu kunjungan: alasan dan tanggal paling lambat.
 * Hanya tampil untuk status tertunda; server mengecek ulang status dan tanggal.
 */
export function FormUbahTertunda({
  idKunjungan,
  alasan,
  tanggalPalingLambat,
  tanggal,
}: FormUbahTertundaProps) {
  const [hasil, aksi, sedangMenyimpan] = useActionState<
    HasilPencatatan | null,
    FormData
  >(ubahTertunda, null);
  const [isiAlasan, setIsiAlasan] = useState(alasan ?? "");
  const [isiTanggal, setIsiTanggal] = useState(tanggalPalingLambat ?? "");
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
          value={isiAlasan}
          onChange={(event) => setIsiAlasan(event.target.value)}
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
          value={isiTanggal}
          onChange={(event) => setIsiTanggal(event.target.value)}
          className={KELAS_ISIAN}
        />
      </Field>
      {hasil?.ok === true && <Alert varian="sukses">{hasil.pesan}</Alert>}
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button
        type="submit"
        disabled={
          sedangMenyimpan ||
          isiAlasan.trim() === "" ||
          isiTanggal.trim() === ""
        }
        className="w-full"
      >
        {sedangMenyimpan ? "Menyimpan…" : "Simpan penundaan"}
      </Button>
    </form>
  );
}
