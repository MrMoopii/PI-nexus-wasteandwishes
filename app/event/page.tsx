import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { db, events as eventsTable } from "@/lib/db";

export const instant = false;

export const metadata: Metadata = {
  title: "Daftar Event - Waste & Wishes",
  description: "Daftar kegiatan pelatihan, sosialisasi, dan aksi hijau pengelolaan limbah organik.",
};

// Fallback events if database hasn't been seeded yet
const DEFAULT_EVENTS = [
  {
    id_event: 1,
    nama_event: "Pelatihan Budidaya Maggot BSF",
    deskripsi:
      "Pelajari teknik budidaya Black Soldier Fly (BSF) dari pembibitan hingga panen larva sebagai pakan ternak berkualitas tinggi dan pengolah sampah organik tercepat.",
    gambar: "1.jpg",
    tanggal_pelaksanaan: "25 Oktober 2026",
  },
  {
    id_event: 2,
    nama_event: "Sosialisasi Pemilahan Limbah Dapur",
    deskripsi:
      "Panduan praktis bagi ibu rumah tangga dan pelaku UMKM dalam memilah sampah basah dan kering agar bernilai guna dan tidak mencemari lingkungan.",
    gambar: "2.jpg",
    tanggal_pelaksanaan: "02 November 2026",
  },
  {
    id_event: 3,
    nama_event: "Aksi Hijau Gejayan Bersih",
    deskripsi:
      "Gerakan relawan lingkungan bersama komunitas Nexus membersihkan bantaran sungai dan kawasan Gejayan secara berkala.",
    gambar: "3.jpg",
    tanggal_pelaksanaan: "15 November 2026",
  },
  {
    id_event: 4,
    nama_event: "Workshop Kasgot & Pupuk Organik",
    deskripsi:
      "Mengolah residu kasgot (bekas maggot) menjadi pupuk organik padat dan cair yang kaya nutrisi untuk tanaman dan pertanian urban.",
    gambar: "4.jpg",
    tanggal_pelaksanaan: "28 November 2026",
  },
  {
    id_event: 5,
    nama_event: "Edukasi Sirkular Ekonomi Desa",
    deskripsi:
      "Membuka potensi ekonomi dari pengelolaan limbah berbasis komunitas menuju desa mandiri energi dan pakan berkelanjutan.",
    gambar: "5.jpg",
    tanggal_pelaksanaan: "10 Desember 2026",
  },
];

export default async function EventPage() {
  let events = DEFAULT_EVENTS;

  try {
    const dbEvents = await db.select().from(eventsTable);
    if (dbEvents && dbEvents.length > 0) {
      events = dbEvents.map((e, index) => {
        const fallback =
          DEFAULT_EVENTS.find((d) => d.id_event === e.idEvent) ||
          DEFAULT_EVENTS[index % DEFAULT_EVENTS.length];
        return {
          id_event: e.idEvent,
          nama_event: e.namaEvent,
          deskripsi: fallback.deskripsi,
          gambar: fallback.gambar,
          tanggal_pelaksanaan:
            e.tanggalPelaksanaan || fallback.tanggal_pelaksanaan,
        };
      });
    }
  } catch {
    // Fallback to default events if DB is offline or table is empty
    events = DEFAULT_EVENTS;
  }

  return (
    <div className="container mx-auto px-4 max-w-7xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Daftar Event &amp; Edukasi
        </h1>
        <p className="text-gray-600">
          Ikuti berbagai agenda dan pelatihan pengelolaan limbah organik bersama kami.
        </p>
      </div>

      {/* Grid Event */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
        {events.map((event) => (
          <div
            key={event.id_event}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col p-4 hover:shadow-md transition-shadow"
          >
            <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 bg-gray-100">
              <Image
                src={`/img/event/${event.gambar}`}
                alt={event.nama_event}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 20vw"
                className="object-cover"
              />
            </div>

            <p className="font-bold text-gray-900 text-sm line-clamp-2 mb-1 flex-1">
              {event.nama_event}
            </p>

            <div className="mt-2 flex items-baseline justify-between">
              <strong className="text-[#17afb0] font-bold text-sm">Gratis</strong>
            </div>

            <Link
              href={`/event/detail/${event.id_event}`}
              className="mt-3 block text-center py-2 px-3 text-xs font-semibold text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
            >
              Lihat Detail
            </Link>
          </div>
        ))}
      </div>

      {/* Banner Spesial Bulan Ini */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-xl text-gray-900 mb-1">
            Event Spesial Bulan Ini
          </p>
          <p className="text-gray-500 text-sm">
            Daftarkan diri Anda sekarang sebelum kuota peserta pelatihan maggot BSF penuh!
          </p>
        </div>
        <Link
          href={`/event/detail/${events[0]?.id_event || 1}`}
          className="px-6 py-3 rounded-xl font-bold text-white bg-[#17afb0] hover:bg-[#118586] transition-colors shadow-sm whitespace-nowrap"
        >
          Daftar Sekarang!
        </Link>
      </div>
    </div>
  );
}
