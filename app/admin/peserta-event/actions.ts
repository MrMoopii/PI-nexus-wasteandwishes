"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { events, pendaftaranEvent } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function hapusPesertaEvent(formData: FormData) {
  const cek = await requireAdmin();
  if (!cek.ok) return { error: cek.pesan };

  const idPendaftaran = Number(formData.get("idPendaftaran"));
  const eventId = Number(formData.get("eventId"));

  if (
    !(
      Number.isInteger(idPendaftaran) &&
      idPendaftaran > 0 &&
      Number.isInteger(eventId) &&
      eventId > 0
    )
  ) {
    return { error: "Data peserta tidak valid." };
  }

  const [eventAktif] = await getDb()
    .select({ idEvent: events.idEvent })
    .from(events)
    .where(and(eq(events.idEvent, eventId), eq(events.statusEvent, "aktif")))
    .limit(1);

  if (!eventAktif) {
    return { error: "Event aktif tidak ditemukan." };
  }

  const [dihapus] = await getDb()
    .delete(pendaftaranEvent)
    .where(
      and(
        eq(pendaftaranEvent.idPendaftaran, idPendaftaran),
        eq(pendaftaranEvent.eventId, eventId),
      ),
    )
    .returning({ idPendaftaran: pendaftaranEvent.idPendaftaran });

  if (!dihapus) {
    return { error: "Peserta tidak ditemukan." };
  }

  // Kursi yang ditinggalkan peserta dikembalikan ke kuota event.
  await getDb()
    .update(events)
    .set({ kuotaPeserta: sql`${events.kuotaPeserta} + 1` })
    .where(eq(events.idEvent, eventId));

  revalidatePath(`/admin/peserta-event/${eventId}`);
  return { ok: true };
}
