"use client";

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogKonfirmasi } from "@/components/ui/dialog-konfirmasi";
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
import { formatTanggal } from "@/lib/format-tanggal";
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
 * wajib, dan boleh mengusulkan tanggal pengganti paling lambat tanggal akhir
 * langganan. Hanya kunjungan yang masih sebelum batas H-1 pukul 17.00 WIB yang bisa
 * dipilih; server tetap mengecek semuanya.
 */
export function FormLewati({
  pilihan,
  akhirLangganan,
}: {
  pilihan: PilihanLewati[];
  /** Tanggal akhir langganan aktif, batas usulan tanggal pengganti (2.6). */
  akhirLangganan: string;
}) {
  const [idKunjungan, setIdKunjungan] = useState("");
  const [alasan, setAlasan] = useState("");
  const [pengganti, setPengganti] = useState<Pengganti>("tidak");
  const [tanggalPengganti, setTanggalPengganti] = useState("");
  // Isian yang menunggu konfirmasi; dialog tampil selama ini tidak null.
  const [formMenunggu, setFormMenunggu] = useState<FormData | null>(null);

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

  // Dikirim lewat onSubmit, bukan <form action>: action bawaan React me-reset form
  // setelah selesai, dan radio terkontrol kembali ke "Lewati saja" walaupun state-nya
  // tidak berubah. Lewati tidak bisa dibatalkan dari tracker, jadi dikonfirmasi dulu;
  // tanpa kunjungan terpilih langsung dikirim supaya server menampilkan pesan isian.
  function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (terpilih) {
      setFormMenunggu(formData);
    } else {
      startTransition(() => aksi(formData));
    }
  }

  // Pelanggan menekan Lewati di dialog: kirim isian yang disimpan saat submit.
  function lanjutkan() {
    if (formMenunggu === null) return;
    const formData = formMenunggu;
    setFormMenunggu(null);
    startTransition(() => aksi(formData));
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
        <form onSubmit={kirim} noValidate className="space-y-4">
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
                  max={akhirLangganan}
                  className={KELAS_ISIAN}
                />
              </Field>
              <p className="text-xs text-slate-500">
                Hari kerja, bukan hari libur, setelah tanggal yang dilewati,
                belum ada kunjungan di tanggal itu, dan paling lambat{" "}
                {formatTanggal(akhirLangganan)} (akhir masa langganan Anda).
              </p>
            </div>
          )}

          {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
          <Button type="submit" disabled={sedangMengirim} className="w-full">
            {sedangMengirim ? "Mengirim…" : "Lewati pengambilan"}
          </Button>
        </form>
      )}

      {formMenunggu !== null && terpilih && (
        <DialogKonfirmasi
          judul="Lewati Pengambilan"
          peringatan="Kunjungan langsung dilewati dan tidak bisa dibatalkan dari tracker."
          labelKonfirmasi="Lewati"
          onKonfirmasi={lanjutkan}
          onBatal={() => setFormMenunggu(null)}
        >
          Apakah Anda yakin ingin melewati pengambilan{" "}
          <span className="font-semibold text-slate-800">
            {teksTanggal(terpilih.tanggal, terpilih.hari)}
          </span>
          ?
        </DialogKonfirmasi>
      )}
    </div>
  );
}
