import Link from "next/link";
import { formatWaktu } from "@/lib/format-tanggal";
import { LABEL_PERAN_WW } from "@/features/event/types";
import type { EventTampilan } from "@/features/event/types";

// Kartu event untuk daftar admin /admin/events (kode tugas 3.3).
// Data masuk lewat props; komponen ini tidak memanggil database.

type KartuEventProps = {
  /** Event yang ditampilkan. */
  event: EventTampilan;
  /** Tab daftar asal, dipakai untuk kembali dari tombol edit. */
  fromTab: string;
};

/**
 * Satu kartu event di daftar admin. Menampilkan streamlined: status, tanggal,
 * venue, penyelenggara, dan peran WW.
 */
export function KartuEvent({ event, fromTab }: KartuEventProps) {
  const displayStatus = fromTab === "lalu" ? "lalu" : event.statusEvent;

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div>
        <div className="relative h-40 overflow-hidden bg-gray-100">
          {event.gambarUrl ? (
            <img
              src={event.gambarUrl}
              alt={event.namaEvent}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">
              Tidak ada gambar
            </div>
          )}
        </div>

        <div className="flex flex-col p-5">
          <h3 className="mb-1 line-clamp-2 text-lg font-bold leading-tight text-gray-900">
            {event.namaEvent}
          </h3>
          <p className="mb-4 text-xs font-medium text-(--hx-accent)">
            {event.jenisEvent}
          </p>

          <div className="border-t border-gray-100 pt-4">
            <div className="mb-3">
              <p className="mb-1 text-xs font-semibold text-gray-900">
                Tanggal & Waktu
              </p>
              <p className="text-xs text-gray-500">
                {String(event.tanggalPelaksanaan)}
              </p>
              <p className="text-xs text-gray-500">
                {formatWaktu(event.waktuMulai, event.waktuSelesai)}
              </p>
            </div>

            <div className="mb-3">
              <p className="mb-1 text-xs font-semibold text-gray-900">
                Venue & Lokasi
              </p>
              <p className="line-clamp-1 text-xs text-gray-500">
                {event.lokasi || "Belum ditentukan"}
              </p>
            </div>

            {/* Penyelenggara dan peran WW (kolom 3.1, isian wajib dari 3.3). */}
            <div className="mb-3">
              <p className="mb-1 text-xs font-semibold text-gray-900">
                Penyelenggara
              </p>
              <p className="line-clamp-1 text-xs text-gray-500">
                {event.penyelenggara || "Belum diisi"}
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-gray-900">Peran WW</p>
              <p className="text-xs text-gray-500">
                {event.peranWw ? LABEL_PERAN_WW[event.peranWw] : "Belum diisi"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 bg-gray-50 p-4">
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            displayStatus === "aktif"
              ? "bg-green-100 text-green-700"
              : displayStatus === "draft"
                ? "bg-gray-200 text-gray-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {displayStatus === "lalu"
            ? "BERAKHIR"
            : displayStatus.toUpperCase()}
        </span>

        <Link
          href={`/admin/events/edit/${event.idEvent}?from=${fromTab}&t=${crypto.randomUUID()}`}
          prefetch={false}
          className="inline-flex items-center gap-2 rounded-lg border border-(--hx-ink-6, #e5e7eb) bg-white px-4 py-2 text-xs font-semibold text-(--hx-ink-2) shadow-xs transition-all hover:bg-gray-50 hover:text-(--hx-accent)"
        >
          <span>Edit Event</span>
          <span aria-hidden="true">➔</span>
        </Link>
      </div>
    </div>
  );
}
