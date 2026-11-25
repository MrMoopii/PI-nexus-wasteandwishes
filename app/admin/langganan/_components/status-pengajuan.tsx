import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  LABEL_STATUS_PENGAJUAN,
  type StatusPengajuan,
} from "@/features/langganan/types";

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
