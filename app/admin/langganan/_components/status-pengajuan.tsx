import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { StatusPengajuan } from "@/features/langganan/types";

/** Label Bahasa Indonesia untuk setiap status pengajuan. */
export const LABEL_STATUS_PENGAJUAN: Record<StatusPengajuan, string> = {
  menunggu_review: "Menunggu review",
  ditawarkan: "Ditawarkan",
  negosiasi: "Negosiasi",
  disetujui_pelanggan: "Disetujui pelanggan",
  siap_bayar: "Siap bayar",
  ditolak: "Ditolak",
  dibatalkan: "Dibatalkan",
};

type VarianBadge = NonNullable<BadgeProps["varian"]>;

// Warna badge mengikuti makna status: menunggu = peringatan, selesai = sukses.
const VARIAN_STATUS: Record<StatusPengajuan, VarianBadge> = {
  menunggu_review: "peringatan",
  ditawarkan: "netral",
  negosiasi: "peringatan",
  disetujui_pelanggan: "sukses",
  siap_bayar: "sukses",
  ditolak: "bahaya",
  dibatalkan: "netral",
};

/** Badge status pengajuan; varian warnanya dipilih dari status. */
export function StatusPengajuanBadge({
  status,
}: {
  status: StatusPengajuan;
}) {
  return (
    <Badge varian={VARIAN_STATUS[status]}>
      {LABEL_STATUS_PENGAJUAN[status]}
    </Badge>
  );
}
