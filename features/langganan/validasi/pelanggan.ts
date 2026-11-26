import { z } from "zod";
import {
  validasiAlamat,
  validasiNamaPelanggan,
  validasiNomorTelp,
} from "@/lib/validasi-profil";
import { JENIS_INSTANSI } from "../types";

// Skema isian dari pelanggan untuk actions/pelanggan.ts (CONTRIBUTING 9.8).
// idUser, peran, dan status tidak pernah masuk ke sini: semuanya dari sesi atau database.

/** Nama isian form pengajuan. Sama dengan atribut name di form dan kunci skema. */
export const ISIAN_PENGAJUAN = [
  "namaInstansi",
  "jenisInstansi",
  "jenisInstansiLain",
  "alamatPengambilan",
  "namaPic",
  "telpPic",
  "estimasiEmber",
  "jenisLimbah",
  "catatanPelanggan",
] as const;

export type IsianPengajuan = (typeof ISIAN_PENGAJUAN)[number];

/** Teks yang diketik pelanggan, dikembalikan ke form supaya isian tidak hilang saat gagal. */
export type NilaiIsianPengajuan = Partial<Record<IsianPengajuan, string>>;

/** Pesan error per isian, bentuk dari z.flattenError(...).fieldErrors. */
export type GalatIsianPengajuan = Partial<Record<IsianPengajuan, string[]>>;

const wajib = (label: string) => ({ error: `${label} wajib diisi.` });

/** Teks wajib: dipangkas, tidak boleh kosong. */
function teksWajib(label: string) {
  return z.string(wajib(label)).trim().min(1, wajib(label));
}

/** Teks opsional: kosong atau tidak dikirim (formData.get() = null) disimpan null. */
function teksOpsional(label: string, maks: number) {
  return z
    .string()
    .trim()
    .max(maks, { error: `${label} paling banyak ${maks} karakter.` })
    .nullish()
    .transform((nilai) => (nilai ? nilai : null));
}

/** Memakai aturan profil di lib/validasi-profil.ts supaya aturannya tidak ditulis dua kali. */
function denganAturanProfil(
  skema: z.ZodString,
  validasi: (nilai: string) => string | null,
) {
  return skema.superRefine((nilai, ctx) => {
    const pesan = validasi(nilai);
    if (pesan !== null) ctx.addIssue(pesan);
  });
}

const objekPengajuan = z.object({
  namaInstansi: teksWajib("Nama instansi")
    .min(2, { error: "Nama instansi minimal 2 karakter." })
    .max(100, { error: "Nama instansi paling banyak 100 karakter." }),
  jenisInstansi: z.enum(JENIS_INSTANSI, { error: "Pilih jenis instansi." }),
  // Isian ini hanya dikirim saat memilih Instansi Lain, jadi boleh null.
  jenisInstansiLain: teksOpsional("Jenis instansi", 50),
  alamatPengambilan: denganAturanProfil(
    teksWajib("Alamat pengambilan"),
    validasiAlamat,
  ),
  namaPic: denganAturanProfil(teksWajib("Nama PIC"), validasiNamaPelanggan),
  // Spasi dan strip dibuang dulu, sama seperti form profil.
  telpPic: denganAturanProfil(
    teksWajib("Telepon PIC").overwrite((nilai) => nilai.replace(/[\s-]/g, "")),
    validasiNomorTelp,
  ),
  // Isian kosong menjadi 0, sehingga ditolak oleh min(1).
  estimasiEmber: z.coerce
    .number({ error: "Perkiraan jumlah ember harus berupa angka." })
    .int({ error: "Perkiraan jumlah ember harus bilangan bulat." })
    .min(1, { error: "Isi perkiraan jumlah ember, minimal 1." })
    .max(200, { error: "Perkiraan jumlah ember paling banyak 200." }),
  jenisLimbah: teksOpsional("Jenis limbah", 100),
  catatanPelanggan: teksOpsional("Catatan", 500),
});

const objekJenisInstansi = objekPengajuan.pick({
  jenisInstansi: true,
  jenisInstansiLain: true,
});

/**
 * Isian form pengajuan langganan dari pelanggan.
 * Jenis instansi lain wajib jika memilih "lainnya", dan disimpan null jika tidak.
 */
export const skemaPengajuan = objekPengajuan
  .refine((d) => d.jenisInstansi !== "lainnya" || !!d.jenisInstansiLain, {
    error: "Tulis jenis instansi Anda.",
    path: ["jenisInstansiLain"],
    // Tetap dicek walaupun isian lain salah, supaya semua pesan tampil sekaligus.
    when: (payload) => objekJenisInstansi.safeParse(payload.value).success,
  })
  .transform((d) => ({
    ...d,
    jenisInstansiLain: d.jenisInstansi === "lainnya" ? d.jenisInstansiLain : null,
  }));

export type InputPengajuan = z.infer<typeof skemaPengajuan>;

const ID_TIDAK_VALID = { error: "Pengajuan tidak valid." };

/** ID pengajuan yang dibatalkan pelanggan. Kepemilikannya dicek di Server Action. */
export const skemaBatalPengajuan = z.object({
  idPengajuan: z.coerce
    .number(ID_TIDAK_VALID)
    .int(ID_TIDAK_VALID)
    .positive(ID_TIDAK_VALID),
});

// ── Negosiasi (1.3) ───────────────────────────────────────────────

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
 * dan pesan yang menyertainya. Kepemilikan dan status dicek di Server Action.
 */
export const skemaTawarHarga = z.object({
  idPengajuan: z.coerce
    .number(ID_TIDAK_VALID)
    .int(ID_TIDAK_VALID)
    .positive(ID_TIDAK_VALID),
  // Kolom harga_usulan numeric(12,2): dua desimal adalah batas database (CONTRIBUTING 9.8).
  hargaUsulan: z.coerce
    .number(HARGA_TIDAK_VALID)
    .int(HARGA_TIDAK_VALID)
    .positive({ error: "Harga harus lebih dari 0." })
    .max(999999999999, {
      error: "Harga terlalu besar, maksimal 999.999.999.999.",
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
