"use client";

import { useActionState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  hapusHariLibur,
  type HasilAksiHariLibur,
} from "@/features/kunjungan/actions/hari-libur";

type TombolHapusLiburProps = {
  idHariLibur: number;
  /** Tanggal yang sudah diformat, untuk pertanyaan konfirmasi. */
  tanggal: string;
};

/**
 * Tombol admin untuk menghapus satu hari libur, dengan konfirmasi dulu.
 * Pesan gagal (misalnya sudah dihapus di tab lain) tampil di bawah tombol.
 */
export function TombolHapusLibur({ idHariLibur, tanggal }: TombolHapusLiburProps) {
  const [hasil, aksi, sedangMenghapus] = useActionState<
    HasilAksiHariLibur | null,
    FormData
  >(hapusHariLibur, null);

  // preventDefault di onSubmit membuat React tidak menjalankan action.
  function tanyaDulu(e: FormEvent<HTMLFormElement>) {
    const yakin = window.confirm(
      `Hapus hari libur ${tanggal}? Kunjungan yang sudah dibuat tidak ikut berubah.`,
    );
    if (!yakin) e.preventDefault();
  }

  return (
    <form action={aksi} onSubmit={tanyaDulu} className="space-y-2">
      <input type="hidden" name="idHariLibur" value={idHariLibur} />
      <Button type="submit" varian="garis" disabled={sedangMenghapus}>
        {sedangMenghapus ? "Menghapus…" : "Hapus"}
      </Button>
      {hasil?.ok === false && <Alert varian="gagal">{hasil.pesan}</Alert>}
    </form>
  );
}
