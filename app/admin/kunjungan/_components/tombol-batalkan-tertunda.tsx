"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { batalkanTertunda } from "@/features/kunjungan/actions/tertunda";
import type { HasilPencatatan } from "@/features/kunjungan/actions/pencatatan";

type TombolBatalkanTertundaProps = {
  idKunjungan: number;
  /** Nama instansi, dipakai teks tombol agar admin tahu baris mana yang dibatalkan. */
  namaInstansi: string;
};

/**
 * Tombol admin untuk membatalkan penundaan satu kunjungan. Tanpa dialog browser:
 * hasilnya ditampilkan sebagai notifikasi in-app (sonner), dan status kembali ke
 * dijadwalkan dengan alasan/tanggal paling lambat dikosongkan.
 */
export function TombolBatalkanTertunda({
  idKunjungan,
  namaInstansi,
}: TombolBatalkanTertundaProps) {
  const [hasil, aksi, sedangMemproses] = useActionState<
    HasilPencatatan | null,
    FormData
  >(batalkanTertunda, null);

  // Tampilkan hasil aksi sebagai notifikasi, bukan alert/confirm browser.
  useEffect(() => {
    if (!hasil) return;
    if (hasil.ok) {
      toast.success(hasil.pesan);
    } else {
      toast.error(hasil.pesan);
    }
  }, [hasil]);

  return (
    <form action={aksi} className="mt-3 border-t border-amber-50 pt-3">
      <input type="hidden" name="idKunjungan" value={idKunjungan} />
      <Button
        type="submit"
        varian="garis"
        disabled={sedangMemproses}
        aria-label={`Batalkan penundaan ${namaInstansi}`}
      >
        {sedangMemproses ? "Memproses…" : "Batalkan penundaan"}
      </Button>
    </form>
  );
}
