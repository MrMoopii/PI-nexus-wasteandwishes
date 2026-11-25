"use client";

import { useActionState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  batalkanPengajuan,
  type HasilBatalPengajuan,
} from "@/features/langganan/actions/pelanggan";

/**
 * Tombol pelanggan untuk membatalkan pengajuannya, dengan konfirmasi dulu.
 * Boleh tidaknya dibatalkan tetap dicek ulang di batalkanPengajuan().
 */
export function TombolBatal({ idPengajuan }: { idPengajuan: number }) {
  const [hasil, aksi, sedangMembatalkan] = useActionState<
    HasilBatalPengajuan | null,
    FormData
  >(batalkanPengajuan, null);

  // preventDefault di onSubmit membuat React tidak menjalankan action.
  function konfirmasi(e: FormEvent<HTMLFormElement>) {
    const yakin = window.confirm(
      "Batalkan pengajuan ini? Anda bisa mengirim pengajuan baru setelahnya.",
    );
    if (!yakin) e.preventDefault();
  }

  return (
    <form action={aksi} onSubmit={konfirmasi} className="space-y-3">
      <input type="hidden" name="idPengajuan" value={idPengajuan} />
      <Button type="submit" varian="garis" disabled={sedangMembatalkan}>
        {sedangMembatalkan ? "Membatalkan…" : "Batalkan pengajuan"}
      </Button>
      {hasil?.ok === false && <Alert varian="gagal">{hasil.pesan}</Alert>}
    </form>
  );
}
