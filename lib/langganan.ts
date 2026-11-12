import { eq, and, gte, type SQL } from "drizzle-orm";
import { dataLangganan } from "@/lib/db/schema";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";

export type KeadaanLangganan =
  | "dihentikan"
  | "aktif"
  | "berakhir"
  | "belum_berlangganan";

/** Keadaan langganan satu pelanggan, dengan urutan cek:
 *  dihentikan → aktif → berakhir → belum berlangganan.
 *  Menerima `null` karena pelanggan tanpa baris langganan (hasil leftJoin) tidak punya status maupun tanggal.
 * */
export function keadaanLangganan(langganan: {
  status: string | null;
  tanggalAkhir: string | null;
}): KeadaanLangganan {
  const tanggalHariIni = tanggalHariIniJakarta();

  if (langganan.status === "dihentikan") {
    return "dihentikan";
  }

  if (
    langganan.status === "aktif" &&
    langganan.tanggalAkhir !== null &&
    langganan.tanggalAkhir >= tanggalHariIni
  ) {
    return "aktif";
  }

  if (langganan.tanggalAkhir !== null) {
    return "berakhir";
  }

  return "belum_berlangganan";
}

/** Syarat langganan AKTIF untuk dipakai di `.where(...)`:
 *  status 'aktif' dan tanggal akhir belum lewat (zona Asia/Jakarta).
 *  Satu-satunya tempat aturan ini ditulis.
 * */
export function kondisiLanggananAktif(): SQL | undefined {
  return and(
    eq(dataLangganan.statusLangganan, "aktif"),
    gte(dataLangganan.tanggalAkhirLangganan, tanggalHariIniJakarta()),
  );
}
