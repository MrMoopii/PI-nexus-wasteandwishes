import { Button } from "@/components/ui/button";

const KELAS_ISIAN =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent)";

/**
 * Pemilih tanggal daftar pencatatan. Form GET biasa tanpa JavaScript, supaya
 * tanggal yang dipilih menjadi ?tanggal= di URL dan bisa dibagikan/di-bookmark.
 */
export function PemilihTanggal({ tanggal }: { tanggal: string }) {
  return (
    <form
      method="get"
      action="/admin/kunjungan"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tanggal" className="text-sm font-medium text-waste">
          Tanggal kunjungan
        </label>
        <input
          id="tanggal"
          type="date"
          name="tanggal"
          defaultValue={tanggal}
          className={KELAS_ISIAN}
        />
      </div>
      <Button type="submit">Tampilkan</Button>
    </form>
  );
}
