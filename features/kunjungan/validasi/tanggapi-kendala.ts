import { z } from "zod";
import { formatTanggal } from "@/lib/format-tanggal";
import { isHariKerja, tambahHari } from "../jadwal";
import { PANJANG_PESAN_LAPORAN_MAKS } from "../types";
import { tanggalWajib } from "./jadwal";

// Skema input actions/tanggapi-kendala.ts (kode tugas 2.6, CONTRIBUTING 9.8) dan syarat
// tanggal pengganti yang dipakai form dan aksi. Tanpa "use server" dan "server-only".
// Status tujuan (ditanggapi) dan id pelanggan tidak pernah dari form: keduanya
// ditentukan aksi dari database.

const LAPORAN_TIDAK_VALID = { error: "Laporan tidak valid." };

/** ID laporan dari hidden input. Kosong, "3abc", desimal, dan isian yang tidak dikirim ditolak. */
const idLaporan = z.coerce
  .number(LAPORAN_TIDAK_VALID)
  .int(LAPORAN_TIDAK_VALID)
  .positive(LAPORAN_TIDAK_VALID);

/**
 * Tanggapan admin, wajib untuk semua jenis laporan dan keputusan (keputusan 2.6).
 * Tampil apa adanya di tracker pelanggan.
 */
const tanggapan = z
  .string({ error: "Tanggapan wajib diisi." })
  .trim()
  .min(1, { error: "Tanggapan wajib diisi." })
  .max(PANJANG_PESAN_LAPORAN_MAKS, {
    error: `Tanggapan paling banyak ${PANJANG_PESAN_LAPORAN_MAKS} karakter.`,
  });

/** Isian form tanggapan untuk laporan kendala dan lewati tanpa tanggal pengganti. */
export const skemaTanggapiLaporan = z.object({ idLaporan, tanggapan });

/** Nama isian form tanggapan; sama dengan atribut name di form. */
export type IsianTanggapiLaporan = keyof z.input<typeof skemaTanggapiLaporan>;

const dasarPutusan = z.object({ idLaporan, tanggapan });

/**
 * Isian form keputusan untuk lewati dengan usulan tanggal. `setujui` memakai usulan
 * yang dibaca aksi dari database, bukan dari form. `tanggal_lain` mewajibkan tanggal
 * hari kerja. `tolak` tidak membuat kunjungan. Syarat lain dicek putuskanPengganti().
 */
export const skemaPutusanPengganti = z.discriminatedUnion(
  "keputusan",
  [
    dasarPutusan.extend({ keputusan: z.literal("setujui") }),
    dasarPutusan.extend({
      keputusan: z.literal("tanggal_lain"),
      tanggalPengganti: tanggalWajib("Tanggal pengganti").refine(isHariKerja, {
        error: "Tanggal pengganti harus hari kerja (Senin–Jumat).",
      }),
    }),
    dasarPutusan.extend({ keputusan: z.literal("tolak") }),
  ],
  { error: "Pilih keputusan untuk tanggal pengganti." },
);

/** Pilihan keputusan admin, diturunkan dari skema. */
export type KeputusanPengganti = z.infer<
  typeof skemaPutusanPengganti
>["keputusan"];

// Gabungan nama isian dari setiap pilihan union, bukan hanya yang ada di semuanya.
type KunciGabungan<T> = T extends unknown ? keyof T : never;

/** Nama isian form keputusan; sama dengan atribut name di form. */
export type IsianPutusanPengganti = KunciGabungan<
  z.input<typeof skemaPutusanPengganti>
>;

/**
 * Tanggal pengganti paling awal: sehari setelah tanggal yang dilewati, tetapi tidak
 * sebelum hari ini. Dipakai atribut min di form; server mengecek ulang.
 */
export function tanggalPenggantiMin(
  tanggalDilewati: string,
  hariIni: string,
): string {
  const setelahDilewati = tambahHari(tanggalDilewati, 1);
  // Teks "YYYY-MM-DD" dibandingkan langsung (CONTRIBUTING 9.2).
  return setelahDilewati > hariIni ? setelahDilewati : hariIni;
}

/**
 * Pesan penolakan tanggal pengganti, atau null jika memenuhi syarat yang tidak butuh
 * database: hari kerja, setelah tanggal yang dilewati, tidak sebelum hari ini, dan di
 * dalam masa langganan yang masih aktif (keputusan 2.6). Hari libur dan kunjungan yang
 * sudah ada dicek aksi dengan database.
 */
export function syaratTanggalPengganti(isi: {
  tanggal: string;
  tanggalDilewati: string;
  hariIni: string;
  /** Tanggal akhir langganan jika masih aktif; null jika tidak aktif. */
  akhirLanggananAktif: string | null;
}): string | null {
  const { tanggal, tanggalDilewati, hariIni, akhirLanggananAktif } = isi;
  if (!isHariKerja(tanggal)) {
    return "Tanggal pengganti harus hari kerja (Senin–Jumat).";
  }
  if (tanggal <= tanggalDilewati) {
    return `Tanggal pengganti harus setelah tanggal yang dilewati (${formatTanggal(tanggalDilewati)}).`;
  }
  if (tanggal < hariIni) {
    return "Tanggal pengganti sudah lewat. Pilih tanggal lain.";
  }
  if (akhirLanggananAktif === null) {
    return "Langganan pelanggan ini sudah tidak aktif, jadi kunjungan pengganti tidak bisa dibuat. Pilih Tolak dan jelaskan alasannya.";
  }
  if (tanggal > akhirLanggananAktif) {
    return `Tanggal pengganti melewati masa langganan pelanggan (berakhir ${formatTanggal(akhirLanggananAktif)}).`;
  }
  return null;
}
