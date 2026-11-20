import { z } from "zod";
import { PERAN_WW } from "../types";

// Skema input halaman admin event (kode tugas 3.3, CONTRIBUTING 9.8).
// Berkas ini dipakai halaman server untuk memvalidasi URL dan Server Action
// untuk memvalidasi isian form, jadi tidak memakai "use server" maupun
// "server-only". kuota_peserta dan biaya_event sengaja tidak ada di sini:
// keduanya tidak dipakai lagi dan nilainya di database dibiarkan apa adanya.

const ID_TIDAK_VALID = { error: "Event tidak valid." };
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const POLA_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** ID event dari segmen [id] halaman ubah admin. */
export const skemaIdEvent = z.object({
  idEvent: z.coerce
    .number(ID_TIDAK_VALID)
    .int(ID_TIDAK_VALID)
    .positive(ID_TIDAK_VALID),
});

export type InputIdEvent = z.infer<typeof skemaIdEvent>;

/** Tab daftar event admin. Kosong berarti "aktif"; nilai lain ditolak. */
export const skemaTabEvent = z.object({
  tab: z.preprocess(
    (nilai) => (nilai === "" || nilai === null ? undefined : nilai),
    z
      .enum(["aktif", "draft", "lalu"], { error: "Tab event tidak dikenal." })
      .default("aktif"),
  ),
});

export type TabEvent = z.infer<typeof skemaTabEvent>["tab"];

/** Teks wajib: dipangkas, tidak kosong, dengan batas panjang kolom teks. */
function teksWajib(label: string, maksimal = 200) {
  return z
    .string({ error: `${label} wajib diisi.` })
    .trim()
    .min(1, { error: `${label} wajib diisi.` })
    .max(maksimal, { error: `${label} paling banyak ${maksimal} karakter.` });
}

// Jam dari <input type="time">: "JJ:MM", atau kosong. Kosong disimpan null.
const jamOpsional = z
  .preprocess(
    (nilai) => (nilai === "" || nilai === null ? null : nilai),
    z.string().regex(POLA_JAM, { error: "Format jam harus JJ:MM." }).nullish(),
  )
  .transform((nilai) => nilai ?? null);

// Tanggal dari <input type="date">: "YYYY-MM-DD" yang benar-benar ada di kalender.
const tanggalWajib = z
  .string({ error: "Tanggal pelaksanaan wajib diisi." })
  .trim()
  .regex(POLA_TANGGAL, { error: "Format tanggal harus YYYY-MM-DD." })
  .refine((nilai) => {
    const tanggal = new Date(`${nilai}T00:00:00Z`);
    return (
      !Number.isNaN(tanggal.getTime()) &&
      tanggal.toISOString().slice(0, 10) === nilai
    );
  }, { error: "Tanggal pelaksanaan tidak valid." });

// Tautan info hanya boleh https:// (keputusan 3.3). Kosong disimpan null.
const tautanInfo = z
  .string()
  .trim()
  .max(500, { error: "Tautan info paling banyak 500 karakter." })
  .nullish()
  .transform((nilai) => (nilai ? nilai : null))
  .refine((nilai) => nilai === null || nilai.startsWith("https://"), {
    error: "Tautan info harus diawali https://.",
  });

// Poster dikirim form sebagai isian tersembunyi setelah unggahan ImageKit selesai.
const posterOpsional = z
  .string()
  .trim()
  .max(1000, { error: "Data poster tidak valid." })
  .nullish()
  .transform((nilai) => (nilai ? nilai : null));

const objekEvent = z.object({
  namaEvent: teksWajib("Nama event"),
  jenisEvent: teksWajib("Jenis event"),
  // Wajib untuk event baru; event lama yang kosong harus diisi saat diubah.
  penyelenggara: teksWajib("Penyelenggara"),
  peranWw: z.enum(PERAN_WW, { error: "Pilih peran WW." }),
  tautanInfo,
  tanggalPelaksanaan: tanggalWajib,
  waktuMulai: jamOpsional,
  waktuSelesai: jamOpsional,
  lokasi: teksWajib("Venue dan lokasi", 300),
  statusEvent: z.enum(["draft", "aktif", "lalu"], {
    error: "Status event tidak dikenal.",
  }),
  gambarUrl: posterOpsional,
  gambarFileId: posterOpsional,
  deletedPosterFileId: posterOpsional,
});

/** Isian form tambah dan ubah event admin. Gagal jika ada isian wajib kosong. */
export const skemaEvent = objekEvent;

export type InputEvent = z.infer<typeof skemaEvent>;

/** Nama isian form event; sama dengan atribut name di form. */
export type IsianEvent = keyof z.input<typeof objekEvent>;

/** Teks yang diketik admin, dikembalikan ke form saat validasi gagal. */
export type NilaiIsianEvent = Partial<Record<IsianEvent, string>>;

/** Pesan error per isian, bentuk dari z.flattenError(...).fieldErrors. */
export type GalatIsianEvent = Partial<Record<IsianEvent, string[]>>;
