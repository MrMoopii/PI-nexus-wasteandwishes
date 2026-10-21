import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db, events as eventsTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export const instant = false;


// Fallback lookup
const DEFAULT_EVENTS: Record<
  number,
  {
    id_event: number;
    nama_event: string;
    deskripsi: string;
    gambar: string;
    tanggal_pelaksanaan: string;
  }
> = {
  1: {
    id_event: 1,
    nama_event: "Pelatihan Budidaya Maggot BSF",
    deskripsi:
      "Pelajari teknik budidaya Black Soldier Fly (BSF) dari pembibitan hingga panen larva sebagai pakan ternak berkualitas tinggi dan pengolah sampah organik tercepat.",
    gambar: "1.jpg",
    tanggal_pelaksanaan: "25 Oktober 2026",
  },
  2: {
    id_event: 2,
    nama_event: "Sosialisasi Pemilahan Limbah Dapur",
    deskripsi:
      "Panduan praktis bagi ibu rumah tangga dan pelaku UMKM dalam memilah sampah basah dan kering agar bernilai guna dan tidak mencemari lingkungan.",
    gambar: "2.jpg",
    tanggal_pelaksanaan: "02 November 2026",
  },
  3: {
    id_event: 3,
    nama_event: "Aksi Hijau Gejayan Bersih",
    deskripsi:
      "Gerakan relawan lingkungan bersama komunitas Nexus membersihkan bantaran sungai dan kawasan Gejayan secara berkala.",
    gambar: "3.jpg",
    tanggal_pelaksanaan: "15 November 2026",
  },
  4: {
    id_event: 4,
    nama_event: "Workshop Kasgot & Pupuk Organik",
    deskripsi:
      "Mengolah residu kasgot (bekas maggot) menjadi pupuk organik padat dan cair yang kaya nutrisi untuk tanaman dan pertanian urban.",
    gambar: "4.jpg",
    tanggal_pelaksanaan: "28 November 2026",
  },
  5: {
    id_event: 5,
    nama_event: "Edukasi Sirkular Ekonomi Desa",
    deskripsi:
      "Membuka potensi ekonomi dari pengelolaan limbah berbasis komunitas menuju desa mandiri energi dan pakan berkelanjutan.",
    gambar: "5.jpg",
    tanggal_pelaksanaan: "10 Desember 2026",
  },
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  let event = DEFAULT_EVENTS[eventId] || DEFAULT_EVENTS[1];

  try {
    const [dbEvent] = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.idEvent, eventId))
      .limit(1);

    if (dbEvent) {
      const fallback = DEFAULT_EVENTS[eventId] || DEFAULT_EVENTS[1];
      event = {
        id_event: dbEvent.idEvent,
        nama_event: dbEvent.namaEvent,
        deskripsi: fallback.deskripsi,
        gambar: fallback.gambar,
        tanggal_pelaksanaan:
          dbEvent.tanggalPelaksanaan || fallback.tanggal_pelaksanaan,
      };
    }
  } catch {
    // Keep fallback
  }

  if (!event) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left Column: Gambar & CTA */}
        <div>
          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-sm bg-gray-100">
            <Image
              src={`/img/event/${event.gambar}`}
              alt={event.nama_event}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <Link
            href={`/event/checkout/${event.id_event}`}
            className="mt-6 block w-full py-4 text-center rounded-xl text-lg font-bold text-white bg-[#17afb0] hover:bg-[#118586] transition-colors shadow-md"
          >
            Daftar Sekarang (Gratis)
          </Link>
        </div>

        {/* Right Column: Detail info */}
        <div className="space-y-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            {event.nama_event}
          </h1>

          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Deskripsi</h4>
            <div className="bg-[#E6F7F7] p-6 rounded-2xl text-gray-700 leading-relaxed text-base shadow-xs min-h-[140px]">
              {event.deskripsi}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Tanggal Pelaksanaan
            </h4>
            <div className="p-4 bg-white rounded-2xl border border-gray-200 text-2xl font-bold text-gray-800 flex items-center gap-3">
              <span></span>
              <span>{event.tanggal_pelaksanaan}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Link
          href="/event"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-xs"
        >
          ⬅ Kembali ke Daftar Event
        </Link>
      </div>
    </div>
  );
}
