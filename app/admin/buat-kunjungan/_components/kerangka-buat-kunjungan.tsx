/**
 * Kerangka fallback halaman buat kunjungan: kartu form rentang dan kartu hari libur.
 * Tingginya dibuat mendekati isi asli supaya halaman tidak bergeser (CONTRIBUTING 8 no. 10).
 */
export function KerangkaBuatKunjungan() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-gray-100" />
        <div className="mt-4 h-9 w-36 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="min-h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
    </div>
  );
}
