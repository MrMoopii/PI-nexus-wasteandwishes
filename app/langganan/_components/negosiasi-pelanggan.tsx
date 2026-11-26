"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  kirimPesan,
  setujuiPenawaran,
  tawarHarga,
  type HasilNegosiasi,
} from "@/features/langganan/actions/negosiasi";
import { KartuPenawaran } from "@/features/langganan/components/kartu-penawaran";
import { RiwayatNegosiasi } from "@/features/langganan/components/riwayat-negosiasi";
import {
  type PengirimPesan,
  type PesanNegosiasiTampilan,
  type StatusPengajuan,
} from "@/features/langganan/types";
import { transisiValid } from "@/features/langganan/aturan";

const KELAS_ISIAN =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-waste focus:outline-none focus:ring-1 focus:ring-waste aria-invalid:border-red-500";

const NAMA_PENGIRIM: Record<PengirimPesan, string> = {
  pelanggan: "Anda",
  admin: "Waste and Wishes",
};

type NegosiasiPelangganProps = {
  idPengajuan: number;
  status: StatusPengajuan;
  daftarPesan: PesanNegosiasiTampilan[];
  hariPengambilan: number[] | null;
  jamMulai: string | null;
  jamSelesai: string | null;
  jumlahEmber: number | null;
};

/**
 * Harga usulan admin terakhir dari riwayat, untuk kartu penawaran.
 * Riwayat diurutkan dari yang terlama, jadi yang terakhir cocok adalah yang terbaru.
 * null jika belum ada penawaran berisi harga (data rusak di status ditawarkan).
 */
function hargaPenawaranTerakhir(
  daftarPesan: PesanNegosiasiTampilan[],
): number | null {
  for (let i = daftarPesan.length - 1; i >= 0; i -= 1) {
    const pesan = daftarPesan[i];
    if (pesan.pengirim === "admin" && pesan.hargaUsulan !== null) {
      return pesan.hargaUsulan;
    }
  }
  return null;
}

/**
 * Panel negosiasi untuk pelanggan: tombol Setujui dan form Tawar di kartu
 * penawaran (status ditawarkan), form pesan tanpa harga, dan riwayat.
 * Boleh tidaknya menjalankan aksi tetap dicek di Server Action.
 */
export function NegosiasiPelanggan(props: NegosiasiPelangganProps) {
  const { idPengajuan, status, daftarPesan } = props;

  const [hasilSetujui, aksiSetujui, setujuiMuat] = useActionState<
    HasilNegosiasi | null,
    FormData
  >(setujuiPenawaran, null);
  const [hasilTawar, aksiTawar, tawarMuat] = useActionState<
    HasilNegosiasi | null,
    FormData
  >(tawarHarga, null);
  const [hasilPesan, aksiPesan, pesanMuat] = useActionState<
    HasilNegosiasi | null,
    FormData
  >(kirimPesan, null);

  // Setuju dan Tawar hanya mengizinkan status ditawarkan (aturan.ts).
  const ditawarkan = transisiValid("tawarHarga", status);
  const harga = hargaPenawaranTerakhir(daftarPesan);

  // Form pesan tanpa harga boleh dikirim saat status masih berjalan (aturan.ts).
  const bolehPesan = transisiValid("kirimPesan", status);

  // Panel hanya relevan selama negosiasi berjalan atau masih ada riwayat;
  // di status selesai tanpa riwayat, tidak ditampilkan.
  if (!bolehPesan && !ditawarkan && daftarPesan.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {ditawarkan && (
        <Alert varian="info">
          Perlu tindakan Anda: setujui harga atau tawarkan harga lain.
        </Alert>
      )}

      {ditawarkan && harga !== null && (
        <KartuPenawaran
          harga={harga}
          hariPengambilan={props.hariPengambilan}
          jamMulai={props.jamMulai}
          jamSelesai={props.jamSelesai}
          jumlahEmber={props.jumlahEmber}
          aksi={
            <div className="flex flex-col gap-4">
              <form action={aksiSetujui} className="space-y-2">
                <input type="hidden" name="idPengajuan" value={idPengajuan} />
                <Button type="submit" disabled={setujuiMuat}>
                  {setujuiMuat ? "Menyetujui…" : "Setujui harga"}
                </Button>
                {hasilSetujui?.ok === false && (
                  <Alert varian="gagal">{hasilSetujui.pesan}</Alert>
                )}
              </form>

              <form action={aksiTawar} className="space-y-2">
                <input type="hidden" name="idPengajuan" value={idPengajuan} />
                <Field label="Tawarkan harga (Rp / 30 hari)">
                  <input
                    name="hargaUsulan"
                    type="text"
                    inputMode="numeric"
                    placeholder="Misalnya 120000"
                    className={KELAS_ISIAN}
                  />
                </Field>
                <Field label="Pesan untuk tim (opsional)">
                  <input
                    name="catatan"
                    type="text"
                    maxLength={500}
                    placeholder="Misalnya bisa turun sedikit?"
                    className={KELAS_ISIAN}
                  />
                </Field>
                <Button type="submit" varian="garis" disabled={tawarMuat}>
                  {tawarMuat ? "Mengirim tawar…" : "Tawar harga"}
                </Button>
                {hasilTawar?.ok === false && (
                  <Alert varian="gagal">{hasilTawar.pesan}</Alert>
                )}
              </form>
            </div>
          }
        />
      )}

      {ditawarkan && harga === null && (
        <Alert varian="info">
          Penawaran harga tidak ditemukan. Silakan muat ulang halaman.
        </Alert>
      )}

      {bolehPesan && (
        <form action={aksiPesan} className="space-y-2">
          <input type="hidden" name="idPengajuan" value={idPengajuan} />
          <Field label="Kirim pesan ke tim Waste and Wishes">
            <textarea
              name="pesan"
              rows={2}
              maxLength={500}
              placeholder="Tulis pesan Anda…"
              className={KELAS_ISIAN}
            />
          </Field>
          <Button type="submit" varian="garis" disabled={pesanMuat}>
            {pesanMuat ? "Mengirim…" : "Kirim pesan"}
          </Button>
          {hasilPesan?.ok === false && (
            <Alert varian="gagal">{hasilPesan.pesan}</Alert>
          )}
        </form>
      )}

      <div>
        <h3 className="text-xs uppercase tracking-wide text-slate-500">
          Riwayat negosiasi
        </h3>
        <div className="mt-2">
          <RiwayatNegosiasi daftarPesan={daftarPesan} namaPengirim={NAMA_PENGIRIM} />
        </div>
      </div>
    </div>
  );
}
