import React from 'react';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export default async function AdminEventPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "aktif";

  const allEvents = await getDb
    .select()
    .from(events)
    .orderBy(desc(events.idEvent));

  const now = new Date();

  // Logika filter event berdasarkan waktu dan status
  const dataEvents = allEvents.filter((event) => {
    if (currentTab === "draft") {
      return event.statusEvent === "draft";
    }

    let isPast = false;
    if (event.tanggalPelaksanaan) {
      const eventDate = new Date(event.tanggalPelaksanaan);
      if (event.waktuSelesai) {
        const [hours, minutes] = event.waktuSelesai.split(':');
        eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      } else {
        eventDate.setHours(23, 59, 59, 999);
      }
      isPast = eventDate < now;
    }

    if (currentTab === "lalu") {
      return event.statusEvent === "lalu" || (event.statusEvent === "aktif" && isPast);
    }

    if (currentTab === "aktif") {
      return event.statusEvent === "aktif" && !isPast;
    }

    return false;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Event Saya</h1>

      {/* Tab Navigasi */}
      <div className="flex border-b border-gray-200 mb-6">
        <Link
          href="?tab=aktif"
          className={`py-4 px-6 text-sm font-medium ${
            currentTab === "aktif"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          EVENT AKTIF
        </Link>
        <Link
          href="?tab=draft"
          className={`py-4 px-6 text-sm font-medium ${
            currentTab === "draft"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          EVENT DRAFT
        </Link>
        <Link
          href="?tab=lalu"
          className={`py-4 px-6 text-sm font-medium ${
            currentTab === "lalu"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          EVENT LALU
        </Link>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Tombol Buat Event Baru */}
        <Link
          href="/admin/events/tambah"
          className="flex flex-col items-center justify-center min-h-[350px] bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors cursor-pointer group"
        >
          <span className="text-5xl text-orange-500 font-light mb-4 group-hover:scale-110 transition-transform">
            +
          </span>
          <span className="text-orange-500 font-semibold text-sm">
            Buat Event Baru
          </span>
        </Link>

        {/* Pesan Kosong */}
        {dataEvents.length === 0 && (
          <div className="col-span-1 md:col-span-1 lg:col-span-3 flex items-center justify-center min-h-[350px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-500 font-medium text-center">
              Saat ini belum ada event pada Event {currentTab.charAt(0).toUpperCase() + currentTab.slice(1)}, silakan buat event baru!
            </p>
          </div>
        )}

        {/* Render Kartu Event */}
        {dataEvents.map((event) => {
          const displayStatus = currentTab === "lalu" ? "lalu" : event.statusEvent;

          return (
            <div
              key={event.idEvent}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Area Gambar */}
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  {event.gambarUrl ? (
                    <img
                      src={event.gambarUrl}
                      alt={event.namaEvent}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400 text-xs">
                      Tidak ada gambar
                    </div>
                  )}
                </div>

                {/* Detail Konten */}
                <div className="p-5 flex flex-col">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight line-clamp-2">
                    {event.namaEvent}
                  </h3>
                  <p className="text-orange-500 text-xs font-medium mb-4">
                    {event.jenisEvent}
                  </p>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-900 mb-1">
                        Tanggal & Waktu
                      </p>
                      <p className="text-xs text-gray-500">
                        {String(event.tanggalPelaksanaan)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.waktuMulai || "00:00"} - {event.waktuSelesai || "Selesai"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-900 mb-1">
                        Venue & Lokasi
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {event.lokasi || "Belum ditentukan"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Kartu (Di dalam container utama) */}
              <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-between mt-auto">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  displayStatus === 'aktif' ? 'bg-green-100 text-green-700' :
                  displayStatus === 'draft' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-700'
                }`}>
                  {displayStatus === 'lalu' ? 'BERAKHIR' : displayStatus.toUpperCase()}
                </span>

                <Link
                  href={`/admin/events/edit/${event.idEvent}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Edit Event ➔
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
