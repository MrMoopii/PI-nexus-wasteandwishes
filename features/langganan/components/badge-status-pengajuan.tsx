import { Badge, type BadgeProps } from "@/components/ui/badge";
import { LABEL_STATUS_PENGAJUAN, type StatusPengajuan } from "../types";

// Warna mengikuti makna status dan sama di halaman pelanggan maupun admin:
// masih berjalan = peringatan, harga sudah disepakati = sukses.
const VARIAN_STATUS: Record<
  StatusPengajuan,
  NonNullable<BadgeProps["varian"]>
> = {
  menunggu_review: "peringatan",
  ditawarkan: "peringatan",
  negosiasi: "peringatan",
  disetujui_pelanggan: "sukses",
  siap_bayar: "sukses",
  ditolak: "bahaya",
  dibatalkan: "netral",
};

/**
 * Badge status pengajuan langganan untuk halaman pelanggan dan admin.
 * Label dari LABEL_STATUS_PENGAJUAN di types.ts, warna dipilih dari status.
 */
export function BadgeStatusPengajuan({ status }: { status: StatusPengajuan }) {
  return (
    <Badge varian={VARIAN_STATUS[status]}>
      {LABEL_STATUS_PENGAJUAN[status]}
    </Badge>
  );
}
