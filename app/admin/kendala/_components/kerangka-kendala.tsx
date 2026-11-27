/**
 * Kerangka fallback halaman laporan kendala: kotak masuk dan baris riwayat yang tertutup.
 * Tingginya dibuat mendekati isi asli supaya halaman tidak bergeser (CONTRIBUTING 8 no. 10).
 */
export function KerangkaKendala() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-4 w-52 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 space-y-4">
          <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-48 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
      <div className="h-[4.25rem] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
    </div>
  );
}
