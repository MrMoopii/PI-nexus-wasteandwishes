"use client";

import { useActionState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { HasilAksiAdmin } from "@/features/langganan/actions/admin";
import { tolakPengajuan } from "@/features/langganan/actions/admin-status";

/**
 * Form admin untuk menolak pengajuan sebelum siap_bayar, dengan konfirmasi.
 * Alasan wajib dan tampil ke pelanggan; teks yang diketik dikembalikan saat gagal.
 */
export function FormTolak({ idPengajuan }: { idPengajuan: number }) {
  const [hasil, aksi, sedangMengirim] = useActionState<
    HasilAksiAdmin | null,
    FormData
  >(tolakPengajuan, null);
  const gagal = hasil?.ok === false ? hasil : null;

  // preventDefault di onSubmit membuat React tidak menjalankan action.
  function tanyaDulu(e: FormEvent<HTMLFormElement>) {
    const yakin = window.confirm(
      "Tolak pengajuan ini? Pelanggan akan melihat alasan penolakan dan bisa mengajukan ulang.",
    );
    if (!yakin) e.preventDefault();
  }

  return (
    <form
      action={aksi}
      onSubmit={tanyaDulu}
      noValidate
      className="space-y-3 border-t border-gray-100 pt-6"
    >
      <input type="hidden" name="idPengajuan" value={idPengajuan} />
      <Field label="Alasan penolakan (tampil ke pelanggan)">
        <textarea
          name="alasan"
          rows={3}
          maxLength={1000}
          required
          defaultValue={gagal?.teks}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent)"
        />
      </Field>
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button type="submit" varian="garis" disabled={sedangMengirim}>
        {sedangMengirim ? "Menolak…" : "Tolak pengajuan"}
      </Button>
    </form>
  );
}
