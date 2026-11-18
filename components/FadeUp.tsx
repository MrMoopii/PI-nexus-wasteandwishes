"use client";

import type { ReactNode } from "react";

/**
 * Pembungkus elemen tanpa efek apa pun.
 * Dipertahankan sebagai komponen kosong supaya pemanggil di halaman
 * (app/page.tsx, app/about/page.tsx) tidak perlu di-ubah.
 */
export default function FadeUp({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  /** Prop ini tidak digunakan; dipertahankan agar pemanggil lama tidak error. */
  delay?: number;
}) {
  return (
    <div className={className ? className : undefined}>{children}</div>
  );
}
