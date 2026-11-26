/**
 * Kerangka fallback halaman pencatatan: kartu pemilih tanggal dan tabel.
 * Tingginya dibuat mendekati isi asli supaya halaman tidak bergeser (CONTRIBUTING 8 no. 10).
 */
export function KerangkaKunjungan() {
  return (
    <div className="space-y-6">
      <div className="flex h-[4.5rem] items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="min-h-80 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
    </div>
  );
}
