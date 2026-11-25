"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import {
  kirimPengajuan,
  type HasilKirimPengajuan,
} from "@/features/langganan/actions/pelanggan";
import {
  JENIS_INSTANSI,
  LABEL_JENIS_INSTANSI,
} from "@/features/langganan/types";
import type { NilaiIsianPengajuan } from "@/features/langganan/validasi/pelanggan";

const KELAS_ISIAN =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-waste focus:outline-none focus:ring-1 focus:ring-waste aria-invalid:border-red-500";

type FormPengajuanProps = {
  /** Isian awal dari profil: alamat, nama PIC, dan telepon PIC. */
  isianAwal: NilaiIsianPengajuan;
};

/**
 * Form pengajuan langganan untuk pelanggan. Pesan error tampil per isian,
 * dan teks yang sudah diketik dikembalikan server saat gagal.
 */
export function FormPengajuan({ isianAwal }: FormPengajuanProps) {
  const [hasil, aksi, sedangMengirim] = useActionState<
    HasilKirimPengajuan | null,
    FormData
  >(kirimPengajuan, null);

  const gagal = hasil?.ok === false ? hasil : null;
  const nilai = gagal?.nilai ?? isianAwal;
  const galat = gagal?.galat ?? {};

  // Isian "Instansi Lain" hanya muncul jika jenis instansi "lainnya" dipilih.
  const [jenisInstansi, setJenisInstansi] = useState(
    nilai.jenisInstansi ?? "",
  );

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Ajukan langganan
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Isi data instansi Anda. Tim Waste and Wishes akan mereview pengajuan
        dan mengirim penawaran harga.
      </p>

      {/* noValidate: pesan error ditampilkan dari server, supaya bahasanya sama. */}
      <form action={aksi} noValidate className="mt-6 space-y-5">
        {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}

        <Field label="Nama instansi" error={galat.namaInstansi?.[0]}>
          <input
            name="namaInstansi"
            defaultValue={nilai.namaInstansi}
            maxLength={100}
            required
            className={KELAS_ISIAN}
          />
        </Field>

        <Field label="Jenis instansi" error={galat.jenisInstansi?.[0]}>
          <select
            name="jenisInstansi"
            defaultValue={nilai.jenisInstansi ?? ""}
            onChange={(e) => setJenisInstansi(e.target.value)}
            required
            className={KELAS_ISIAN}
          >
            <option value="" disabled>
              Pilih jenis instansi
            </option>
            {JENIS_INSTANSI.map((jenis) => (
              <option key={jenis} value={jenis}>
                {LABEL_JENIS_INSTANSI[jenis]}
              </option>
            ))}
          </select>
        </Field>

        {jenisInstansi === "lainnya" && (
          <Field
            label="Tulis jenis instansi"
            error={galat.jenisInstansiLain?.[0]}
          >
            <input
              name="jenisInstansiLain"
              defaultValue={nilai.jenisInstansiLain}
              maxLength={50}
              required
              className={KELAS_ISIAN}
            />
          </Field>
        )}

        <Field label="Alamat pengambilan" error={galat.alamatPengambilan?.[0]}>
          <textarea
            name="alamatPengambilan"
            defaultValue={nilai.alamatPengambilan}
            rows={3}
            maxLength={200}
            required
            className={KELAS_ISIAN}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama PIC" error={galat.namaPic?.[0]}>
            <input
              name="namaPic"
              defaultValue={nilai.namaPic}
              maxLength={100}
              required
              className={KELAS_ISIAN}
            />
          </Field>
          <Field label="Telepon PIC" error={galat.telpPic?.[0]}>
            <input
              name="telpPic"
              type="tel"
              inputMode="tel"
              defaultValue={nilai.telpPic}
              required
              className={KELAS_ISIAN}
            />
          </Field>
        </div>

        <Field
          label="Perkiraan jumlah ember per pengambilan"
          error={galat.estimasiEmber?.[0]}
        >
          <input
            name="estimasiEmber"
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            step={1}
            defaultValue={nilai.estimasiEmber}
            required
            className={KELAS_ISIAN}
          />
        </Field>

        <Field label="Jenis limbah (opsional)" error={galat.jenisLimbah?.[0]}>
          <input
            name="jenisLimbah"
            defaultValue={nilai.jenisLimbah}
            maxLength={100}
            placeholder="Misalnya sisa makanan, minyak jelantah"
            className={KELAS_ISIAN}
          />
        </Field>

        <Field label="Catatan (opsional)" error={galat.catatanPelanggan?.[0]}>
          <textarea
            name="catatanPelanggan"
            defaultValue={nilai.catatanPelanggan}
            rows={3}
            maxLength={500}
            className={KELAS_ISIAN}
          />
        </Field>

        <Button type="submit" disabled={sedangMengirim}>
          {sedangMengirim ? "Mengirim…" : "Kirim pengajuan"}
        </Button>
      </form>
    </Card>
  );
}
