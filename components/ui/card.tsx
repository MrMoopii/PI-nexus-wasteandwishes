import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement>;

/**
 * Wadah kartu umum dengan border, latar putih, dan sudut membulat.
 * Gunakan sebagai pembungkus konten; gaya tambahan lewat className.
 */
export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-waste/20 bg-white p-4 shadow-sm ${className}`.trim()}
      {...props}
    />
  );
}
