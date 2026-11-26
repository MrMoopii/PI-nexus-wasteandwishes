import { Badge } from "@/components/ui/badge";
import {
  LABEL_ATURAN_HARI_LIBUR,
  type HariLiburTampilan,
} from "@/features/kunjungan/types";
import { FormHariLibur } from "./form-hari-libur";
import { TombolHapusLibur } from "./tombol-hapus-libur";

// Kolom date diformat di UTC supaya hari tidak bergeser (CONTRIBUTING 9.2).
const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "Jumat, 25 Desember 2026" dari nilai kolom date "YYYY-MM-DD". */
function tanggalPanjang(tanggal: string): string {
  return FORMAT_TANGGAL.format(new Date(`${tanggal}T00:00:00Z`));
}

type DaftarHariLiburProps = {
  daftar: HariLiburTampilan[];
  /** Batas bawah pilihan tanggal di form ubah. */
  hariIni: string;
};

/**
 * Daftar hari libur mendatang untuk admin. Setiap baris bisa dihapus, atau diubah
 * lewat form yang terbuka di bawah baris itu.
 */
export function DaftarHariLibur({ daftar, hariIni }: DaftarHariLiburProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-400">
        Hari libur mendatang
      </h2>
      {daftar.length === 0 ? (
        <p className="py-10 text-center text-sm font-medium text-gray-500">
          Belum ada hari libur mendatang.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {daftar.map((libur) => {
            const tanggal = tanggalPanjang(libur.tanggal);
            return (
              <li key={libur.idHariLibur} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{tanggal}</p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {libur.keterangan}
                    </p>
                    <Badge
                      varian={libur.aturan === "geser" ? "peringatan" : "netral"}
                      className="mt-2"
                    >
                      {LABEL_ATURAN_HARI_LIBUR[libur.aturan]}
                    </Badge>
                  </div>
                  <TombolHapusLibur
                    idHariLibur={libur.idHariLibur}
                    tanggal={tanggal}
                  />
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-(--hx-accent)">
                    Ubah
                  </summary>
                  <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <FormHariLibur hariIni={hariIni} hariLibur={libur} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
