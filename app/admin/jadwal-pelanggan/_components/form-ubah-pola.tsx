"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  ubahPolaJadwal,
  type HasilUbahPola,
} from "@/features/kunjungan/actions/ubah-pola";
import type { NilaiIsianUbahPola } from "@/features/kunjungan/validasi/ubah-pola";

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

type FormUbahPolaProps = {
  idPengajuan: number;
  /** Pola saat ini, dipakai sebagai nilai awal form. */
  nilaiAwal: NilaiIsianUbahPola;
  /** Batas bawah pilihan tanggal berlaku (WIB). Server tetap mengecek ulang. */
  hariIni: string;
  /** Nama instansi, untuk judul tombol simpan. */
  namaInstansi: string;
};

/**
 * Form admin untuk mengubah pola jadwal tetap satu pelanggan: hari, jam, tanggal
 * mulai berlaku, dan alasan. Pesan per isian dari server tampil di bawah isiannya;
 * teks yang diketik dikembalikan server saat gagal. Isian jam selalu tampil karena
 * pelanggan MOU wajib punya rentang jam; pelanggan reguler boleh mengosongkannya.
 */
export function FormUbahPola({
  idPengajuan,
  nilaiAwal,
  hariIni,
  namaInstansi,
}: FormUbahPolaProps) {
  const [hasil, aksi, sedangMenyimpan] = useActionState<
    HasilUbahPola | null,
    FormData
  >(ubahPolaJadwal, null);

  const gagal = hasil?.ok === false ? hasil : null;
  const nilai = gagal?.nilai ?? nilaiAwal;
  const galat = gagal?.galat ?? {};
  const hariTerpilih = new Set(nilai.hariPengambilan ?? []);
  const galatHari = galat.hariPengambilan?.[0];

  return (
    <form action={aksi} noValidate className="space-y-4">
      <input type="hidden" name="idPengajuan" value={idPengajuan} />
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      {hasil?.ok === true && (
        <Alert varian="sukses">
          {hasil.pesan} {hasil.dibatalkan} kunjungan dibatalkan, {hasil.dibuat}{" "}
          kunjungan dibuat ulang.
        </Alert>
      )}

      <fieldset
        aria-describedby={galatHari ? `galat-hari-${idPengajuan}` : undefined}
      >
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
          <p
            id={`galat-hari-${idPengajuan}`}
            className="mt-1.5 text-xs font-medium text-red-600"
          >
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

      <Field label="Tanggal mulai berlaku" error={galat.berlakuMulai?.[0]}>
        <input
          name="berlakuMulai"
          type="date"
          min={hariIni}
          required
          defaultValue={nilai.berlakuMulai ?? hariIni}
          className={KELAS_ISIAN}
        />
      </Field>

      <Field label="Alasan perubahan" error={galat.alasan?.[0]}>
        <textarea
          name="alasan"
          rows={3}
          maxLength={1000}
          required
          placeholder="Contoh: Rute kurir berubah mulai bulan depan"
          defaultValue={nilai.alasan}
          className={KELAS_ISIAN}
        />
      </Field>
      <p className="-mt-2 text-xs text-gray-500">
        Alasan tampil apa adanya ke pelanggan di tracker.
      </p>

      <Button type="submit" disabled={sedangMenyimpan}>
        {sedangMenyimpan ? "Menyimpan…" : `Simpan pola ${namaInstansi}`}
      </Button>
    </form>
  );
}
