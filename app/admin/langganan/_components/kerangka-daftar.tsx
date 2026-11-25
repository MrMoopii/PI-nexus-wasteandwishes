/**
 * Kerangka fallback halaman daftar pengajuan admin.
 * Tingginya dibuat mendekati isi asli supaya halaman tidak bergeser (CONTRIBUTING 8 no. 10).
 */
export function KerangkaDaftarPengajuan() {
  return (
    <div className="mx-auto w-full max-w-7xl font-(family-name:--font-plus-jakarta-sans)">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-10 w-52 animate-pulse rounded-lg bg-amber-50" />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-8 w-24 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
      <div className="min-h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
    </div>
  );
}
