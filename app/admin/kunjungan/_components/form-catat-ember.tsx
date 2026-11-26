"use client";

import { useActionState, useState } from "react";
import { ImageKitReportUpload } from "@/components/admin/ImageKitReportUpload";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  catatEmber,
  type HasilPencatatan,
} from "@/features/kunjungan/actions/pencatatan";

const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

type FotoBukti = { url: string; fileId: string };

/**
 * Form langkah 1: jumlah ember dan foto bukti. Foto diunggah ke ImageKit lebih
 * dulu lewat komponen unggah yang sudah ada, lalu url dan fileId-nya dikirim ke
 * Server Action. Tombol simpan baru aktif jika jumlah ember dan foto terisi;
 * isian jumlah ember sengaja kosong (bukan 0) supaya diisi admin sendiri.
 */
export function FormCatatEmber({ idKunjungan }: { idKunjungan: number }) {
  const [hasil, aksi, sedangMenyimpan] = useActionState<
    HasilPencatatan | null,
    FormData
  >(catatEmber, null);
  const [foto, setFoto] = useState<FotoBukti | null>(null);
  const [jumlah, setJumlah] = useState("");
  const gagal = hasil?.ok === false ? hasil : null;
  const bolehSimpan = jumlah.trim() !== "" && foto !== null;

  return (
    <form action={aksi} noValidate className="space-y-3">
      <input type="hidden" name="idKunjungan" value={idKunjungan} />
      <input type="hidden" name="fotoBukti" value={foto?.url ?? ""} />
      <input
        type="hidden"
        name="fotoBuktiFileId"
        value={foto?.fileId ?? ""}
      />

      <Field label="Jumlah ember" error={gagal?.galat?.jumlahEmber?.[0]}>
        <input
          type="number"
          name="jumlahEmber"
          min={0}
          step={1}
          required
          value={jumlah}
          onChange={(event) => setJumlah(event.target.value)}
          className={KELAS_ISIAN}
        />
      </Field>

      <ImageKitReportUpload foto={foto} onChange={setFoto} disabled={sedangMenyimpan} />
      {gagal?.galat?.fotoBukti?.[0] && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {gagal.galat.fotoBukti[0]}
        </p>
      )}

      {hasil?.ok === true && <Alert varian="sukses">{hasil.pesan}</Alert>}
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button
        type="submit"
        disabled={sedangMenyimpan || !bolehSimpan}
        className="w-full"
      >
        {sedangMenyimpan ? "Menyimpan…" : "Simpan ember & foto"}
      </Button>
    </form>
  );
}
