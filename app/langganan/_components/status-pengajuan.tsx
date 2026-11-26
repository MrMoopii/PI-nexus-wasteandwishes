import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format-angka";
import { bolehBayar, transisiValid } from "@/features/langganan/aturan";
import {
  LABEL_STATUS_PENGAJUAN,
  type DetailPengajuan,
  type PesanNegosiasiTampilan,
  type StatusPengajuan,
} from "@/features/langganan/types";
import PaymentButton from "../payment-button";
import { NegosiasiPelanggan } from "./negosiasi-pelanggan";
import { RincianPengajuan } from "./rincian-pengajuan";
import { TombolBatal } from "./tombol-batal";

// Pemetaan status ke varian badge dilakukan pemanggil (components/ui/README.md).
const VARIAN_STATUS: Record<
  StatusPengajuan,
  NonNullable<BadgeProps["varian"]>
> = {
  menunggu_review: "netral",
  ditawarkan: "peringatan",
  negosiasi: "peringatan",
  disetujui_pelanggan: "netral",
  siap_bayar: "sukses",
  ditolak: "bahaya",
  dibatalkan: "netral",
};

// Penjelasan untuk pelanggan tentang keadaan pengajuan dan langkah berikutnya.
const PENJELASAN_STATUS: Record<StatusPengajuan, string> = {
  menunggu_review:
    "Pengajuan Anda sedang direview tim Waste and Wishes. Penawaran harga akan dikirim setelah review.",
  ditawarkan:
    "Tim Waste and Wishes sudah mengirim penawaran harga untuk pengajuan Anda.",
  negosiasi:
    "Tawaran harga dari Anda sedang ditinjau tim Waste and Wishes.",
  disetujui_pelanggan:
    "Anda sudah menyetujui harga. Tim Waste and Wishes akan mengaktifkan pembayaran.",
  siap_bayar:
    "Harga dan jadwal sudah final. Bayar untuk mengaktifkan langganan 30 hari, atau untuk memperpanjangnya jika masih aktif.",
  ditolak:
    "Pengajuan Anda ditolak. Anda dapat mengirim pengajuan baru di bawah.",
  dibatalkan:
    "Pengajuan ini sudah Anda batalkan. Anda dapat mengirim pengajuan baru di bawah.",
};

/**
 * Kartu pengajuan milik pelanggan: status, alasan penolakan, harga final,
 * tombol bayar (siap_bayar), rincian isian, dan tombol batal selama status masih mengizinkan.
 */
export function KartuStatusPengajuan({
  pengajuan,
  daftarPesan,
}: {
  pengajuan: DetailPengajuan;
  daftarPesan: PesanNegosiasiTampilan[];
}) {
  return (
    <Card className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Pengajuan langganan
        </h2>
        <Badge varian={VARIAN_STATUS[pengajuan.status]}>
          {LABEL_STATUS_PENGAJUAN[pengajuan.status]}
        </Badge>
      </div>

      <p className="text-sm text-slate-600">
        {PENJELASAN_STATUS[pengajuan.status]}
      </p>

      {pengajuan.status === "ditolak" && pengajuan.alasanDitolak && (
        <Alert>Alasan penolakan: {pengajuan.alasanDitolak}</Alert>
      )}

      {pengajuan.hargaFinal !== null && (
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Harga disepakati
          </p>
          <p className="mt-1 text-2xl font-semibold text-waste">
            {formatRupiah(pengajuan.hargaFinal)}{" "}
            <span className="text-sm font-normal text-slate-500">
              / 30 hari
            </span>
          </p>
        </div>
      )}

      {/* Tombol bayar dari tugas 1.6, juga untuk perpanjangan karena status tetap
          siap_bayar setelah dibayar. Jumlah yang ditagih dihitung ulang di server. */}
      {bolehBayar(pengajuan.status) && pengajuan.hargaFinal !== null && (
        <PaymentButton
          idPengajuan={pengajuan.idPengajuan}
          hargaFinal={pengajuan.hargaFinal}
        />
      )}

      <RincianPengajuan pengajuan={pengajuan} />

      {/* Panel negosiasi (1.3): Setujui/Tawar saat ditawarkan, form pesan, riwayat. */}
      <NegosiasiPelanggan
        idPengajuan={pengajuan.idPengajuan}
        status={pengajuan.status}
        daftarPesan={daftarPesan}
        hariPengambilan={pengajuan.hariPengambilan}
        jamMulai={pengajuan.jamMulai}
        jamSelesai={pengajuan.jamSelesai}
        jumlahEmber={pengajuan.jumlahEmber}
      />

      {transisiValid("batalkanPengajuan", pengajuan.status) && (
        <TombolBatal idPengajuan={pengajuan.idPengajuan} />
      )}
    </Card>
  );
}
