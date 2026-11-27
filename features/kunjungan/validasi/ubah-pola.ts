import { z } from "zod";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { tanggalWajib } from "./jadwal";

// Skema input actions/ubah-pola.ts: admin mengubah pola jadwal tetap pelanggan
// (kode tugas 2.7, CONTRIBUTING 9.8). Tanpa "use server" dan "server-only", jadi
// form klien boleh memakai skema yang sama untuk cek awal. Id admin dan id_user
// selalu dari sesi, tidak pernah dari form (CONTRIBUTING 7.2 no. 3).

const ID_TIDAK_VALID = { error: "Pelanggan tidak valid." };

// Jam dari <input type="time">: "JJ:MM", atau kosong. Kosong disimpan null.
const POLA_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;
const jamOpsional = z
  .preprocess(
    (nilai) => (nilai === "" ? null : nilai),
    z.string().regex(POLA_JAM, { error: "Format jam harus JJ:MM." }).nullish(),
  )
  .transform((nilai) => nilai ?? null);

/**
 * Isian form ubah pola jadwal: hari pengambilan (1 = Senin sampai 5 = Jumat),
 * rentang jam, tanggal mulai berlaku, dan alasan yang tampil apa adanya ke
 * pelanggan. Tanggal berlaku tidak boleh sebelum hari ini (WIB).
 */
export const skemaUbahPola = z
  .object({
    idPengajuan: z.coerce
      .number(ID_TIDAK_VALID)
      .int(ID_TIDAK_VALID)
      .positive(ID_TIDAK_VALID),
    // Dari kotak centang (formData.getAll); disimpan urut tanpa duplikat.
    hariPengambilan: z
      .array(
        z.coerce
          .number({ error: "Hari pengambilan tidak valid." })
          .int({ error: "Hari pengambilan tidak valid." })
          .min(1, { error: "Hari pengambilan tidak valid." })
          .max(5, { error: "Hari pengambilan tidak valid." }),
      )
      .min(1, { error: "Pilih minimal satu hari pengambilan." })
      .transform((hari) => [...new Set(hari)].sort((a, b) => a - b)),
    jamMulai: jamOpsional,
    jamSelesai: jamOpsional,
    berlakuMulai: tanggalWajib("Tanggal berlaku").refine(
      (tanggal) => tanggal >= tanggalHariIniJakarta(),
      { error: "Tanggal berlaku tidak boleh sebelum hari ini." },
    ),
    alasan: z
      .string({ error: "Alasan wajib diisi." })
      .trim()
      .min(1, { error: "Alasan wajib diisi." })
      .max(1000, { error: "Alasan paling banyak 1.000 karakter." }),
  })
  .superRefine((d, ctx) => {
    // Jam diisi berpasangan; wajib untuk MOU dicek di Server Action karena
    // jenis pelanggan baru diketahui setelah membaca database.
    if (d.jamMulai === null && d.jamSelesai === null) return;
    if (d.jamMulai === null || d.jamSelesai === null) {
      ctx.addIssue({
        code: "custom",
        message: "Isi jam mulai dan jam selesai, atau kosongkan keduanya.",
        path: [d.jamMulai === null ? "jamMulai" : "jamSelesai"],
      });
      return;
    }
    // Format "JJ:MM" bisa dibandingkan sebagai teks.
    if (d.jamSelesai <= d.jamMulai) {
      ctx.addIssue({
        code: "custom",
        message: "Jam selesai harus setelah jam mulai.",
        path: ["jamSelesai"],
      });
    }
  });

/** Nama isian form ubah pola; sama dengan atribut name di form. */
export type IsianUbahPola = keyof z.input<typeof skemaUbahPola>;

/** Teks yang diketik admin, dikembalikan ke form saat gagal. */
export type NilaiIsianUbahPola = Partial<
  Record<Exclude<IsianUbahPola, "hariPengambilan">, string>
> & { hariPengambilan?: string[] };

/** Pesan error per isian, bentuk dari z.flattenError(...).fieldErrors. */
export type GalatIsianUbahPola = Partial<Record<IsianUbahPola, string[]>>;
