import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { formatTanggal, formatWaktu } from "@/lib/format-tanggal";

export default function PesertaEventPage() {
  return (
    <Suspense fallback={<DaftarEventKerangka />}>
      <DaftarEventAktif />
    </Suspense>
  );
}

async function DaftarEventAktif() {
  await connection();

  const dataEvents = await getDb()
    .select()
    .from(events)
    .where(eq(events.statusEvent, "aktif"))
    .orderBy(asc(events.tanggalPelaksanaan), asc(events.idEvent));

  return (
    <div className="mx-auto max-w-7xl p-6 font-(family-name:--font-plus-jakarta-sans)">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Peserta Event</h1>
      <p className="mb-8 text-sm text-gray-500">
        Pilih event aktif untuk melihat peserta yang sudah mendaftar.
      </p>

      {dataEvents.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <p className="text-center font-medium text-gray-500">
            Belum ada event aktif.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dataEvents.map((event) => (
            <div
              key={event.idEvent}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
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
                  <h2 className="mb-1 line-clamp-2 text-lg font-bold leading-tight text-gray-900">
                    {event.namaEvent}
                  </h2>
                  <p className="mb-4 text-xs font-medium text-orange-500">
                    {event.jenisEvent}
                  </p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="mb-1 text-xs font-semibold text-gray-900">
                      Tanggal & Waktu
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTanggal(event.tanggalPelaksanaan)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatWaktu(event.waktuMulai, event.waktuSelesai)}
                    </p>
                    <p className="mt-3 mb-1 text-xs font-semibold text-gray-900">
                      Lokasi
                    </p>
                    <p className="line-clamp-1 text-xs text-gray-500">
                      {event.lokasi || "Lokasi menyusul"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-auto flex justify-center border-t border-gray-100 bg-gray-50 p-4">
                <Link
                  href={`/admin/peserta-event/${event.idEvent}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DaftarEventKerangka() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mb-8 h-4 w-80 animate-pulse rounded bg-gray-100" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-87.5 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    </div>
  );
}
