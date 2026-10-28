import Link from "next/link";
import Image from "next/image";
import { formatTanggal } from "@/lib/format-tanggal";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { events as eventsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { asc } from "drizzle-orm";
import { connection } from "next/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Agenda & Event - Waste & Wishes",
  description:
    "Daftar kegiatan pelatihan, sosialisasi, dan aksi hijau pengelolaan limbah organik.",
};

export default async function EventPage() {
  let events: (typeof eventsTable.$inferSelect)[] = [];
  let gagalMuat = false;

  await connection(); // Ensure the database connection is established

  try {
    events = await getDb()
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.statusEvent, "aktif"))
      .orderBy(asc(eventsTable.tanggalPelaksanaan));
  } catch (error) {
    console.error("Error fetching events from database", error);
    gagalMuat = true;
  }

  const totalEvents = events.length;
  const leadEvent = events[0];

  return (
    <div className="relative min-h-screen bg-(--hx-canvas) text-(--hx-ink) font-(family-name:--font-inter) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark)">
      {/* Ambient gradient washes matching Helix Drift */}
      <div aria-hidden="true" className="hx-ambient-wash">
        <div className="hx-ambient-blob-1" />
        <div className="hx-ambient-blob-2" />
        <div className="hx-ambient-blob-3" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Header Section */}
        <header className="mb-12 md:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block h-2 w-2 rounded-full bg-(--hx-accent)" />
            <span className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-2) uppercase">
              Agenda &amp; Pelatihan Komunitas
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-(--hx-pastel-deep)/30">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) leading-tight">
                Daftar Kegiatan &amp; Aksi Hijau
              </h1>
              <p className="mt-3 max-w-2xl text-base sm:text-lg text-(--hx-ink-2) font-light leading-relaxed">
                Tingkatkan kesadaran ekologis dan keterampilan pengolahan sampah
                organik melalui serangkaian agenda pelatihan praktis, workshop
                maggot BSF, dan gerakan kerelawanan.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs uppercase tracking-widest text-(--hx-ink-3)">
                Total Tersedia
              </span>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/80 border border-(--hx-pastel) text-(--hx-accent) shadow-sm backdrop-blur-sm">
                {String(totalEvents).padStart(2, "0")} Agenda
              </span>
            </div>
          </div>

          {/* Facts / Key Highlights Bar (Helix Drift Style) */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-(--hx-pastel)/40 rounded-xl overflow-hidden border border-(--hx-pastel)/40 shadow-sm">
            <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4 sm:p-5">
              <span className="block text-[11px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                Akses
              </span>
              <p className="text-xl sm:text-2xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                100% Gratis
              </p>
            </div>
            <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4 sm:p-5">
              <span className="block text-[11px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                Fasilitas
              </span>
              <p className="text-xl sm:text-2xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                Sertifikat &amp; Kit
              </p>
            </div>
            <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4 sm:p-5">
              <span className="block text-[11px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                Wilayah
              </span>
              <p className="text-xl sm:text-2xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                Gejayan &amp; Sleman
              </p>
            </div>
            <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4 sm:p-5">
              <span className="block text-[11px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                Peserta
              </span>
              <p className="text-xl sm:text-2xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
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
          {gagalMuat ? (
            <p className="…">Gagal memuat event, coba lagi nanti.</p>
          ) : events.length === 0 ? (
            <p className="…">Belum ada event yang tersedia.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, idx) => {
                const plateNo = String(idx + 1).padStart(2, "0");
                const totalNo = String(totalEvents).padStart(2, "0");

                return (
                  <article key={event.idEvent} className="hx-card group">
                    {/* Plate Header Info */}
                    <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-(--hx-sunk)/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-(--hx-accent) font-(family-name:--font-plus-jakarta-sans)">
                          {plateNo}
                        </span>
                        <span className="h-3 w-px bg-(--hx-pastel)" />
                        <span className="text-(--hx-ink-3) font-mono tracking-wider">
                          {totalNo}
                        </span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#E8F4F4] text-(--hx-accent)">
                        {event.jenisEvent || "Workshop"}
                      </span>
                    </div>

                    {/* Static Image Plate */}
                    <div className="relative aspect-16/10 w-full overflow-hidden bg-(--hx-sunk)">
                      <Image
                        src={`/img/event/${event.gambarUrl}`}
                        alt={event.namaEvent}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      {/* Inner subtle rim highlight matching template */}
                      <div className="hx-rim-highlight" />

                      {/* Badge Date */}
                      <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-white/90 backdrop-blur-md text-[11px] font-medium text-(--hx-ink) shadow-sm">
                        📅 {formatTanggal(event.tanggalPelaksanaan)}
                      </div>

                      {/* Free Badge */}
                      <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-(--hx-accent) text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                        Gratis
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) group-hover:text-(--hx-accent) transition-colors leading-snug line-clamp-2">
                        {event.namaEvent}
                      </h3>

                      {/* <p className="mt-2.5 text-sm text-[var(--hx-ink-2)] font-light leading-relaxed line-clamp-3 flex-1">
                        {event.deskripsi}
                      </p> */}

                      <div className="mt-4 pt-4 border-t border-(--hx-sunk)/60 flex items-center justify-between text-xs text-(--hx-ink-3)">
                        <span className="flex items-center gap-1.5 truncate">
                          <svg
                            className="h-3.5 w-3.5 shrink-0 text-(--hx-accent)"
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
                          <span className="truncate">
                            {event.lokasi || "Lokasi menyusul"}
                          </span>
                        </span>

                        <span className="font-semibold text-(--hx-accent) shrink-0">
                          Slot Terbatas
                        </span>
                      </div>

                      {/* Action Button */}
                      <div className="mt-5">
                        <Link
                          href={`/event/detail/${event.idEvent}`}
                          className="hx-btn-outline w-full"
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
          )}
        </section>

        {leadEvent && (
          <section className="relative overflow-hidden rounded-3xl border border-(--hx-pastel)/60 bg-linear-to-br from-white/95 via-(--hx-canvas)/90 to-(--hx-sunk)/60 p-8 sm:p-10 shadow-[0_12px_40px_rgb(27,34,51,0.06)] backdrop-blur-md">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-(--hx-accent) text-white">
                    Pilihan Utama
                  </span>
                  <span className="text-xs text-(--hx-ink-3) font-mono">
                    Bulan Ini
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) leading-snug">
                  {leadEvent.namaEvent}
                </h2>

                <p className="mt-3 text-sm sm:text-base text-(--hx-ink-2) font-light leading-relaxed">
                  {leadEvent.deskripsi}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-(--hx-ink-2)">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-(--hx-accent)" />
                    Tanggal:{" "}
                    <strong className="text-(--hx-ink)">
                      {leadEvent.tanggalPelaksanaan}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-(--hx-accent)" />
                    Biaya:{" "}
                    <strong className="text-(--hx-accent)">
                      Gratis (Subsidi Program)
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  href={`/event/detail/${leadEvent.idEvent}`}
                  className="hx-btn-primary whitespace-nowrap text-center"
                >
                  Daftar Pelatihan Sekarang
                </Link>
                <Link
                  href="/langganan"
                  className="hx-btn-outline whitespace-nowrap text-center"
                >
                  Pelajari Layanan Kami
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Information & Contact Lines (Helix Drift Style) */}
        <section className="mt-16 pt-10 border-t border-(--hx-pastel)/40 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-(--hx-ink-2)">
          <div>
            <span className="block text-[11px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-2">
              Pusat Edukasi &amp; Penjemputan
            </span>
            <p className="leading-relaxed">
              Dusun Wedomartani &amp; seputaran Gejayan, Sleman, Daerah Istimewa
              Yogyakarta.
            </p>
          </div>

          <div>
            <span className="block text-[11px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-2">
              Jadwal Operasional
            </span>
            <p className="leading-relaxed">
              Senin – Sabtu, 08.00 – 17.00 WIB. Pelatihan lapangan diadakan
              sesuai jadwal publikasi.
            </p>
          </div>

          <div>
            <span className="block text-[11px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-2">
              Pertanyaan &amp; Kerjasama
            </span>
            <p className="leading-relaxed">
              Email:{" "}
              <a
                href="mailto:hello@wasteandwishes.id"
                className="text-(--hx-accent) hover:underline"
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
