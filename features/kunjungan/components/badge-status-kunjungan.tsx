import { Badge, type BadgeProps } from "@/components/ui/badge";
import { LABEL_STATUS_KUNJUNGAN, type StatusKunjungan } from "../types";

// Pemetaan status ke varian badge dilakukan pemanggil komponen umum (components/ui/README.md).
const VARIAN_STATUS: Record<
  StatusKunjungan,
  NonNullable<BadgeProps["varian"]>
> = {
  dijadwalkan: "netral",
  diambil: "sukses",
  ditimbang: "sukses",
  tertunda: "peringatan",
  batal: "bahaya",
  dilewati: "netral",
};

/**
 * Badge status kunjungan dengan label dari types.ts. Hanya menerima props;
 * dipakai tracker pelanggan (2.4) dan bisa dipakai halaman admin kunjungan.
 */
export function BadgeStatusKunjungan({ status }: { status: StatusKunjungan }) {
  return (
    <Badge varian={VARIAN_STATUS[status]}>
      {LABEL_STATUS_KUNJUNGAN[status]}
    </Badge>
  );
}
