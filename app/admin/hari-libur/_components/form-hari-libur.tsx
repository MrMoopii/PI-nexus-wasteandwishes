"use client";

import { useActionState, useId } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  tambahHariLibur,
  ubahHariLibur,
  type HasilAksiHariLibur,
} from "@/features/kunjungan/actions/hari-libur";
import {
  ATURAN_HARI_LIBUR,
  LABEL_ATURAN_HARI_LIBUR,
  type AturanHariLibur,
  type HariLiburTampilan,
} from "@/features/kunjungan/types";

const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

// Pilihan awal form tambah; sama dengan default kolom hari_libur.aturan.
const ATURAN_BAWAAN: AturanHariLibur = "geser";

type FormHariLiburProps = {
  /** Batas bawah pilihan tanggal ("YYYY-MM-DD", WIB). Server tetap mengecek ulang. */
  hariIni: string;
  /** Hari libur yang diubah; kosong berarti form tambah. */
  hariLibur?: HariLiburTampilan;
};

/**
 * Form admin untuk menambah hari libur, atau mengubah `hariLibur` jika diisi.
 * Pesan per isian dari server tampil di bawah isiannya; teks yang diketik
 * dikembalikan saat gagal.
 */
export function FormHariLibur({ hariIni, hariLibur }: FormHariLiburProps) {
  const [hasil, aksi, sedangMenyimpan] = useActionState<
    HasilAksiHariLibur | null,
    FormData
  >(hariLibur ? ubahHariLibur : tambahHariLibur, null);
  const idGalatAturan = useId();
  const gagal = hasil?.ok === false ? hasil : null;

  // Saat gagal, tampilkan lagi yang diketik; selain itu nilai tersimpan (ubah) atau kosong (tambah).
  const nilai = gagal?.nilai ?? {
    tanggal: hariLibur?.tanggal,
    keterangan: hariLibur?.keterangan,
    aturan: hariLibur?.aturan,
  };
  const aturanTerpilih = nilai.aturan ?? ATURAN_BAWAAN;
  const galatAturan = gagal?.galat?.aturan?.[0];

  return (
    <form action={aksi} noValidate className="space-y-4">
      {hariLibur && (
        <input type="hidden" name="idHariLibur" value={hariLibur.idHariLibur} />
      )}
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <Field label="Tanggal" error={gagal?.galat?.tanggal?.[0]}>
          <input
            type="date"
            name="tanggal"
            min={hariIni}
            required
            defaultValue={nilai.tanggal}
            className={KELAS_ISIAN}
          />
        </Field>
        <Field label="Keterangan" error={gagal?.galat?.keterangan?.[0]}>
          <input
            type="text"
            name="keterangan"
            maxLength={200}
            required
            placeholder="Contoh: Hari Raya Natal"
            defaultValue={nilai.keterangan}
            className={KELAS_ISIAN}
          />
        </Field>
      </div>

      <fieldset aria-describedby={galatAturan ? idGalatAturan : undefined}>
        <legend className="text-sm font-medium text-waste">Aturan</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {ATURAN_HARI_LIBUR.map((aturan) => (
            <label
              key={aturan}
              className="inline-flex items-center gap-2 text-sm text-gray-800"
            >
              <input
                type="radio"
                name="aturan"
                value={aturan}
                defaultChecked={aturan === aturanTerpilih}
              />
              {LABEL_ATURAN_HARI_LIBUR[aturan]}
            </label>
          ))}
        </div>
        {galatAturan && (
          <p
            id={idGalatAturan}
            className="mt-1.5 text-xs font-medium text-red-600"
          >
            {galatAturan}
          </p>
        )}
      </fieldset>

      {hasil?.ok === true && <Alert varian="sukses">{hasil.pesan}</Alert>}
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button type="submit" disabled={sedangMenyimpan}>
        {sedangMenyimpan
          ? "Menyimpan…"
          : hariLibur
            ? "Simpan perubahan"
            : "Tambah hari libur"}
      </Button>
    </form>
  );
}
