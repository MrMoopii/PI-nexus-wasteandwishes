import type { ButtonHTMLAttributes } from "react";

type VarianButton = "utama" | "garis";

const KELAS_VARIAN: Record<VarianButton, string> = {
  utama: "bg-waste text-white hover:bg-waste-dark",
  garis: "border border-waste text-waste hover:bg-waste/10",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Gaya visual tombol. Bawaan "utama". */
  varian?: VarianButton;
};

/**
 * Tombol umum bergaya tema waste.
 * Bawaan type="button" supaya tidak mengirim form tanpa sengaja.
 */
export function Button({
  varian = "utama",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${KELAS_VARIAN[varian]} ${className}`.trim()}
      {...props}
    />
  );
}
