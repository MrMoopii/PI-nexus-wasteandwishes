import { z } from "zod";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { isHariKerja } from "../jadwal";
import { ATURAN_HARI_LIBUR } from "../types";
import { tanggalWajib } from "./jadwal";

// Skema input actions/hari-libur.ts: tambah, ubah, dan hapus hari libur
// (kode tugas 2.2, CONTRIBUTING 9.8). Tanpa "use server" dan "server-only".

const ID_TIDAK_VALID = { error: "Hari libur tidak valid." };

/**
 * Isian form tambah dan ubah hari libur: tanggal hari kerja mulai hari ini,
 * keterangan, dan aturan. Sabtu dan Minggu ditolak karena memang tidak ada pengambilan.
 */
export const skemaHariLibur = z.object({
  tanggal: tanggalWajib("Tanggal libur")
    .refine(isHariKerja, {
      error: "Sabtu dan Minggu memang tidak ada pengambilan.",
    })
    .refine((tanggal) => tanggal >= tanggalHariIniJakarta(), {
      error: "Tanggal libur tidak boleh sebelum hari ini.",
    }),
  keterangan: z
    .string({ error: "Keterangan wajib diisi." })
    .trim()
    .min(1, { error: "Keterangan wajib diisi." })
    .max(200, { error: "Keterangan paling banyak 200 karakter." }),
  aturan: z.enum(ATURAN_HARI_LIBUR, { error: "Pilih aturan hari libur." }),
});

/** Nama isian form hari libur (tanpa ID); sama dengan atribut name di form. */
export type IsianHariLibur = keyof z.input<typeof skemaHariLibur>;

/**
 * ID hari libur yang diubah atau dihapus. Dicek terpisah dari isian form, supaya
 * ID yang salah menjadi satu pesan umum, bukan pesan di salah satu isian.
 */
export const skemaIdHariLibur = z.object({
  idHariLibur: z.coerce
    .number(ID_TIDAK_VALID)
    .int(ID_TIDAK_VALID)
    .positive(ID_TIDAK_VALID),
});
