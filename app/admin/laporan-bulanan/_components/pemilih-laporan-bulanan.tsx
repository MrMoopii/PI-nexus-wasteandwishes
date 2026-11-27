import type { HasilLaporanBulanan } from "@/features/laporan/types";

/** Kerangka (fallback Suspense) laporan bulanan; setinggi isi aslinya (CONTRIBUTING 8 no. 10). */
export function KerangkaLaporanBulanan() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Memuat laporan bulanan">
      <div className="h-16 animate-pulse rounded-xl border border-gray-200 bg-white" />
      <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
      <div className="h-10 animate-pulse rounded-xl border border-gray-200 bg-white" />
    </div>
  );
}

/**
 * Form GET filter laporan bulanan: bulan (?bulan=) dan instansi (?instansi=).
 * Tanpa JavaScript, jadi hasilnya bisa dibagikan/di-bookmark (pola yang sama
 * dengan halaman /admin/kunjungan dan /admin/hari-libur).
 */
export function PemilihLaporan({
  hasil,
}: {
  hasil: HasilLaporanBulanan;
}) {
  const instansiAktif = hasil.daftar.length === 1 ? hasil.daftar[0] : undefined;

  return (
    <form
      method="get"
      action="/admin/laporan-bulanan"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 print:hidden"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bulan" className="text-sm font-medium text-waste">
          Bulan
        </label>
        <input
          id="bulan"
          type="month"
          name="bulan"
          defaultValue={hasil.bulan}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent)"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="instansi" className="text-sm font-medium text-waste">
          Instansi
        </label>
        <select
          id="instansi"
          name="instansi"
          defaultValue={instansiAktif?.idPengajuan ?? ""}
          className="min-w-52 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent)"
        >
          <option value="">Semua instansi</option>
          {hasil.daftar.map((rekap) => (
            <option key={rekap.idPengajuan} value={rekap.idPengajuan}>
              {rekap.namaInstansi}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex items-center rounded-lg bg-(--hx-accent) px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Tampilkan
      </button>
      <p className="basis-full text-xs text-gray-500">
        Hanya kunjungan yang sudah ditimbang yang masuk laporan.
      </p>
    </form>
  );
}
