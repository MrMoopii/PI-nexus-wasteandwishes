import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  LABEL_ATURAN_HARI_LIBUR,
  type HariLiburTampilan,
} from "@/features/kunjungan/types";

// Kolom date diformat di UTC supaya hari tidak bergeser (CONTRIBUTING 9.2).
const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Hari libur mendatang yang ikut dihitung saat membuat kunjungan, hanya untuk
 * dibaca. Mengubahnya lewat halaman /admin/hari-libur.
 */
export function RingkasanHariLibur({ daftar }: { daftar: HariLiburTampilan[] }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">
          Hari libur yang dihitung
        </h2>
        <Link
          href="/admin/hari-libur"
          className="text-sm font-medium text-(--hx-accent) hover:underline"
        >
          Kelola hari libur
        </Link>
      </div>
      {daftar.length === 0 ? (
        <p className="py-6 text-center text-sm font-medium text-gray-500">
          Belum ada hari libur mendatang. Semua tanggal dari pola pelanggan
          dibuat apa adanya.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {daftar.map((libur) => (
            <li
              key={libur.idHariLibur}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <span className="text-gray-700">
                <span className="font-medium text-gray-900">
                  {FORMAT_TANGGAL.format(new Date(`${libur.tanggal}T00:00:00Z`))}
                </span>
                {" · "}
                {libur.keterangan}
              </span>
              <Badge varian={libur.aturan === "geser" ? "peringatan" : "netral"}>
                {LABEL_ATURAN_HARI_LIBUR[libur.aturan]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
