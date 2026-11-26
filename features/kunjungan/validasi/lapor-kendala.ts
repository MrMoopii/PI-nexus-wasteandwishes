import { z } from "zod";
import { isHariKerja } from "../jadwal";
import { PANJANG_PESAN_LAPORAN_MAKS } from "../types";
import { tanggalWajib } from "./jadwal";

// Skema input actions/lapor-kendala.ts: laporan kendala dan permintaan lewati dari
// tracker pelanggan (kode tugas 2.4, CONTRIBUTING 9.8). Tanpa "use server" dan
// "server-only". id pelanggan selalu dari sesi, dan status tujuan (dilewati)
// ditentukan aksi, bukan form.

const KUNJUNGAN_TIDAK_VALID = { error: "Pilih kunjungan." };

/** ID kunjungan dari <select>. Kosong, "3abc", desimal, dan isian yang tidak dikirim ditolak. */
const idKunjungan = z.coerce
  .number(KUNJUNGAN_TIDAK_VALID)
  .int(KUNJUNGAN_TIDAK_VALID)
  .positive(KUNJUNGAN_TIDAK_VALID);

/** Teks wajib dari textarea: dipangkas, tidak kosong, paling banyak PANJANG_PESAN_LAPORAN_MAKS. */
function teksWajib(label: string) {
  return z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(1, { error: `${label} wajib diisi.` })
    .max(PANJANG_PESAN_LAPORAN_MAKS, {
      error: `${label} paling banyak ${PANJANG_PESAN_LAPORAN_MAKS} karakter.`,
    });
}

/** Isian form "Ada kendala": kunjungan yang dilaporkan dan pesan untuk admin. */
export const skemaKendala = z.object({
  kunjunganId: idKunjungan,
  pesan: teksWajib("Pesan"),
});

/** Nama isian form kendala; sama dengan atribut name di form. */
export type IsianKendala = keyof z.input<typeof skemaKendala>;

const dasarLewati = z.object({
  kunjunganId: idKunjungan,
  alasan: teksWajib("Alasan"),
});

/**
 * Isian form "Minta lewati": kunjungan, alasan wajib, dan pilihan tanggal pengganti.
 * `pengganti` "tidak" mengabaikan tanggal; "ya" mewajibkan tanggal hari kerja.
 * Syarat yang butuh database (setelah tanggal yang dilewati, bukan hari libur,
 * belum ada kunjungan di tanggal itu) dicek mintaLewati().
 */
export const skemaLewati = z.discriminatedUnion(
  "pengganti",
  [
    dasarLewati.extend({ pengganti: z.literal("tidak") }),
    dasarLewati.extend({
      pengganti: z.literal("ya"),
      tanggalPengganti: tanggalWajib("Tanggal pengganti").refine(isHariKerja, {
        error: "Tanggal pengganti harus hari kerja (Senin–Jumat).",
      }),
    }),
  ],
  { error: "Pilih apakah meminta tanggal pengganti." },
);

// Gabungan nama isian dari setiap pilihan union, bukan hanya yang ada di keduanya.
type KunciGabungan<T> = T extends unknown ? keyof T : never;

/** Nama isian form lewati; sama dengan atribut name di form. */
export type IsianLewati = KunciGabungan<z.input<typeof skemaLewati>>;
