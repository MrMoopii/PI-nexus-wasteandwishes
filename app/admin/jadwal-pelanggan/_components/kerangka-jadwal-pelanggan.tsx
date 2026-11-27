/**
 * Kerangka fallback halaman jadwal pelanggan: kartu daftar dengan beberapa baris.
 * Tingginya dibuat mendekati isi asli supaya halaman tidak bergeser (CONTRIBUTING 8 no. 10).
 */
export function KerangkaJadwalPelanggan() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 h-4 w-48 animate-pulse rounded bg-gray-200" />
      <div className="space-y-3">
        {[0, 1, 2].map((baris) => (
          <div
            key={baris}
            className="h-24 animate-pulse rounded-lg border border-gray-100 bg-gray-50"
          />
        ))}
      </div>
    </div>
  );
}
