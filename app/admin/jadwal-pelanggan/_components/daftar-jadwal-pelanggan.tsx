import { Badge } from "@/components/ui/badge";
import type { PelangganPolaAktif } from "@/features/kunjungan/queries/jadwal-pelanggan";
import { formatTanggal } from "@/lib/format-tanggal";
import { FormUbahPola } from "./form-ubah-pola";

// Nama hari pola: 1 = Senin sampai 5 = Jumat, sama dengan hari_pengambilan.
// Ditulis lokal karena types.ts (2.1) belum punya daftar label hari.
const LABEL_HARI: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
};

/** "Senin, Rabu, Jumat" dari pola hari; teks jujur jika pola masih kosong. */
function teksHari(hari: readonly number[]): string {
  if (hari.length === 0) return "Belum ada pola hari";
  return [...hari]
    .sort((a, b) => a - b)
    .map((nomor) => LABEL_HARI[nomor] ?? `Hari ke-${nomor}`)
    .join(", ");
}

/** Rentang jam "08.00 – 10.00 WIB", atau keterangan jam menyesuaikan WW. */
function teksJam(jamMulai: string | null, jamSelesai: string | null): string {
  if (jamMulai === null && jamSelesai === null) {
    return "Jam menyesuaikan WW";
  }
  if (jamMulai === null || jamSelesai === null) {
    // Database hanya mengizinkan keduanya kosong atau keduanya terisi.
    return "Rentang jam tidak lengkap";
  }
  return `${jamMulai.slice(0, 5).replace(":", ".")} – ${jamSelesai
    .slice(0, 5)
    .replace(":", ".")} WIB`;
}

type DaftarJadwalPelangganProps = {
  daftar: PelangganPolaAktif[];
  /** Batas bawah pilihan tanggal berlaku (WIB). */
  hariIni: string;
};

/**
 * Daftar pelanggan aktif beserta pola jadwal tetapnya. Setiap baris membuka form
 * ubah pola; hanya admin yang bisa mengubah, sesuai keputusan issue 2.7.
 */
export function DaftarJadwalPelanggan({
  daftar,
  hariIni,
}: DaftarJadwalPelangganProps) {
  if (daftar.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
        <p className="text-center font-medium text-gray-500">
          Belum ada pelanggan aktif dengan pengajuan siap bayar.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">
        Pelanggan aktif
      </h2>
      <ul className="divide-y divide-gray-100">
        {daftar.map((pelanggan) => (
          <li key={pelanggan.idPengajuan} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">
                  {pelanggan.namaInstansi}
                </p>
                <p className="mt-0.5 text-sm text-gray-600">
                  {pelanggan.namaPelanggan || "Nama pelanggan belum diisi"}
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  {teksHari(pelanggan.hariPengambilan)} ·{" "}
                  {teksJam(pelanggan.jamMulai, pelanggan.jamSelesai)}
                </p>
                {pelanggan.tanggalAkhir !== null && (
                  <p className="mt-1 text-xs text-gray-500">
                    Langganan aktif sampai {formatTanggal(pelanggan.tanggalAkhir)}
                  </p>
                )}
              </div>
              <Badge varian={pelanggan.jenisPelanggan === "mou" ? "sukses" : "netral"}>
                {pelanggan.jenisPelanggan === "mou"
                  ? "MOU"
                  : pelanggan.jenisPelanggan === "reguler"
                    ? "Reguler"
                    : "Jenis belum ditetapkan"}
              </Badge>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-(--hx-accent)">
                Ubah pola
              </summary>
              <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <FormUbahPola
                  idPengajuan={pelanggan.idPengajuan}
                  namaInstansi={pelanggan.namaInstansi}
                  hariIni={hariIni}
                  nilaiAwal={{
                    hariPengambilan: pelanggan.hariPengambilan.map(String),
                    jamMulai: pelanggan.jamMulai?.slice(0, 5),
                    jamSelesai: pelanggan.jamSelesai?.slice(0, 5),
                  }}
                />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
