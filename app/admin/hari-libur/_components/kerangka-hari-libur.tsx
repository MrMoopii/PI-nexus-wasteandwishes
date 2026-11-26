/**
 * Kerangka fallback halaman hari libur: kartu form tambah dan kartu daftar.
 * Tingginya dibuat mendekati isi asli supaya halaman tidak bergeser (CONTRIBUTING 8 no. 10).
 */
export function KerangkaHariLibur() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 h-4 w-36 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
          <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="mt-4 h-12 w-96 max-w-full animate-pulse rounded-lg bg-gray-100" />
        <div className="mt-4 h-9 w-40 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="min-h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
    </div>
  );
}
