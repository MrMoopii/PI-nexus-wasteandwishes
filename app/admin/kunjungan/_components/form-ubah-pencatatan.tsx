"use client";

import { useActionState, useState } from "react";
import { ImageKitReportUpload } from "@/components/admin/ImageKitReportUpload";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  ubahPencatatan,
  type HasilPencatatan,
} from "@/features/kunjungan/actions/pencatatan";

const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

type FotoBukti = { url: string; fileId: string };

type FormUbahPencatatanProps = {
  idKunjungan: number;
  /** Nilai tersimpan, ditampilkan sebagai isian awal. */
  jumlahEmber: number | null;
  beratKg: number | null;
  /** Foto tersimpan; dipakai untuk pratinjau dan tombol hapus foto baru. */
  fotoBukti: string | null;
  /** True jika status sudah ditimbang, sehingga berat ikut bisa diubah. */
  bolehUbahBerat: boolean;
};

/**
 * Form edit pencatatan yang sudah tersimpan. Jumlah ember dan foto selalu bisa
 * diubah; berat hanya muncul setelah kunjungan ditimbang. Foto kosong berarti
 * foto lama dipertahankan, dan berat kosong berarti berat lama dipertahankan.
 */
export function FormUbahPencatatan({
  idKunjungan,
  jumlahEmber,
  beratKg,
  fotoBukti,
  bolehUbahBerat,
}: FormUbahPencatatanProps) {
  const [hasil, aksi, sedangMenyimpan] = useActionState<
    HasilPencatatan | null,
    FormData
  >(ubahPencatatan, null);
  const [foto, setFoto] = useState<FotoBukti | null>(null);
  const [jumlah, setJumlah] = useState(jumlahEmber === null ? "" : String(jumlahEmber));
  const [berat, setBerat] = useState(beratKg === null ? "" : String(beratKg));
  const gagal = hasil?.ok === false ? hasil : null;

  // Tombol simpan hanya aktif jika isian wajib terisi: jumlah ember selalu,
  // berat hanya ketika statusnya sudah ditimbang.
  const bolehSimpan =
    jumlah.trim() !== "" && (!bolehUbahBerat || berat.trim() !== "");

  return (
    <form action={aksi} noValidate className="space-y-3">
      <input type="hidden" name="idKunjungan" value={idKunjungan} />
      <input type="hidden" name="fotoBukti" value={foto?.url ?? ""} />
      <input type="hidden" name="fotoBuktiFileId" value={foto?.fileId ?? ""} />

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
      <p className="text-xs text-gray-500">
        {foto === null
          ? fotoBukti === null
            ? "Belum ada foto tersimpan."
            : "Foto lama dipertahankan. Unggah foto baru untuk menggantinya."
          : "Foto baru akan menggantikan foto lama saat disimpan."}
      </p>
      {gagal?.galat?.fotoBukti?.[0] && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {gagal.galat.fotoBukti[0]}
        </p>
      )}

      {bolehUbahBerat && (
        <Field label="Berat (kg)" error={gagal?.galat?.beratKg?.[0]}>
          <input
            type="number"
            name="beratKg"
            min={0}
            step="0.01"
            required
            value={berat}
            onChange={(event) => setBerat(event.target.value)}
            className={KELAS_ISIAN}
          />
        </Field>
      )}

      {hasil?.ok === true && <Alert varian="sukses">{hasil.pesan}</Alert>}
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button type="submit" disabled={sedangMenyimpan || !bolehSimpan} className="w-full">
        {sedangMenyimpan ? "Menyimpan…" : "Simpan perubahan"}
      </Button>
    </form>
  );
}
