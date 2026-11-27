"use client";

/**
 * Tombol cetak laporan bulanan: membuka dialog cetak browser (window.print()).
 * Komponen klien karena memasang onClick; yang ikut tercetak diatur CSS print.
 */
export function TombolCetak() {
  function cetak() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={cetak}
      className="no-print inline-flex items-center gap-2 rounded-lg bg-(--hx-accent) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
    >
      Cetak
    </button>
  );
}
