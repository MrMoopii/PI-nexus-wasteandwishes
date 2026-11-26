import { z } from "zod";

// Skema isian negosiasi dari pelanggan untuk actions/negosiasi.ts (CONTRIBUTING 9.8).
// idUser, peran, dan status tidak pernah masuk ke sini: semuanya dari sesi atau database.

const ID_TIDAK_VALID = { error: "Pengajuan tidak valid." };
const HARGA_TIDAK_VALID = { error: "Harga tawaran tidak valid." };

/** ID pengajuan untuk aksi negosiasi. Kepemilikan dicek di Server Action. */
export const skemaIdPengajuan = z.object({
  idPengajuan: z.coerce
    .number(ID_TIDAK_VALID)
    .int(ID_TIDAK_VALID)
    .positive(ID_TIDAK_VALID),
});

/**
 * Tawaran harga pelanggan untuk satu pengajuan: ID pengajuan, harga usulan,
 * dan catatan yang menyertainya. Kepemilikan dan status dicek di Server Action.
 * Kolom harga_usulan bertipe numeric(12,2), jadi maksimal 9.999.999.999,99.
 */
export const skemaTawarHarga = z.object({
  idPengajuan: z.coerce
    .number(ID_TIDAK_VALID)
    .int(ID_TIDAK_VALID)
    .positive(ID_TIDAK_VALID),
  hargaUsulan: z.coerce
    .number(HARGA_TIDAK_VALID)
    .int(HARGA_TIDAK_VALID)
    .positive({ error: "Harga harus lebih dari 0." })
    .max(9_999_999_999, {
      error: "Harga terlalu besar, maksimal 9.999.999.999.",
    }),
  catatan: z
    .string()
    .trim()
    .max(500, { error: "Catatan paling banyak 500 karakter." })
    .nullish()
    .transform((nilai) => (nilai ? nilai : null)),
});

export type InputTawarHarga = z.infer<typeof skemaTawarHarga>;

/**
 * Pesan pelanggan tanpa harga untuk satu pengajuan, saat status masih
 * menunggu_review, ditawarkan, atau negosiasi. Status tidak berubah (aturan.ts).
 */
export const skemaKirimPesan = z.object({
  idPengajuan: z.coerce
    .number(ID_TIDAK_VALID)
    .int(ID_TIDAK_VALID)
    .positive(ID_TIDAK_VALID),
  pesan: z
    .string()
    .trim()
    .min(1, { error: "Pesan wajib diisi." })
    .max(500, { error: "Pesan paling banyak 500 karakter." }),
});
