import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { db, events as eventsTable } from "@/lib/db";

export const instant = false;

export const metadata: Metadata = {
  title: "Agenda & Event - Waste & Wishes",
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
    lokasi: "Wedomartani, Sleman",
    kategori: "Workshop Budidaya",
  },
  {
    id_event: 2,
    nama_event: "Sosialisasi Pemilahan Limbah Dapur",
    deskripsi:
      "Panduan praktis bagi ibu rumah tangga dan pelaku UMKM dalam memilah sampah basah dan kering agar bernilai guna dan tidak mencemari lingkungan.",
    gambar: "2.jpg",
    tanggal_pelaksanaan: "02 November 2026",
    lokasi: "Gejayan, Yogyakarta",
    kategori: "Edukasi Warga",
  },
  {
    id_event: 3,
    nama_event: "Aksi Hijau Gejayan Bersih",
    deskripsi:
      "Gerakan relawan lingkungan bersama komunitas Nexus membersihkan bantaran sungai dan kawasan Gejayan secara berkala.",
    gambar: "3.jpg",
    tanggal_pelaksanaan: "15 November 2026",
    lokasi: "Kawasan Gejayan",
    kategori: "Aksi Relawan",
  },
  {
    id_event: 4,
    nama_event: "Workshop Kasgot & Pupuk Organik",
    deskripsi:
      "Mengolah residu kasgot (bekas maggot) menjadi pupuk organik padat dan cair yang kaya nutrisi untuk tanaman dan pertanian urban.",
    gambar: "4.jpg",
    tanggal_pelaksanaan: "28 November 2026",
    lokasi: "Kranggan, Sleman",
    kategori: "Pertanian Urban",
  },
  {
    id_event: 5,
    nama_event: "Edukasi Sirkular Ekonomi Desa",
    deskripsi:
      "Membuka potensi ekonomi dari pengelolaan limbah berbasis komunitas menuju desa mandiri energi dan pakan berkelanjutan.",
    gambar: "5.jpg",
    tanggal_pelaksanaan: "10 Desember 2026",
    lokasi: "Sleman, D.I. Yogyakarta",
    kategori: "Seminar Komunitas",
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
          lokasi: fallback.lokasi,
          kategori: fallback.kategori,
        };
      });
    }
  } catch {
    events = DEFAULT_EVENTS;
  }

  const totalEvents = events.length;
  const leadEvent = events[0] || DEFAULT_EVENTS[0];

  return (
    <div className="relative min-h-screen bg-[#F4F7FA] text-[#1B2233] font-[family-name:var(--font-inter)] selection:bg-[#17afb0]/20 selection:text-[#118586]">
      {/* Ambient gradient washes matching Helix Drift */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#B9CDE5]/40 blur-3xl" />
        <div className="absolute top-[35%] -right-32 h-[550px] w-[550px] rounded-full bg-[#DDE7F2]/70 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-[450px] w-[450px] rounded-full bg-[#B9CDE5]/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Header Section */}
        <header className="mb-12 md:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block h-2 w-2 rounded-full bg-[#17afb0]" />
            <span className="text-[11px] font-semibold tracking-[0.2em] text-[#5B6879] uppercase">
              Agenda &amp; Pelatihan Komunitas
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#96B1D0]/30">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#1B2233] font-[family-name:var(--font-plus-jakarta-sans)] leading-tight">
                Daftar Kegiatan &amp; Aksi Hijau
              </h1>
              <p className="mt-3 max-w-2xl text-base sm:text-lg text-[#5B6879] font-light leading-relaxed">
                Tingkatkan kesadaran ekologis dan keterampilan pengolahan sampah organik
                melalui serangkaian agenda pelatihan praktis, workshop maggot BSF, dan gerakan kerelawanan.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs uppercase tracking-widest text-[#93A0B2]">
                Total Tersedia
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/80 border border-[#B9CDE5] text-[#17afb0] shadow-sm backdrop-blur-sm">
                {String(totalEvents).padStart(2, "0")} Agenda
              </span>
            </div>
          </div>

          {/* Facts / Key Highlights Bar (Helix Drift Style) */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-[#B9CDE5]/40 rounded-xl overflow-hidden border border-[#B9CDE5]/40 shadow-sm">
            <div className="bg-[#F4F7FA]/90 backdrop-blur-sm p-4 sm:p-5">
              <span className="block text-[11px] font-semibold tracking-wider text-[#93A0B2] uppercase mb-1">
                Akses
              </span>
              <p className="text-xl sm:text-2xl font-semibold text-[#1B2233] font-[family-name:var(--font-plus-jakarta-sans)]">
                100% Gratis
              </p>
            </div>
            <div className="bg-[#F4F7FA]/90 backdrop-blur-sm p-4 sm:p-5">
              <span className="block text-[11px] font-semibold tracking-wider text-[#93A0B2] uppercase mb-1">
                Fasilitas
              </span>
              <p className="text-xl sm:text-2xl font-semibold text-[#1B2233] font-[family-name:var(--font-plus-jakarta-sans)]">
                Sertifikat &amp; Kit
              </p>
            </div>
            <div className="bg-[#F4F7FA]/90 backdrop-blur-sm p-4 sm:p-5">
              <span className="block text-[11px] font-semibold tracking-wider text-[#93A0B2] uppercase mb-1">
                Wilayah
              </span>
              <p className="text-xl sm:text-2xl font-semibold text-[#1B2233] font-[family-name:var(--font-plus-jakarta-sans)]">
                Gejayan &amp; Sleman
              </p>
            </div>
            <div className="bg-[#F4F7FA]/90 backdrop-blur-sm p-4 sm:p-5">
              <span className="block text-[11px] font-semibold tracking-wider text-[#93A0B2] uppercase mb-1">
                Peserta
              </span>
              <p className="text-xl sm:text-2xl font-semibold text-[#1B2233] font-[family-name:var(--font-plus-jakarta-sans)]">
                Terbuka Umum
              </p>
            </div>
          </div>
        </header>

        {/* Static Event Grid (Plates presentation without rotating carousel) */}
        <section aria-labelledby="events-heading" className="mb-16">
          <h2 id="events-heading" className="sr-only">
            Daftar Acara
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, idx) => {
              const plateNo = String(idx + 1).padStart(2, "0");
              const totalNo = String(totalEvents).padStart(2, "0");

              return (
                <article
                  key={event.id_event}
                  className="group relative flex flex-col rounded-2xl bg-white/80 border border-[#B9CDE5]/50 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(27,34,51,0.08)] hover:border-[#17afb0]/40"
                >
                  {/* Plate Header Info */}
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#DDE7F2]/60 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#17afb0] font-[family-name:var(--font-plus-jakarta-sans)]">
                        {plateNo}
                      </span>
                      <span className="h-3 w-px bg-[#B9CDE5]" />
                      <span className="text-[#93A0B2] font-mono tracking-wider">
                        {totalNo}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#E8F4F4] text-[#17afb0]">
                      {event.kategori || "Workshop"}
                    </span>
                  </div>

                  {/* Static Image Plate */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#DDE7F2]">
                    <Image
                      src={`/img/event/${event.gambar}`}
                      alt={event.nama_event}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    {/* Inner subtle rim highlight matching template */}
                    <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]" />

                    {/* Badge Date */}
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-white/90 backdrop-blur-md text-[11px] font-medium text-[#1B2233] shadow-sm">
                      📅 {event.tanggal_pelaksanaan}
                    </div>

                    {/* Free Badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[#17afb0] text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                      Gratis
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold text-[#1B2233] font-[family-name:var(--font-plus-jakarta-sans)] group-hover:text-[#17afb0] transition-colors leading-snug line-clamp-2">
                      {event.nama_event}
                    </h3>

                    <p className="mt-2.5 text-sm text-[#5B6879] font-light leading-relaxed line-clamp-3 flex-1">
                      {event.deskripsi}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[#DDE7F2]/60 flex items-center justify-between text-xs text-[#93A0B2]">
                      <span className="flex items-center gap-1.5 truncate">
                        <svg
                          className="h-3.5 w-3.5 shrink-0 text-[#17afb0]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="truncate">{event.lokasi || "Wedomartani & Gejayan"}</span>
                      </span>

                      <span className="font-semibold text-[#17afb0] shrink-0">
                        Slot Terbatas
                      </span>
                    </div>

                    {/* Action Button */}
                    <div className="mt-5">
                      <Link
                        href={`/event/detail/${event.id_event}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#B9CDE5] bg-white px-4 py-2.5 text-xs font-semibold text-[#1B2233] transition-all duration-200 hover:border-[#17afb0] hover:bg-[#17afb0] hover:text-white shadow-sm"
                      >
                        <span>Lihat Detail Agenda</span>
                        <svg
                          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Featured Special Banner (Helix Drift Sheet Style) */}
        <section className="relative overflow-hidden rounded-3xl border border-[#B9CDE5]/60 bg-gradient-to-br from-white/95 via-[#F4F7FA]/90 to-[#DDE7F2]/60 p-8 sm:p-10 shadow-[0_12px_40px_rgb(27,34,51,0.06)] backdrop-blur-md">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#17afb0] text-white">
                  Pilihan Utama
                </span>
                <span className="text-xs text-[#93A0B2] font-mono">
                  Bulan Ini
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-semibold text-[#1B2233] font-[family-name:var(--font-plus-jakarta-sans)] leading-snug">
                {leadEvent.nama_event}
              </h2>

              <p className="mt-3 text-sm sm:text-base text-[#5B6879] font-light leading-relaxed">
                {leadEvent.deskripsi}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#5B6879]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#17afb0]" />
                  Tanggal: <strong className="text-[#1B2233]">{leadEvent.tanggal_pelaksanaan}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#17afb0]" />
                  Biaya: <strong className="text-[#17afb0]">Gratis (Subsidi Program)</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                href={`/event/detail/${leadEvent.id_event}`}
                className="inline-flex items-center justify-center rounded-xl bg-[#17afb0] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#17afb0]/25 transition-all duration-200 hover:bg-[#118586] hover:shadow-lg whitespace-nowrap text-center"
              >
                Daftar Pelatihan Sekarang
              </Link>
              <Link
                href="/langganan"
                className="inline-flex items-center justify-center rounded-xl border border-[#B9CDE5] bg-white/80 px-6 py-3.5 text-sm font-semibold text-[#5B6879] transition-all duration-200 hover:bg-white hover:text-[#1B2233] whitespace-nowrap text-center"
              >
                Pelajari Layanan Kami
              </Link>
            </div>
          </div>
        </section>

        {/* Information & Contact Lines (Helix Drift Style) */}
        <section className="mt-16 pt-10 border-t border-[#B9CDE5]/40 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-[#5B6879]">
          <div>
            <span className="block text-[11px] font-semibold tracking-wider text-[#93A0B2] uppercase mb-2">
              Pusat Edukasi &amp; Penjemputan
            </span>
            <p className="leading-relaxed">
              Dusun Wedomartani &amp; seputaran Gejayan, Sleman, Daerah Istimewa Yogyakarta.
            </p>
          </div>

          <div>
            <span className="block text-[11px] font-semibold tracking-wider text-[#93A0B2] uppercase mb-2">
              Jadwal Operasional
            </span>
            <p className="leading-relaxed">
              Senin – Sabtu, 08.00 – 17.00 WIB. Pelatihan lapangan diadakan sesuai jadwal publikasi.
            </p>
          </div>

          <div>
            <span className="block text-[11px] font-semibold tracking-wider text-[#93A0B2] uppercase mb-2">
              Pertanyaan &amp; Kerjasama
            </span>
            <p className="leading-relaxed">
              Email:{" "}
              <a
                href="mailto:hello@wasteandwishes.id"
                className="text-[#17afb0] hover:underline"
              >
                hello@wasteandwishes.id
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
