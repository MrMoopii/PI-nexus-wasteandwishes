import { z } from "zod";
import { tanggalWajib } from "./jadwal";

// Skema input actions/pencatatan.ts dan parameter ?tanggal= halaman
// /admin/kunjungan (kode tugas 2.3, CONTRIBUTING 9.8). Tanpa "use server" dan
// "server-only", jadi form klien boleh memakai skema yang sama untuk cek awal.
// idUser dan dicatatOleh tidak pernah masuk skema: keduanya dari sesi.

const ID_TIDAK_VALID = { error: "Kunjungan tidak valid." };

/** ID kunjungan dari form, dipakai bersama oleh semua aksi pencatatan. */
const idKunjungan = z.coerce
  .number(ID_TIDAK_VALID)
  .int(ID_TIDAK_VALID)
  .positive(ID_TIDAK_VALID);

/**
 * Jumlah ember dari isian teks. Sengaja tidak memakai z.coerce.number():
 * z.coerce.number("") menghasilkan 0, padahal isian kosong harus ditolak.
 */
const jumlahEmberWajib = z
  .string({ error: "Jumlah ember wajib diisi." })
  .trim()
  .min(1, { error: "Jumlah ember wajib diisi." })
  .regex(/^\d+$/, { error: "Jumlah ember harus bilangan bulat." })
  .transform((teks) => Number(teks))
  // Sama dengan CHECK kunjungan_pengambilan_jumlah_ember_tidak_negatif (>= 0).
  .pipe(z.number().min(0, { error: "Jumlah ember tidak boleh negatif." }));

/** Berat dari isian teks; isian kosong ditolak. */
const beratKgWajib = z
  .string({ error: "Berat wajib diisi." })
  .trim()
  .min(1, { error: "Berat wajib diisi." })
  .regex(/^\d+(\.\d{1,2})?$/, {
    error: "Berat berupa angka, maksimal dua angka desimal.",
  })
  .transform((teks) => Number(teks))
  .pipe(
    z
      .number()
      .min(0, { error: "Berat tidak boleh negatif." })
      .max(99999999.99, { error: "Berat terlalu besar." }),
  );

/**
 * Foto bukti baru untuk form ubah. Kosong berarti foto lama dipertahankan;
 * diisi berarti harus URL https. fileId hanya wajib jika URL-nya berubah, karena
 * fileId lama dipakai deleteImageKitFile() saat foto diganti (CONTRIBUTING 9.2).
 */
const fotoBaruOpsional = z
  .string({ error: "Foto bukti tidak valid." })
  .trim()
  .refine(
    (nilai) => nilai === "" || z.url({ protocol: /^https$/ }).safeParse(nilai).success,
    { error: "Foto bukti harus berupa URL https." },
  );

/**
 * Filter tanggal halaman pencatatan dari ?tanggal=. Kosong berarti hari ini;
 * diisi tetapi bukan tanggal kalender berarti halaman 404 (CONTRIBUTING 9.3).
 */
export const skemaFilterTanggal = z.object({
  tanggal: tanggalWajib("Tanggal").optional(),
});

/** Isian langkah 1: jumlah ember dan foto bukti yang sudah diunggah ke ImageKit. */
export const skemaCatatEmber = z.object({
  idKunjungan,
  jumlahEmber: jumlahEmberWajib,
  fotoBukti: z.url({
    protocol: /^https$/,
    error: "Foto bukti wajib diunggah.",
  }),
  fotoBuktiFileId: z
    .string({ error: "Foto bukti wajib diunggah." })
    .trim()
    .min(1, { error: "Foto bukti wajib diunggah." }),
});

/** Isian langkah 2: berat setelah ditimbang, dalam kg. */
export const skemaCatatBerat = z.object({
  idKunjungan,
  beratKg: beratKgWajib,
});

/**
 * Isian form ubah pencatatan. Jumlah ember dan foto boleh diubah kapan pun
 * setelah kunjungan diambil atau ditimbang. Berat hanya dikirim saat statusnya
 * sudah ditimbang; kosong berarti berat lama dipertahankan.
 */
export const skemaUbahPencatatan = z
  .object({
    idKunjungan,
    jumlahEmber: jumlahEmberWajib,
    fotoBukti: fotoBaruOpsional,
    // Wajib jika fotoBukti diisi (foto baru), boleh kosong jika foto lama dipertahankan.
    fotoBuktiFileId: z.string({ error: "Foto bukti tidak valid." }).trim(),
    beratKg: z
      .string({ error: "Berat wajib diisi." })
      .trim()
      .nullish()
      .transform((teks) => (teks ? teks : null))
      .pipe(z.union([z.null(), beratKgWajib])),
  })
  .superRefine((d, ctx) => {
    if (d.fotoBukti !== "" && d.fotoBuktiFileId === "") {
      ctx.addIssue({
        code: "custom",
        message: "Foto bukti tidak lengkap. Unggah ulang fotonya.",
        path: ["fotoBukti"],
      });
    }
  });

/** Isian tandai tertunda untuk satu atau banyak kunjungan sekaligus. */
export const skemaTandaiTertunda = z.object({
  idKunjungan: z
    .array(idKunjungan, { error: "Pilih minimal satu kunjungan." })
    .min(1, { error: "Pilih minimal satu kunjungan." }),
  alasan: z
    .string({ error: "Alasan tertunda wajib diisi." })
    .trim()
    .min(1, { error: "Alasan tertunda wajib diisi." })
    .max(300, { error: "Alasan paling banyak 300 karakter." }),
  tanggalPalingLambat: tanggalWajib("Tanggal paling lambat"),
});

/** Nama isian form langkah 1; sama dengan atribut name di form. */
export type IsianCatatEmber = keyof z.input<typeof skemaCatatEmber>;

/** Nama isian form langkah 2; sama dengan atribut name di form. */
export type IsianCatatBerat = keyof z.input<typeof skemaCatatBerat>;

/** Nama isian form ubah pencatatan; sama dengan atribut name di form. */
export type IsianUbahPencatatan = keyof z.input<typeof skemaUbahPencatatan>;

/** Nama isian form tandai tertunda; sama dengan atribut name di form. */
export type IsianTandaiTertunda = keyof z.input<typeof skemaTandaiTertunda>;
