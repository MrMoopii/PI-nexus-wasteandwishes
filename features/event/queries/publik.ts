import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import type { EventTampilan } from "../types";
import { isPeranWw } from "../types";

/**
 * Daftar event aktif untuk halaman publik /event (tanpa login).
 * Hanya status "aktif" (bukan draft/hidden), yang akan datang lebih dulu.
 * Kolom kuota, biaya, dan fileId poster tidak dikembalikan.
 */
export async function getEventPublik(): Promise<EventTampilan[]> {
  const baris = await getDb()
    .select({
      idEvent: events.idEvent,
      namaEvent: events.namaEvent,
      jenisEvent: events.jenisEvent,
      deskripsi: events.deskripsi,
      tanggalPelaksanaan: events.tanggalPelaksanaan,
      waktuMulai: events.waktuMulai,
      waktuSelesai: events.waktuSelesai,
      lokasi: events.lokasi,
      gambarUrl: events.gambarUrl,
      statusEvent: events.statusEvent,
      penyelenggara: events.penyelenggara,
      peranWw: events.peranWw,
      tautanInfo: events.tautanInfo,
    })
    .from(events)
    .where(eq(events.statusEvent, "aktif"))
    .orderBy(
      sql`CASE WHEN ${events.tanggalPelaksanaan} >= (now() AT TIME ZONE 'Asia/Jakarta')::date THEN 0 ELSE 1 END`,
      asc(events.tanggalPelaksanaan),
    );

  return baris.map((e) => ({
    ...e,
    peranWw: e.peranWw !== null && isPeranWw(e.peranWw) ? e.peranWw : null,
  }));
}

/**
 * Detail satu event aktif untuk halaman /event/detail/[id] (tanpa login).
 * Mengembalikan null jika ID tidak ditemukan atau status bukan "aktif".
 */
export async function getEventDetailPublik(
  idEvent: number,
): Promise<EventTampilan | null> {
  const [baris] = await getDb()
    .select({
      idEvent: events.idEvent,
      namaEvent: events.namaEvent,
      jenisEvent: events.jenisEvent,
      deskripsi: events.deskripsi,
      tanggalPelaksanaan: events.tanggalPelaksanaan,
      waktuMulai: events.waktuMulai,
      waktuSelesai: events.waktuSelesai,
      lokasi: events.lokasi,
      gambarUrl: events.gambarUrl,
      statusEvent: events.statusEvent,
      penyelenggara: events.penyelenggara,
      peranWw: events.peranWw,
      tautanInfo: events.tautanInfo,
    })
    .from(events)
    .where(eq(events.idEvent, idEvent))
    .limit(1);

  if (!baris || baris.statusEvent !== "aktif") return null;

  return {
    ...baris,
    peranWw:
      baris.peranWw !== null && isPeranWw(baris.peranWw)
        ? baris.peranWw
        : null,
  };
}

/** Tanggal hari ini (Jakarta) untuk membandingkan event lewat atau mendatang. */
export { tanggalHariIniJakarta };
