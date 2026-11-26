"use client";

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  mintaLewati,
  type HasilLaporan,
} from "@/features/kunjungan/actions/lapor-kendala";
import { tambahHari } from "@/features/kunjungan/jadwal";
import {
  PANJANG_PESAN_LAPORAN_MAKS,
  type PilihanLewati,
} from "@/features/kunjungan/types";
import type { IsianLewati } from "@/features/kunjungan/validasi/lapor-kendala";
import { teksTanggal } from "./daftar-kunjungan";

/** Kelas isian form laporan tracker, sama dengan form pelanggan di /langganan. */
export const KELAS_ISIAN =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-waste focus:outline-none focus:ring-1 focus:ring-waste aria-invalid:border-red-500";

type Pengganti = "tidak" | "ya";

/** Satu pilihan radio tanggal pengganti, berbentuk kartu supaya mudah diketuk di HP. */
function OpsiPengganti({
  nilai,
  judul,
  keterangan,
  terpilih,
  onPilih,
}: {
  nilai: Pengganti;
  judul: string;
  keterangan: string;
  terpilih: Pengganti;
  onPilih: (nilai: Pengganti) => void;
}) {
  const aktif = terpilih === nilai;
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition ${
        aktif ? "border-waste bg-waste/5" : "border-slate-200 hover:border-waste/40"
      }`}
    >
      <input
        type="radio"
        name="pengganti"
        value={nilai}
        checked={aktif}
        onChange={() => onPilih(nilai)}
        className="mt-0.5 accent-waste"
      />
      <span>
        <span className="block font-medium text-slate-900">{judul}</span>
        <span className="block text-xs text-slate-500">{keterangan}</span>
      </span>
    </label>
  );
}

/**
 * Form pelanggan untuk meminta satu kunjungan dilewati: pilih kunjungan, alasan
 * wajib, dan boleh mengusulkan tanggal pengganti. Hanya kunjungan yang masih
 * sebelum batas H-1 pukul 17.00 WIB yang bisa dipilih; server tetap mengecek semuanya.
 */
export function FormLewati({ pilihan }: { pilihan: PilihanLewati[] }) {
  const [idKunjungan, setIdKunjungan] = useState("");
  const [alasan, setAlasan] = useState("");
  const [pengganti, setPengganti] = useState<Pengganti>("tidak");
  const [tanggalPengganti, setTanggalPengganti] = useState("");

  const [hasil, aksi, sedangMengirim] = useActionState<
    HasilLaporan<IsianLewati> | null,
    FormData
  >(async (sebelumnya, formData) => {
    const baru = await mintaLewati(sebelumnya, formData);
    // Berhasil: kosongkan form, karena kunjungan tadi sudah tidak bisa dipilih lagi.
    // Gagal: isian tetap seperti yang diketik.
    if (baru.ok) {
      startTransition(() => {
        setIdKunjungan("");
        setAlasan("");
        setPengganti("tidak");
        setTanggalPengganti("");
      });
    }
    return baru;
  }, null);

  const gagal = hasil?.ok === false ? hasil : null;
  const terpilih = pilihan.find(
    (kunjungan) => String(kunjungan.idKunjungan) === idKunjungan,
  );

  // Lewati tidak bisa dibatalkan dari tracker, jadi minta konfirmasi dulu.
  // preventDefault di onSubmit membuat React tidak menjalankan action.
  function tanyaDulu(e: FormEvent<HTMLFormElement>) {
    if (!terpilih) return;
    const yakin = window.confirm(
      `Lewati pengambilan ${teksTanggal(terpilih.tanggal, terpilih.hari)}? Kunjungan langsung dilewati dan tidak bisa dibatalkan dari tracker.`,
    );
    if (!yakin) e.preventDefault();
  }

  return (
    <div className="space-y-4">
      {hasil?.ok === true && <Alert varian="sukses">{hasil.pesan}</Alert>}

      {pilihan.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Tidak ada kunjungan yang masih bisa dilewati. Permintaan lewati paling
          lambat H-1 pukul 17.00 WIB.
        </p>
      ) : (
        <form
          action={aksi}
          onSubmit={tanyaDulu}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Field
              label="Kunjungan yang dilewati"
              error={gagal?.galat?.kunjunganId?.[0]}
            >
              <select
                name="kunjunganId"
                value={idKunjungan}
                onChange={(e) => setIdKunjungan(e.target.value)}
                className={KELAS_ISIAN}
              >
                <option value="" disabled>
                  Pilih kunjungan
                </option>
                {pilihan.map((kunjungan) => (
                  <option key={kunjungan.idKunjungan} value={kunjungan.idKunjungan}>
                    {teksTanggal(kunjungan.tanggal, kunjungan.hari)}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-xs text-slate-500">
              {terpilih
                ? `Batas permintaan: ${terpilih.batas}.`
                : "Permintaan lewati paling lambat H-1 pukul 17.00 WIB."}
            </p>
          </div>

          <Field label="Alasan" error={gagal?.galat?.alasan?.[0]}>
            <textarea
              name="alasan"
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
              maxLength={PANJANG_PESAN_LAPORAN_MAKS}
              placeholder="Contoh: kantor tutup karena acara internal."
              className={KELAS_ISIAN}
            />
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-waste">
              Tanggal pengganti
            </legend>
            <OpsiPengganti
              nilai="tidak"
              judul="Lewati saja"
              keterangan="Kunjungan langsung dilewati."
              terpilih={pengganti}
              onPilih={setPengganti}
            />
            <OpsiPengganti
              nilai="ya"
              judul="Minta tanggal pengganti"
              keterangan="Kunjungan langsung dilewati, tanggal pengganti menunggu persetujuan admin."
              terpilih={pengganti}
              onPilih={setPengganti}
            />
            {gagal?.galat?.pengganti?.[0] && (
              <p className="text-xs font-medium text-red-600">
                {gagal.galat.pengganti[0]}
              </p>
            )}
          </fieldset>

          {pengganti === "ya" && (
            <div className="space-y-1.5">
              <Field
                label="Usulan tanggal pengganti"
                error={gagal?.galat?.tanggalPengganti?.[0]}
              >
                <input
                  type="date"
                  name="tanggalPengganti"
                  value={tanggalPengganti}
                  onChange={(e) => setTanggalPengganti(e.target.value)}
                  min={terpilih ? tambahHari(terpilih.tanggal, 1) : undefined}
                  className={KELAS_ISIAN}
                />
              </Field>
              <p className="text-xs text-slate-500">
                Hari kerja, bukan hari libur, setelah tanggal yang dilewati, dan
                belum ada kunjungan di tanggal itu.
              </p>
            </div>
          )}

          {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
          <Button type="submit" disabled={sedangMengirim} className="w-full">
            {sedangMengirim ? "Mengirim…" : "Lewati pengambilan"}
          </Button>
        </form>
      )}
    </div>
  );
}
