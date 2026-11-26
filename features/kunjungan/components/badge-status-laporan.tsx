import { Badge, type BadgeProps } from "@/components/ui/badge";
import { LABEL_STATUS_LAPORAN, type StatusLaporan } from "../types";

// Pemetaan status ke varian badge dilakukan pemanggil komponen umum (components/ui/README.md).
const VARIAN_STATUS: Record<StatusLaporan, NonNullable<BadgeProps["varian"]>> =
  {
    menunggu: "peringatan",
    ditanggapi: "sukses",
  };

/**
 * Badge status laporan kendala atau permintaan lewati. Hanya menerima props;
 * dipakai tracker pelanggan (2.4) dan bisa dipakai halaman admin kendala (2.6).
 */
export function BadgeStatusLaporan({ status }: { status: StatusLaporan }) {
  return (
    <Badge varian={VARIAN_STATUS[status]}>{LABEL_STATUS_LAPORAN[status]}</Badge>
  );
}
