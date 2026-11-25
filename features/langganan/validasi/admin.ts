import { z } from "zod";
import { STATUS_PENGAJUAN } from "../types";

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
