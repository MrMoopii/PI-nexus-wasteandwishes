// Tujuh baris kerangka, kira-kira setara jumlah isian form pengajuan.
const BARIS_KERANGKA = [1, 2, 3, 4, 5, 6, 7];

/**
 * Fallback <Suspense> halaman /langganan, kira-kira setinggi form pengajuan
 * supaya isi di bawahnya tidak terdorong saat data muncul (CONTRIBUTING 8 no. 10).
 */
export function KerangkaLangganan() {
  return (
    <div
      role="status"
      className="animate-pulse rounded-xl border border-waste/20 bg-white p-6 shadow-sm"
    >
      <span className="sr-only">Memuat data langganan…</span>
      <div className="h-6 w-48 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
      <div className="mt-6 space-y-5">
        {BARIS_KERANGKA.map((baris) => (
          <div key={baris} className="space-y-1.5">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="h-10 rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-9 w-36 rounded-lg bg-slate-200" />
    </div>
  );
}
