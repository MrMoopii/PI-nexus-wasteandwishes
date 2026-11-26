"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  kirimPesan,
  type HasilAksiAdmin,
} from "@/features/langganan/actions/admin";

/**
 * Form admin untuk mengirim pesan tanpa harga ke pelanggan.
 * Status pengajuan tidak berubah; teks yang diketik dikembalikan saat gagal.
 */
export function FormPesan({ idPengajuan }: { idPengajuan: number }) {
  const [hasil, aksi, sedangMengirim] = useActionState<
    HasilAksiAdmin | null,
    FormData
  >(kirimPesan, null);
  const gagal = hasil?.ok === false ? hasil : null;

  return (
    <form action={aksi} noValidate className="space-y-3">
      <input type="hidden" name="idPengajuan" value={idPengajuan} />
      <Field label="Kirim pesan ke pelanggan">
        <textarea
          name="pesan"
          rows={3}
          maxLength={1000}
          required
          defaultValue={gagal?.teks}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent)"
        />
      </Field>
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      {hasil?.ok && <Alert varian="sukses">Pesan terkirim.</Alert>}
      <Button type="submit" varian="garis" disabled={sedangMengirim}>
        {sedangMengirim ? "Mengirim…" : "Kirim pesan"}
      </Button>
    </form>
  );
}
