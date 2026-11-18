import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export async function selesaikanPembayaranEvent(
  idPembayaranEvent: number,
  midtransTransactionId: string | null,
): Promise<void> {
  await getDb().execute(sql`
    WITH target AS (
      SELECT id_pembayaran_event, event_id, id_user
      FROM pembayaran_event
      WHERE id_pembayaran_event = ${idPembayaranEvent}
        AND status_pembayaran IN ('pending', 'memproses')
      FOR UPDATE
    ),
    event_target AS (
      SELECT events.id_event, events.kuota_peserta, events.status_event
      FROM events
      INNER JOIN target ON target.event_id = events.id_event
      FOR UPDATE OF events
    ),
    peserta_lama AS (
      SELECT 1
      FROM pendaftaran_event
      INNER JOIN target
        ON target.event_id = pendaftaran_event.event_id
        AND target.id_user = pendaftaran_event.id_user
    ),
    peserta_dibuat AS (
      INSERT INTO pendaftaran_event (event_id, id_user)
      SELECT target.event_id, target.id_user
      FROM target
      WHERE NOT EXISTS (SELECT 1 FROM peserta_lama)
        AND EXISTS (
          SELECT 1
          FROM event_target
          WHERE event_target.status_event = 'aktif'
            AND event_target.kuota_peserta > 0
        )
      ON CONFLICT (event_id, id_user) DO NOTHING
      RETURNING event_id
    ),
    slot_diambil AS (
      UPDATE events
      SET kuota_peserta = kuota_peserta - 1
      WHERE id_event IN (SELECT event_id FROM peserta_dibuat)
      RETURNING id_event
    )
    UPDATE pembayaran_event
    SET status_pembayaran = CASE
          WHEN EXISTS (SELECT 1 FROM peserta_dibuat)
            OR EXISTS (SELECT 1 FROM peserta_lama)
            THEN 'berhasil'
          ELSE 'berhasil_tanpa_kuota'
        END,
        midtrans_transaction_id = ${midtransTransactionId},
        tanggal_dibayar = now()
    WHERE id_pembayaran_event = ${idPembayaranEvent}
      AND status_pembayaran IN ('pending', 'memproses')
  `);
}
