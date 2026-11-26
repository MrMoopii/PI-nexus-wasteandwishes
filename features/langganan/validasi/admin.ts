import { z } from "zod";
import { JENIS_PELANGGAN, STATUS_PENGAJUAN } from "../types";

// Skema input halaman admin langganan (kode tugas 1.4, CONTRIBUTING 9.8).
// Berkas ini dipakai halaman server untuk memvalidasi URL sebelum query,
// jadi tidak memakai "use server" maupun "server-only".

const ID_TIDAK_VALID = { error: "Pengajuan tidak valid." };

/**
 * Filter ?status= halaman daftar pengajuan admin.
 * Kosong berarti semua status; nilai di luar STATUS_PENGAJUAN ditolak
 * sehingga halaman memanggil notFound() (CONTRIBUTING 9.3).
 */
export const skemaFilterStatus = z.object({
  status: z.preprocess(
    (nilai) => (nilai === "" ? undefined : nilai),
    z
      .enum(STATUS_PENGAJUAN, { error: "Status pengajuan tidak dikenal." })
      .optional(),
  ),
});

export type FilterStatusPengajuan = z.infer<typeof skemaFilterStatus>;

/** ID pengajuan dari segmen [id] halaman detail admin. */
export const skemaIdPengajuan = z.object({
  id: z.coerce
    .number(ID_TIDAK_VALID)
    .int(ID_TIDAK_VALID)
    .positive(ID_TIDAK_VALID),
});

export type InputIdPengajuan = z.infer<typeof skemaIdPengajuan>;

// Skema isian aksi admin (kode tugas 1.5) untuk actions/admin.ts dan
// actions/admin-status.ts. Status tujuan, harga final, dan id admin tidak
// pernah masuk ke sini: semuanya dari aturan.ts, database, atau sesi.

const idPengajuan = z.coerce
  .number(ID_TIDAK_VALID)
  .int(ID_TIDAK_VALID)
  .positive(ID_TIDAK_VALID);

/** Teks wajib (pesan, alasan): dipangkas, tidak kosong, maksimal 1.000 karakter. */
function teksWajib(label: string) {
  return z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(1, { error: `${label} wajib diisi.` })
    .max(1000, { error: `${label} paling banyak 1.000 karakter.` });
}

// Jam dari <input type="time">: "JJ:MM", atau kosong. Kosong disimpan null.
const POLA_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;
const jamOpsional = z
  .preprocess(
    (nilai) => (nilai === "" ? null : nilai),
    z.string().regex(POLA_JAM, { error: "Format jam harus JJ:MM." }).nullish(),
  )
  .transform((nilai) => nilai ?? null);

const objekPenawaran = z.object({
  idPengajuan,
  // Rupiah bulat: Midtrans menolak harga desimal (LGN-27). Batas atas dari numeric(12,2).
  harga: z.coerce
    .number({ error: "Harga harus berupa angka." })
    .int({ error: "Harga harus bilangan bulat rupiah." })
    .positive({ error: "Harga harus lebih dari 0." })
    .max(9_999_999_999, { error: "Harga terlalu besar." }),
  jenisPelanggan: z.enum(JENIS_PELANGGAN, { error: "Pilih jenis pelanggan." }),
  // Dari kotak centang (formData.getAll); 1 = Senin sampai 5 = Jumat.
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
  jumlahEmber: z.coerce
    .number({ error: "Jumlah ember harus berupa angka." })
    .int({ error: "Jumlah ember harus bilangan bulat." })
    .min(1, { error: "Isi jumlah ember, minimal 1." })
    .max(200, { error: "Jumlah ember paling banyak 200." }),
  catatan: z
    .string()
    .trim()
    .max(1000, { error: "Catatan paling banyak 1.000 karakter." })
    .nullish()
    .transform((nilai) => (nilai ? nilai : null)),
});

const objekJam = objekPenawaran.pick({
  jenisPelanggan: true,
  jamMulai: true,
  jamSelesai: true,
});

/**
 * Isian form penawaran admin: harga per 30 hari dan syarat pengambilan.
 * Jam diisi berpasangan dan selesai setelah mulai (CHECK di skema); wajib untuk MOU.
 */
export const skemaPenawaran = objekPenawaran.superRefine(
  (d, ctx) => {
    if (d.jamMulai === null && d.jamSelesai === null) {
      if (d.jenisPelanggan === "mou") {
        ctx.addIssue({
          code: "custom",
          message: "Pelanggan MOU wajib punya rentang jam.",
          path: ["jamMulai"],
        });
      }
      return;
    }
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
  },
  // Tetap dicek walaupun isian lain salah, supaya semua pesan tampil sekaligus.
  { when: (payload) => objekJam.safeParse(payload.value).success },
);

export type InputPenawaran = z.infer<typeof skemaPenawaran>;

/** Nama isian form penawaran; sama dengan atribut name di form. */
export type IsianPenawaran = keyof z.input<typeof objekPenawaran>;

/** Teks yang diketik admin, dikembalikan ke form saat gagal. */
export type NilaiIsianPenawaran = Partial<
  Record<Exclude<IsianPenawaran, "hariPengambilan">, string>
> & { hariPengambilan?: string[] };

/** Pesan error per isian, bentuk dari z.flattenError(...).fieldErrors. */
export type GalatIsianPenawaran = Partial<Record<IsianPenawaran, string[]>>;

/**
 * Admin menerima tawaran pelanggan. idPesan adalah tawaran yang tampil di layar,
 * supaya tawaran yang datang belakangan tidak ikut diterima tanpa terlihat.
 */
export const skemaTerimaTawaran = z.object({
  idPengajuan,
  idPesan: z.coerce
    .number({ error: "Tawaran tidak valid." })
    .int({ error: "Tawaran tidak valid." })
    .positive({ error: "Tawaran tidak valid." }),
});

/** Pengajuan yang pembayarannya diaktifkan admin. */
export const skemaAktifkanPembayaran = z.object({ idPengajuan });

/** Penolakan pengajuan; alasan wajib dan ditampilkan ke pelanggan. */
export const skemaTolak = z.object({
  idPengajuan,
  alasan: teksWajib("Alasan penolakan"),
});

/** Pesan admin tanpa harga di riwayat negosiasi. */
export const skemaPesanAdmin = z.object({
  idPengajuan,
  pesan: teksWajib("Pesan"),
});
