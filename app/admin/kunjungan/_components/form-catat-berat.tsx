"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  catatBerat,
  type HasilPencatatan,
} from "@/features/kunjungan/actions/pencatatan";

const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

/**
 * Form langkah 2: berat setelah ditimbang dalam kg. Hanya tampil untuk kunjungan
 * berstatus diambil; server mengecek ulang status sebelum menyimpan.
 */
export function FormCatatBerat({ idKunjungan }: { idKunjungan: number }) {
  const [hasil, aksi, sedangMenyimpan] = useActionState<
    HasilPencatatan | null,
    FormData
  >(catatBerat, null);
  const gagal = hasil?.ok === false ? hasil : null;

  return (
    <form action={aksi} noValidate className="space-y-3">
      <input type="hidden" name="idKunjungan" value={idKunjungan} />
      <Field label="Berat (kg)" error={gagal?.galat?.beratKg?.[0]}>
        <input
          type="number"
          name="beratKg"
          min={0}
          step="0.01"
          required
          placeholder="Contoh: 4.25"
          className={KELAS_ISIAN}
        />
      </Field>
      {hasil?.ok === true && <Alert varian="sukses">{hasil.pesan}</Alert>}
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button type="submit" disabled={sedangMenyimpan} className="w-full">
        {sedangMenyimpan ? "Menyimpan…" : "Simpan berat"}
      </Button>
    </form>
  );
}
