"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  kirimPenawaran,
  type HasilKirimPenawaran,
} from "@/features/langganan/actions/admin";
import type { NilaiIsianPenawaran } from "@/features/langganan/validasi/admin";

const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

// Nilai sama dengan hari_pengambilan di database: 1 = Senin sampai 5 = Jumat.
const HARI_KERJA = [
  { nilai: "1", label: "Senin" },
  { nilai: "2", label: "Selasa" },
  { nilai: "3", label: "Rabu" },
  { nilai: "4", label: "Kamis" },
  { nilai: "5", label: "Jumat" },
];

type FormPenawaranProps = {
  idPengajuan: number;
  /** Isian awal: syarat yang sudah ada (atau bawaan) dan harga penawaran terakhir. */
  nilaiAwal: NilaiIsianPenawaran;
  /** Perkiraan ember dari pelanggan, sebagai patokan jumlah ember. */
  estimasiEmber: number;
};

/**
 * Form admin untuk mengirim penawaran harga dan syarat pengambilan.
 * Pesan error tampil per isian; isian yang diketik dikembalikan server saat gagal.
 */
export function FormPenawaran({
  idPengajuan,
  nilaiAwal,
  estimasiEmber,
}: FormPenawaranProps) {
  const [hasil, aksi, sedangMengirim] = useActionState<
    HasilKirimPenawaran | null,
    FormData
  >(kirimPenawaran, null);

  const gagal = hasil?.ok === false ? hasil : null;
  const nilai = gagal?.nilai ?? nilaiAwal;
  const galat = gagal?.galat ?? {};
  const hariTerpilih = new Set(nilai.hariPengambilan ?? []);
  const galatHari = galat.hariPengambilan?.[0];

  return (
    <form action={aksi} noValidate className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
        Kirim penawaran
      </h3>
      <input type="hidden" name="idPengajuan" value={idPengajuan} />
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Harga per 30 hari (Rp)" error={galat.harga?.[0]}>
          <input
            name="harga"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            required
            defaultValue={nilai.harga}
            className={KELAS_ISIAN}
          />
        </Field>
        <Field label="Jenis pelanggan" error={galat.jenisPelanggan?.[0]}>
          <select
            name="jenisPelanggan"
            required
            defaultValue={nilai.jenisPelanggan ?? ""}
            className={KELAS_ISIAN}
          >
            <option value="" disabled>
              Pilih jenis pelanggan
            </option>
            <option value="reguler">Reguler</option>
            <option value="mou">MOU</option>
          </select>
        </Field>
      </div>

      <fieldset aria-describedby={galatHari ? "galat-hari" : undefined}>
        <legend className="text-sm font-medium text-waste">
          Hari pengambilan
        </legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {HARI_KERJA.map((hari) => (
            <label
              key={hari.nilai}
              className="inline-flex items-center gap-2 text-sm text-gray-800"
            >
              <input
                type="checkbox"
                name="hariPengambilan"
                value={hari.nilai}
                defaultChecked={hariTerpilih.has(hari.nilai)}
              />
              {hari.label}
            </label>
          ))}
        </div>
        {galatHari && (
          <p id="galat-hari" className="mt-1.5 text-xs font-medium text-red-600">
            {galatHari}
          </p>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jam mulai" error={galat.jamMulai?.[0]}>
          <input
            name="jamMulai"
            type="time"
            defaultValue={nilai.jamMulai}
            className={KELAS_ISIAN}
          />
        </Field>
        <Field label="Jam selesai" error={galat.jamSelesai?.[0]}>
          <input
            name="jamSelesai"
            type="time"
            defaultValue={nilai.jamSelesai}
            className={KELAS_ISIAN}
          />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-gray-500">
        Wajib untuk pelanggan MOU. Kosongkan keduanya jika jam menyesuaikan WW.
      </p>

      <Field label="Jumlah ember per pengambilan" error={galat.jumlahEmber?.[0]}>
        <input
          name="jumlahEmber"
          type="number"
          inputMode="numeric"
          min={1}
          max={200}
          step={1}
          required
          defaultValue={nilai.jumlahEmber}
          className={KELAS_ISIAN}
        />
      </Field>
      <p className="-mt-2 text-xs text-gray-500">
        Perkiraan pelanggan: {estimasiEmber} ember.
      </p>

      <Field label="Catatan untuk pelanggan (opsional)" error={galat.catatan?.[0]}>
        <textarea
          name="catatan"
          rows={3}
          maxLength={1000}
          defaultValue={nilai.catatan}
          className={KELAS_ISIAN}
        />
      </Field>

      <Button type="submit" disabled={sedangMengirim}>
        {sedangMengirim ? "Mengirim…" : "Kirim penawaran"}
      </Button>
    </form>
  );
}
