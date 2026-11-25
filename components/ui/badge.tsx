import type { HTMLAttributes } from "react";

type VarianBadge = "netral" | "sukses" | "peringatan" | "bahaya";

const KELAS_VARIAN: Record<VarianBadge, string> = {
  netral: "bg-slate-100 text-slate-700",
  sukses: "bg-emerald-100 text-emerald-800",
  peringatan: "bg-amber-100 text-amber-800",
  bahaya: "bg-red-100 text-red-800",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** Gaya visual badge. Bawaan "netral". */
  varian?: VarianBadge;
};

/**
 * Label kecil untuk status atau kategori.
 * Tanpa logika bisnis; varian dipilih pemanggil lewat props.
 */
export function Badge({
  varian = "netral",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${KELAS_VARIAN[varian]} ${className}`.trim()}
      {...props}
    />
  );
}
