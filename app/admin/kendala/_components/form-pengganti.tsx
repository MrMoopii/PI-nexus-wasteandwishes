"use client";

import {
  startTransition,
  useActionState,
  useId,
  useState,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  putuskanPengganti,
  type HasilTanggapan,
} from "@/features/kunjungan/actions/tanggapi-kendala";
import { PANJANG_PESAN_LAPORAN_MAKS } from "@/features/kunjungan/types";
import {
  tanggalPenggantiMin,
  type IsianPutusanPengganti,
  type KeputusanPengganti,
} from "@/features/kunjungan/validasi/tanggapi-kendala";
import { formatTanggal } from "@/lib/format-tanggal";
import { KELAS_ISIAN, KETERANGAN_TANGGAPAN } from "./form-tanggapan";
import { tanggalPanjang } from "./kartu-laporan";

type FormPenggantiProps = {
  idLaporan: number;
  /** Tanggal kunjungan yang dilewati ("YYYY-MM-DD"). */
  tanggalDilewati: string;
  /** Usulan tanggal dari pelanggan ("YYYY-MM-DD"). */
  tanggalUsulan: string;
  /** Hari ini (WIB), batas bawah tanggal pengganti bersama tanggal yang dilewati. */
  hariIni: string;
  /** Tanggal akhir langganan jika masih aktif; null jika tidak aktif. */
  akhirLanggananAktif: string | null;
};

/** Teks tombol dan contoh tanggapan untuk setiap keputusan. */
const TEKS_KEPUTUSAN: Record<
  KeputusanPengganti,
  { tombol: string; contoh: string }
> = {
  setujui: {
    tombol: "Setujui usulan",
    contoh: "Contoh: Baik, sampah Anda kami ambil di tanggal usulan Anda.",
  },
  tanggal_lain: {
    tombol: "Buat kunjungan pengganti",
    contoh: "Contoh: Tanggal usulan sudah penuh, jadi kami ambil di tanggal ini.",
  },
  tolak: {
    tombol: "Tolak tanggal pengganti",
    contoh: "Contoh: Maaf, jadwal kurir minggu ini penuh, jadi tidak ada pengganti.",
  },
};

type OpsiKeputusanProps = {
  nilai: KeputusanPengganti;
  judul: string;
  keterangan: string;
  terpilih: KeputusanPengganti;
  onPilih: (nilai: KeputusanPengganti) => void;
};

/** Satu pilihan keputusan berbentuk kartu radio, supaya mudah diklik. */
function OpsiKeputusan({
  nilai,
  judul,
  keterangan,
  terpilih,
  onPilih,
}: OpsiKeputusanProps) {
  const aktif = terpilih === nilai;
  return (
    <label
      className={`flex cursor-pointer items-start gap-2 rounded-lg border bg-white p-3 text-sm transition ${
        aktif ? "border-(--hx-accent)" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <input
        type="radio"
        name="keputusan"
        value={nilai}
        checked={aktif}
        onChange={() => onPilih(nilai)}
        className="mt-0.5"
      />
      <span>
        <span className="block font-medium text-gray-900">{judul}</span>
        <span className="block text-xs text-gray-500">{keterangan}</span>
      </span>
    </label>
  );
}

/**
 * Form admin untuk lewati dengan usulan tanggal: setujui usulan, pilih tanggal lain,
 * atau tolak, selalu dengan tanggapan. Berhasil: notifikasi, dan laporan pindah ke
 * Terakhir ditanggapi. Batas tanggal di form hanya bantuan; server mengecek ulang semua.
 */
export function FormPengganti({
  idLaporan,
  tanggalDilewati,
  tanggalUsulan,
  hariIni,
  akhirLanggananAktif,
}: FormPenggantiProps) {
  // Langganan tidak aktif tidak bisa diberi pengganti, jadi pilihan awalnya tolak.
  const [keputusan, setKeputusan] = useState<KeputusanPengganti>(
    akhirLanggananAktif === null ? "tolak" : "setujui",
  );
  const [tanggalLain, setTanggalLain] = useState("");
  const [tanggapan, setTanggapan] = useState("");
  const idGalatKeputusan = useId();

  const [hasil, aksi, sedangMengirim] = useActionState<
    HasilTanggapan<IsianPutusanPengganti> | null,
    FormData
  >(async (sebelumnya, formData) => {
    const baru = await putuskanPengganti(sebelumnya, formData);
    // Kartu ini hilang dari kotak masuk setelah berhasil, jadi suksesnya lewat notifikasi.
    if (baru.ok) toast.success(baru.pesan);
    return baru;
  }, null);
  const gagal = hasil?.ok === false ? hasil : null;
  const galatKeputusan = gagal?.galat?.keputusan?.[0];
  const teks = TEKS_KEPUTUSAN[keputusan];

  // Dikirim lewat onSubmit, bukan <form action>: action bawaan React me-reset form
  // setelah selesai, dan radio terkontrol kembali ke pilihan awal walaupun state-nya
  // tidak berubah (titik radio pindah ke "Setujui usulan" saat isian gagal).
  function kirim(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => aksi(formData));
  }

  return (
    <form
      onSubmit={kirim}
      noValidate
      className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4"
    >
      <input type="hidden" name="idLaporan" value={idLaporan} />
      {akhirLanggananAktif === null ? (
        <Alert varian="gagal">
          Langganan pelanggan ini sudah tidak aktif, jadi kunjungan pengganti
          tidak bisa dibuat. Pilih Tolak dan jelaskan alasannya.
        </Alert>
      ) : (
        <p className="text-xs text-gray-500">
          Langganan aktif sampai {formatTanggal(akhirLanggananAktif)}. Tanggal
          pengganti harus hari kerja, bukan hari libur, setelah tanggal yang
          dilewati, dan belum ada kunjungan pelanggan di tanggal itu.
        </p>
      )}

      <fieldset aria-describedby={galatKeputusan ? idGalatKeputusan : undefined}>
        <legend className="text-sm font-medium text-waste">Keputusan</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <OpsiKeputusan
            nilai="setujui"
            judul="Setujui usulan"
            keterangan={tanggalPanjang(tanggalUsulan)}
            terpilih={keputusan}
            onPilih={setKeputusan}
          />
          <OpsiKeputusan
            nilai="tanggal_lain"
            judul="Pilih tanggal lain"
            keterangan="Kunjungan pengganti di tanggal pilihan Anda."
            terpilih={keputusan}
            onPilih={setKeputusan}
          />
          <OpsiKeputusan
            nilai="tolak"
            judul="Tolak"
            keterangan="Tidak ada kunjungan pengganti."
            terpilih={keputusan}
            onPilih={setKeputusan}
          />
        </div>
        {galatKeputusan && (
          <p
            id={idGalatKeputusan}
            className="mt-1.5 text-xs font-medium text-red-600"
          >
            {galatKeputusan}
          </p>
        )}
      </fieldset>

      {keputusan === "tanggal_lain" && (
        <Field
          label="Tanggal pengganti"
          error={gagal?.galat?.tanggalPengganti?.[0]}
        >
          <input
            type="date"
            name="tanggalPengganti"
            min={tanggalPenggantiMin(tanggalDilewati, hariIni)}
            max={akhirLanggananAktif ?? undefined}
            value={tanggalLain}
            onChange={(e) => setTanggalLain(e.target.value)}
            className={KELAS_ISIAN}
          />
        </Field>
      )}

      <Field
        label="Tanggapan untuk pelanggan"
        error={gagal?.galat?.tanggapan?.[0]}
      >
        <textarea
          name="tanggapan"
          value={tanggapan}
          onChange={(e) => setTanggapan(e.target.value)}
          rows={3}
          maxLength={PANJANG_PESAN_LAPORAN_MAKS}
          placeholder={teks.contoh}
          className={KELAS_ISIAN}
        />
      </Field>
      <p className="text-xs text-gray-500">{KETERANGAN_TANGGAPAN}</p>

      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      <Button type="submit" disabled={sedangMengirim}>
        {sedangMengirim ? "Menyimpan…" : teks.tombol}
      </Button>
    </form>
  );
}
