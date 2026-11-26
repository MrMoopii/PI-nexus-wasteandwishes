// Kartu daftar kerangka: judul dan beberapa baris kunjungan.
const BARIS_DAFTAR = [1, 2, 3, 4];

/** Kerangka satu kartu daftar (jadwal mendatang atau riwayat). */
function KerangkaDaftar() {
  return (
    <div className="rounded-xl border border-waste/20 bg-white p-4 shadow-sm">
      <div className="px-1 pb-3">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-2 h-3 w-56 max-w-full rounded bg-slate-100" />
      </div>
      {BARIS_DAFTAR.map((baris) => (
        <div
          key={baris}
          className="flex items-start gap-4 border-t border-slate-100 px-1 py-3.5"
        >
          <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="h-3 w-32 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Fallback <Suspense> halaman /tracker: kartu hari ini, dua daftar, dan form laporan,
 * kira-kira setinggi isi aslinya supaya halaman tidak bergeser (CONTRIBUTING 8 no. 10).
 */
export function KerangkaTracker() {
  return (
    <div role="status" className="animate-pulse space-y-6">
      <span className="sr-only">Memuat tracker…</span>

      <div className="space-y-4 rounded-xl border border-waste/20 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4 rounded-lg bg-waste/15 p-6 sm:p-8">
            <div className="h-3 w-40 rounded bg-white/70" />
            <div className="h-8 w-48 rounded bg-white/70" />
            <div className="h-4 w-3/4 rounded bg-white/60" />
            <div className="h-8 w-32 rounded-lg bg-white/60" />
            <div className="h-9 w-56 max-w-full rounded-lg bg-white/80" />
          </div>
          <div className="space-y-3 rounded-lg border border-waste/15 p-5">
            <div className="h-3 w-32 rounded bg-slate-200" />
            <div className="h-6 w-56 max-w-full rounded bg-slate-200" />
            <div className="h-4 w-40 rounded bg-slate-100" />
            <div className="grid grid-cols-2 gap-4 pt-10">
              <div className="h-14 rounded bg-slate-100" />
              <div className="h-14 rounded bg-slate-100" />
            </div>
          </div>
        </div>
        <div className="h-11 rounded-lg bg-waste/5" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <KerangkaDaftar />
          <KerangkaDaftar />
        </div>
        <div className="space-y-6">
          <div className="h-112 rounded-xl border border-waste/20 bg-white shadow-sm" />
          <div className="h-48 rounded-xl border border-waste/20 bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );
}
