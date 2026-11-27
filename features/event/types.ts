import type { events } from "@/lib/db/schema";

/** Setiap daftar ditulis sekali, lalu tipenya diturunkan dari daftar itu.
    Daftar ini juga dipakai skema Zod: z.enum(PERAN_WW) (CONTRIBUTING 9.8).
    Setiap daftar HARUS sama dengan CHECK-nya di lib/db/schema-event.ts.
*/

/**
 * Peran WW di event pihak lain: narasumber, peserta, atau mitra.
 * Harus sama dengan CHECK events_peran_ww_valid.
 */
export const PERAN_WW = ["narasumber", "peserta", "mitra"] as const;

export type PeranWw = (typeof PERAN_WW)[number];

/** Pemeriksa peran WW dari database (bertipe string) tanpa "as". */
export function isPeranWw(nilai: string): nilai is PeranWw {
  return PERAN_WW.some((peran) => peran === nilai);
}

/** Label tampilan setiap peran WW, untuk pilihan di form admin dan halaman publik. */
export const LABEL_PERAN_WW: Record<PeranWw, string> = {
  narasumber: "Narasumber",
  peserta: "Peserta",
  mitra: "Mitra",
};

// Bentuk data untuk tampilan. Nama kolom diambil dari skema (CONTRIBUTING 9.2),
// lalu kolom pilihan diganti tipe sempitnya. Kolom date tetap string "YYYY-MM-DD"
// dan kolom time tetap string "HH:MM:SS".
type BarisEvent = typeof events.$inferSelect;

/**
 * Satu event untuk halaman publik (3.2) dan daftar admin (3.3).
 * Tanpa kuota dan biaya karena event hanya informasi, dan tanpa fileId poster yang
 * hanya dibutuhkan Server Action admin saat poster diganti.
 * Event lama boleh tanpa penyelenggara, peran WW, dan tautan info (null).
 */
export type EventTampilan = Omit<
  BarisEvent,
  "kuotaPeserta" | "biayaEvent" | "gambarFileId" | "peranWw"
> & {
  peranWw: PeranWw | null;
};
