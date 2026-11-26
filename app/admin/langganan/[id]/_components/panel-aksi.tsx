import { Alert } from "@/components/ui/alert";
import {
  aktifkanPembayaran,
  terimaTawaran,
} from "@/features/langganan/actions/admin-status";
import { transisiValid, type AksiPengajuan } from "@/features/langganan/aturan";
import type { DetailPengajuanAdmin } from "@/features/langganan/queries/admin";
import type {
  PengirimPesan,
  PesanNegosiasiTampilan,
} from "@/features/langganan/types";
import { formatRupiah } from "@/lib/format-angka";
import { FormPenawaran } from "./form-penawaran";
import { FormPesan } from "./form-pesan";
import { FormTolak } from "./form-tolak";
import { TombolStatus } from "./tombol-status";

type PesanBerharga = PesanNegosiasiTampilan & { hargaUsulan: number };

// Hari bawaan penawaran pertama: Senin, Rabu, Jumat (keputusan mitra).
const HARI_BAWAAN = ["1", "3", "5"];

/** Pesan berharga terakhir dari satu pihak. Daftar sudah urut dari yang terlama. */
function hargaTerakhir(
  pesan: PesanNegosiasiTampilan[],
  pengirim: PengirimPesan,
): PesanBerharga | null {
  return (
    pesan.findLast(
      (p): p is PesanBerharga =>
        p.pengirim === pengirim && p.hargaUsulan !== null,
    ) ?? null
  );
}

/** Satu ringkasan harga terakhir, beserta pesan yang menyertainya. */
function RingkasanHarga({
  label,
  pesan,
}: {
  label: string;
  pesan: PesanBerharga | null;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-gray-800">
        {pesan ? `${formatRupiah(pesan.hargaUsulan)} / 30 hari` : "Belum ada"}
      </dd>
      {pesan?.pesan && (
        <dd className="mt-1 whitespace-pre-line text-sm text-gray-600">
          “{pesan.pesan}”
        </dd>
      )}
    </div>
  );
}

/**
 * Panel tindakan admin di detail pengajuan: harga terakhir kedua pihak, lalu
 * form dan tombol yang diizinkan status saat ini (aturan.ts). Setiap aksi
 * dicek ulang di Server Action. Riwayat pesan lengkap memakai komponen 1.2.
 */
export function PanelAksi({
  pengajuan,
  pesan,
}: {
  pengajuan: DetailPengajuanAdmin;
  pesan: PesanNegosiasiTampilan[];
}) {
  const { idPengajuan, status, hargaFinal } = pengajuan;
  const penawaranAdmin = hargaTerakhir(pesan, "admin");
  const tawaranPelanggan = hargaTerakhir(pesan, "pelanggan");
  const bisa = (aksi: AksiPengajuan) => transisiValid(aksi, status);
  const adaAksi = (
    [
      "kirimPenawaran",
      "terimaTawaran",
      "aktifkanPembayaran",
      "kirimPesan",
      "tolakPengajuan",
    ] as const
  ).some(bisa);

  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
        Tindakan admin
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <RingkasanHarga label="Penawaran terakhir admin" pesan={penawaranAdmin} />
        <RingkasanHarga
          label="Tawaran terakhir pelanggan"
          pesan={tawaranPelanggan}
        />
      </dl>

      <div className="mt-6 space-y-6">
        {!adaAksi && (
          <p className="text-sm text-gray-500">
            Tidak ada tindakan admin untuk status ini.
          </p>
        )}

        {bisa("terimaTawaran") &&
          (tawaranPelanggan ? (
            <TombolStatus
              aksi={terimaTawaran}
              idPengajuan={idPengajuan}
              idPesan={tawaranPelanggan.idPesan}
              label={`Terima tawaran ${formatRupiah(tawaranPelanggan.hargaUsulan)}`}
              konfirmasi={`Terima tawaran pelanggan ${formatRupiah(tawaranPelanggan.hargaUsulan)} per 30 hari? Harga ini menjadi harga final.`}
            />
          ) : (
            <Alert>Belum ada tawaran harga dari pelanggan.</Alert>
          ))}

        {bisa("aktifkanPembayaran") && (
          <TombolStatus
            aksi={aktifkanPembayaran}
            idPengajuan={idPengajuan}
            label="Aktifkan pembayaran"
            konfirmasi={`Aktifkan pembayaran${hargaFinal === null ? "" : ` ${formatRupiah(hargaFinal)}`}? Harga dan syarat terkunci setelah ini.`}
          />
        )}

        {bisa("kirimPenawaran") && (
          <FormPenawaran
            idPengajuan={idPengajuan}
            estimasiEmber={pengajuan.estimasiEmber}
            nilaiAwal={{
              harga: penawaranAdmin ? String(penawaranAdmin.hargaUsulan) : undefined,
              jenisPelanggan: pengajuan.jenisPelanggan ?? undefined,
              hariPengambilan:
                pengajuan.hariPengambilan?.map(String) ?? HARI_BAWAAN,
              // Kolom time berbentuk "JJ:MM:SS"; <input type="time"> memakai "JJ:MM".
              jamMulai: pengajuan.jamMulai?.slice(0, 5),
              jamSelesai: pengajuan.jamSelesai?.slice(0, 5),
              jumlahEmber:
                pengajuan.jumlahEmber === null
                  ? undefined
                  : String(pengajuan.jumlahEmber),
            }}
          />
        )}

        {bisa("kirimPesan") && <FormPesan idPengajuan={idPengajuan} />}

        {bisa("tolakPengajuan") && <FormTolak idPengajuan={idPengajuan} />}
      </div>
    </section>
  );
}
