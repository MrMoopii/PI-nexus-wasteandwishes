/**
 * Memformat angka menjadi format mata uang Rupiah (IDR).
 * Contoh: 150000 -> "Rp 150.000"
 */
export function formatRupiah(angka: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
}
