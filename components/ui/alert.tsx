import type { HTMLAttributes } from "react";

type VarianAlert = "sukses" | "gagal" | "info";

const KELAS_VARIAN: Record<VarianAlert, string> = {
  sukses: "bg-emerald-50 text-emerald-800 border-emerald-200",
  gagal: "bg-red-50 text-red-800 border-red-200",
  info: "bg-sky-50 text-sky-800 border-sky-200",
};

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  /** Gaya visual pesan. Bawaan "info". */
  varian?: VarianAlert;
};

/**
 * Kotak pesan status untuk memberi umpan balik operasi.
 * Varian "gagal" menggunakan role="alert" untuk aksesibilitas pembaca layar.
 */
export function Alert({
  varian = "info",
  className = "",
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role={varian === "gagal" ? "alert" : "status"}
      className={`rounded-lg border p-4 text-sm font-medium ${KELAS_VARIAN[varian]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
