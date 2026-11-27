import { formatTanggal } from "@/lib/format-tanggal";

/** Tombol cetak laporan bulanan; memakai window.print() bersama CSS print. */
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

/** Tanggal dalam format Indonesia (WIB) untuk tampilan laporan. */
export function formatTanggalLaporan(tanggal: string): string {
  return formatTanggal(tanggal);
}
