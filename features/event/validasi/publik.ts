import { z } from "zod";

const ID_TIDAK_VALID = { error: "Event tidak valid." };

/**
 * Skema validasi ID event dari parameter URL /event/detail/[id].
 * Hanya bilangan bulat positif yang diterima. Kosong atau bukan angka ditolak.
 */
export const skemaIdEventPublik = z.object({
  id: z.coerce.number(ID_TIDAK_VALID).int(ID_TIDAK_VALID).positive(ID_TIDAK_VALID),
});

export type InputIdEventPublik = z.infer<typeof skemaIdEventPublik>;
