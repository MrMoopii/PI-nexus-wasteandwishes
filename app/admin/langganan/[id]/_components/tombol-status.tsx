"use client";

import { useActionState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { HasilAksiAdmin } from "@/features/langganan/actions/admin";

type TombolStatusProps = {
  /** Server Action perubahan status dari actions/admin-status.ts. */
  aksi: (
    sebelumnya: HasilAksiAdmin | null,
    formData: FormData,
  ) => Promise<HasilAksiAdmin>;
  idPengajuan: number;
  /** ID tawaran yang tampil di layar, khusus untuk terimaTawaran(). */
  idPesan?: number;
  label: string;
  /** Pertanyaan konfirmasi sebelum aksi dijalankan. */
  konfirmasi: string;
};

/**
 * Tombol satu aksi perubahan status oleh admin, dengan konfirmasi dulu.
 * Boleh tidaknya aksi tetap dicek ulang di Server Action; pesan gagal tampil di bawah tombol.
 */
export function TombolStatus({
  aksi,
  idPengajuan,
  idPesan,
  label,
  konfirmasi,
}: TombolStatusProps) {
  const [hasil, jalankan, sedangMemproses] = useActionState<
    HasilAksiAdmin | null,
    FormData
  >(aksi, null);

  // preventDefault di onSubmit membuat React tidak menjalankan action.
  function tanyaDulu(e: FormEvent<HTMLFormElement>) {
    if (!window.confirm(konfirmasi)) e.preventDefault();
  }

  return (
    <form action={jalankan} onSubmit={tanyaDulu} className="space-y-2">
      <input type="hidden" name="idPengajuan" value={idPengajuan} />
      {idPesan !== undefined && (
        <input type="hidden" name="idPesan" value={idPesan} />
      )}
      <Button type="submit" disabled={sedangMemproses}>
        {sedangMemproses ? "Memproses…" : label}
      </Button>
      {hasil?.ok === false && <Alert varian="gagal">{hasil.pesan}</Alert>}
    </form>
  );
}
