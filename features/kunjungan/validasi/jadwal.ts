import { z } from "zod";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { tambahHari } from "../jadwal";

// Skema input actions/jadwal.ts, yaitu "Buat kunjungan" (kode tugas 2.2, CONTRIBUTING 9.8),
// beserta bagian yang juga dipakai validasi/hari-libur.ts. Tanpa "use server" dan
// "server-only", jadi form klien boleh memakai skema yang sama. Id admin selalu dari sesi.

/** Rentang "Buat kunjungan" paling panjang, dihitung termasuk tanggal mulai dan selesai. */
export const PANJANG_RENTANG_MAKS = 31;

/** Teks yang diketik admin, dikembalikan ke form saat gagal. */
export type NilaiIsian<K extends string> = Partial<Record<K, string>>;

/** Pesan error per isian, bentuk dari z.flattenError(...).fieldErrors. */
export type GalatIsian<K extends string> = Partial<Record<K, string[]>>;

/** Tanggal dari <input type="date">: wajib, "YYYY-MM-DD", dan ada di kalender. */
export function tanggalWajib(label: string) {
  return z
    .string({ error: `${label} wajib diisi.` })
    .min(1, { error: `${label} wajib diisi.` })
    .pipe(z.iso.date({ error: `${label} tidak valid.` }));
}

/** Isian teks form apa adanya, untuk divalidasi lalu dikembalikan ke form saat gagal. */
export function teksIsian<K extends string>(
  formData: FormData,
  nama: readonly K[],
): NilaiIsian<K> {
  const nilai: NilaiIsian<K> = {};
  for (const kunci of nama) {
    const isian = formData.get(kunci);
    if (typeof isian === "string") nilai[kunci] = isian;
  }
  return nilai;
}

/**
 * Rentang tanggal "Buat kunjungan": mulai tidak sebelum hari ini (WIB), selesai
 * tidak sebelum mulai, dan paling panjang PANJANG_RENTANG_MAKS hari.
 */
export const skemaRentangKunjungan = z
  .object({
    mulai: tanggalWajib("Tanggal mulai"),
    selesai: tanggalWajib("Tanggal selesai"),
  })
  .superRefine((d, ctx) => {
    // Teks "YYYY-MM-DD" dibandingkan langsung (CONTRIBUTING 9.2).
    if (d.mulai < tanggalHariIniJakarta()) {
      ctx.addIssue({
        code: "custom",
        message: "Tanggal mulai tidak boleh sebelum hari ini.",
        path: ["mulai"],
      });
    }
    if (d.selesai < d.mulai) {
      ctx.addIssue({
        code: "custom",
        message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
        path: ["selesai"],
      });
    } else if (d.selesai > tambahHari(d.mulai, PANJANG_RENTANG_MAKS - 1)) {
      ctx.addIssue({
        code: "custom",
        message: `Rentang paling panjang ${PANJANG_RENTANG_MAKS} hari.`,
        path: ["selesai"],
      });
    }
  });

/** Nama isian form "Buat kunjungan"; sama dengan atribut name di form. */
export type IsianRentangKunjungan = keyof z.input<
  typeof skemaRentangKunjungan
>;
