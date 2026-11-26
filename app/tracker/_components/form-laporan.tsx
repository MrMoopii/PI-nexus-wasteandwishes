"use client";

import { startTransition, useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import {
  laporKendala,
  type HasilLaporan,
} from "@/features/kunjungan/actions/lapor-kendala";
import {
  LABEL_STATUS_KUNJUNGAN,
  PANJANG_PESAN_LAPORAN_MAKS,
  type IsiTracker,
  type PilihanKunjungan,
} from "@/features/kunjungan/types";
import type { IsianKendala } from "@/features/kunjungan/validasi/lapor-kendala";
import { teksTanggal } from "./daftar-kunjungan";
import { FormLewati, KELAS_ISIAN } from "./form-lewati";

type JenisForm = "kendala" | "lewati";

const PILIHAN_JENIS: { jenis: JenisForm; label: string }[] = [
  { jenis: "kendala", label: "Ada kendala" },
  { jenis: "lewati", label: "Minta lewati" },
];

/** Satu kelompok <optgroup>; tidak dirender jika kosong. */
function KelompokPilihan({
  label,
  daftar,
}: {
  label: string;
  daftar: PilihanKunjungan[];
}) {
  if (daftar.length === 0) return null;
  return (
    <optgroup label={label}>
      {daftar.map((kunjungan) => (
        <option key={kunjungan.idKunjungan} value={kunjungan.idKunjungan}>
          {`${teksTanggal(kunjungan.tanggal, kunjungan.hari)} · ${LABEL_STATUS_KUNJUNGAN[kunjungan.status]}`}
        </option>
      ))}
    </optgroup>
  );
}

/** Form kendala: pilih kunjungan (hari ini, mendatang, atau riwayat) dan tulis pesan. */
function FormKendala({ pilihan }: { pilihan: IsiTracker["pilihanKendala"] }) {
  const [idKunjungan, setIdKunjungan] = useState("");
  const [pesan, setPesan] = useState("");

  const [hasil, aksi, sedangMengirim] = useActionState<
    HasilLaporan<IsianKendala> | null,
    FormData
  >(async (sebelumnya, formData) => {
    const baru = await laporKendala(sebelumnya, formData);
    // Berhasil: kosongkan form. Gagal: isian tetap seperti yang diketik.
    if (baru.ok) {
      startTransition(() => {
        setIdKunjungan("");
        setPesan("");
      });
    }
    return baru;
  }, null);

  const gagal = hasil?.ok === false ? hasil : null;
  const adaPilihan =
    pilihan.hariIni !== null ||
    pilihan.mendatang.length > 0 ||
    pilihan.riwayat.length > 0;

  if (!adaPilihan) {
    return (
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Belum ada kunjungan yang bisa dilaporkan.
      </p>
    );
  }

  return (
    <form action={aksi} noValidate className="space-y-4">
      <Field label="Kunjungan" error={gagal?.galat?.kunjunganId?.[0]}>
        <select
          name="kunjunganId"
          value={idKunjungan}
          onChange={(e) => setIdKunjungan(e.target.value)}
          className={KELAS_ISIAN}
        >
          <option value="" disabled>
            Pilih kunjungan
          </option>
          <KelompokPilihan
            label="Hari ini"
            daftar={pilihan.hariIni ? [pilihan.hariIni] : []}
          />
          <KelompokPilihan label="Jadwal mendatang" daftar={pilihan.mendatang} />
          <KelompokPilihan label="Riwayat" daftar={pilihan.riwayat} />
        </select>
      </Field>

      <Field label="Pesan untuk admin" error={gagal?.galat?.pesan?.[0]}>
        <textarea
          name="pesan"
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          rows={4}
          maxLength={PANJANG_PESAN_LAPORAN_MAKS}
          placeholder="Contoh: ember kemarin belum dikembalikan."
          className={KELAS_ISIAN}
        />
      </Field>

      {hasil?.ok === true && <Alert varian="sukses">{hasil.pesan}</Alert>}
      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button type="submit" disabled={sedangMengirim} className="w-full">
        {sedangMengirim ? "Mengirim…" : "Kirim laporan"}
      </Button>
    </form>
  );
}

/**
 * Kartu laporan pelanggan ke admin dengan dua pilihan: ada kendala, atau minta satu
 * pengambilan dilewati. Pola jadwal tetap tidak bisa diubah dari sini (hanya admin, 2.7).
 */
export function FormLaporan({
  pilihanKendala,
  pilihanLewati,
}: Pick<IsiTracker, "pilihanKendala" | "pilihanLewati">) {
  const [jenis, setJenis] = useState<JenisForm>("kendala");

  return (
    <Card id="laporan" className="scroll-mt-6 p-5">
      <h2 className="text-base font-semibold text-slate-900">
        Laporan ke admin
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Sampaikan kendala, atau minta satu pengambilan dilewati. Harga langganan
        tetap sama.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        {PILIHAN_JENIS.map((pilihan) => (
          <button
            key={pilihan.jenis}
            type="button"
            aria-pressed={jenis === pilihan.jenis}
            onClick={() => setJenis(pilihan.jenis)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              jenis === pilihan.jenis
                ? "bg-white text-waste-dark shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {pilihan.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {jenis === "kendala" ? (
          <FormKendala pilihan={pilihanKendala} />
        ) : (
          <FormLewati pilihan={pilihanLewati} />
        )}
      </div>
    </Card>
  );
}
