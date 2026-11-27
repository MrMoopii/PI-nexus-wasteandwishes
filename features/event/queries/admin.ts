import "server-only";

import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { isPeranWw, type EventTampilan } from "../types";

// Query admin event (kode tugas 3.3). Baris pertama import "server-only" supaya
// file ini tidak bisa terimpor dari komponen klien (CONTRIBUTING 4.2 no. 2).

/**
 * Memastikan pemanggil admin sebelum query membaca data.
 * Pengguna belum login dialihkan ke halaman login, bukan admin ke beranda.
 */
async function pastikanAdmin(): Promise<void> {
  const cek = await requireAdmin();
  if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");
}

/**
 * Daftar semua event untuk halaman admin /admin/events.
 * Hanya admin; yang dikembalikan hanya kolom yang dipakai tampilan.
 * Event diurutkan dari yang terbaru.
 */
export async function getDaftarEventAdmin(): Promise<EventTampilan[]> {
  // 1. Pastikan yang memanggil adalah admin (CONTRIBUTING 7.2 no. 7).
  await pastikanAdmin();

  // 2. Ambil hanya kolom yang dipakai tampilan; kuota, biaya, dan fileId poster
  //    tidak ikut (EventTampilan di features/event/types.ts).
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
    .orderBy(desc(events.idEvent));

  // 3. Pastikan peran WW yang keluar dari database benar-benar termasuk tipe.
  return baris.map((e) => ({
    ...e,
    peranWw: e.peranWw !== null && isPeranWw(e.peranWw) ? e.peranWw : null,
  }));
}

/**
 * Detail satu event untuk halaman ubah admin /admin/events/edit/[id].
 * Hanya admin; mengembalikan null jika event tidak ditemukan.
 */
export async function getEventAdmin(
  idEvent: number,
): Promise<EventTampilan | null> {
  // 1. Pastikan yang memanggil adalah admin (CONTRIBUTING 7.2 no. 7).
  await pastikanAdmin();

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

  if (!baris) return null;

  return {
    ...baris,
    peranWw:
      baris.peranWw !== null && isPeranWw(baris.peranWw)
        ? baris.peranWw
        : null,
  };
}
