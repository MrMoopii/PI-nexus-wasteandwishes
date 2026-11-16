import Link from "next/link";
import { formatWaktu } from "@/lib/format-tanggal";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { events as eventsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { asc } from "drizzle-orm";
import { connection } from "next/server";
import EventCalendarWrapper from "@/components/event/EventCalendarWrapper";
import EventHeroBanner, {
  type HeroBannerEvent,
} from "@/components/event/EventHeroBanner";
import type { EventTimelineItem } from "@/components/event/EventTimelineClient";

export const instant = false;

export const metadata: Metadata = {
  title: "Agenda & Event - Waste & Wishes",
  description:
    "Daftar kegiatan pelatihan, sosialisasi, dan aksi hijau pengelolaan limbah organik.",
};

function getTanggalHariIni(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatTanggalTimeline(tanggal: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${tanggal}T00:00:00Z`));
}

export default async function EventPage({
  searchParams,
}: {
  searchParams?: Promise<{
    jenis?: string;
    tab?: string;
  }>;
}) {
  let events: (typeof eventsTable.$inferSelect)[] = [];
  let gagalMuat = false;

  await connection();

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

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedJenis =
    typeof resolvedSearchParams.jenis === "string"
      ? resolvedSearchParams.jenis
      : "";
  const today = getTanggalHariIni();
  const totalEvents = events.filter(
    (event) => event.tanggalPelaksanaan >= today,
  ).length;
  const jenisEventOptions = Array.from(
    new Set(events.map((event) => event.jenisEvent).filter(Boolean)),
  );
  const filteredEvents = selectedJenis
    ? events.filter((event) => event.jenisEvent === selectedJenis)
    : events;
  const tabEvents = filteredEvents.filter(
    (event) => event.tanggalPelaksanaan >= today,
  );
  const groupedDates = Array.from(
    new Set(tabEvents.map((event) => event.tanggalPelaksanaan)),
  );
  const timelineGroups = groupedDates.map((tanggal) => ({
    tanggal,
    label: formatTanggalTimeline(tanggal),
    events: tabEvents
      .filter((event) => event.tanggalPelaksanaan === tanggal)
      .map(
        (event): EventTimelineItem => ({
          idEvent: event.idEvent,
          namaEvent: event.namaEvent,
          jenisEvent: event.jenisEvent,
          deskripsi: event.deskripsi,
          tanggalPelaksanaan: event.tanggalPelaksanaan,
          waktuMulai: event.waktuMulai,
          waktuSelesai: event.waktuSelesai,
          gambarUrl: event.gambarUrl,
          waktuLabel: formatWaktu(event.waktuMulai, event.waktuSelesai),
        }),
      ),
  }));

  const allEventDates = events.map((event) => event.tanggalPelaksanaan);

  const heroBannerEvents: HeroBannerEvent[] = events
    .filter((event) => event.gambarUrl)
    .map((event) => ({
      idEvent: event.idEvent,
      namaEvent: event.namaEvent,
      jenisEvent: event.jenisEvent,
      deskripsi: event.deskripsi,
      gambarUrl: event.gambarUrl,
    }));

  // Jika tidak ada event bergambar, tetap tampilkan satu event pertama tanpa gambar
  const bannerEvents: HeroBannerEvent[] =
    heroBannerEvents.length > 0
      ? heroBannerEvents
      : events.slice(0, 1).map((event) => ({
          idEvent: event.idEvent,
          namaEvent: event.namaEvent,
          jenisEvent: event.jenisEvent,
          deskripsi: event.deskripsi,
          gambarUrl: null,
        }));

  return (
    <div className="relative min-h-screen bg-(--hx-canvas) text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark)">
      {/* Ambient gradient washes matching Helix Drift */}
      <div aria-hidden="true" className="hx-ambient-wash">
        <div className="hx-ambient-blob-1" />
        <div className="hx-ambient-blob-2" />
        <div className="hx-ambient-blob-3" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Hero Banner dengan rotasi otomatis */}
        <EventHeroBanner events={bannerEvents} />

        <section aria-labelledby="events-heading" className="mb-10">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2
                id="events-heading"
                className="text-2xl font-semibold tracking-tight text-(--hx-ink)"
              >
                Events
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/event"
                  scroll={false}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    !selectedJenis
                      ? "border-(--hx-ink) bg-(--hx-ink) text-white"
                      : "border-(--hx-pastel) bg-white text-(--hx-ink-2) hover:border-(--hx-accent) hover:text-(--hx-accent)"
                  }`}
                >
                  Semua <span className="ml-1 opacity-70">{totalEvents}</span>
                </Link>
                {jenisEventOptions.map((jenisEvent) => (
                  <Link
                    key={jenisEvent}
                    href={`/event?jenis=${encodeURIComponent(jenisEvent)}`}
                    scroll={false}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      selectedJenis === jenisEvent
                        ? "border-(--hx-ink) bg-(--hx-ink) text-white"
                        : "border-(--hx-pastel) bg-white text-(--hx-ink-2) hover:border-(--hx-accent) hover:text-(--hx-accent)"
                    }`}
                  >
                    {jenisEvent}{" "}
                    <span className="ml-1 opacity-70">
                      {
                        events.filter(
                          (event) => event.jenisEvent === jenisEvent,
                        ).length
                      }
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {gagalMuat ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Gagal memuat event, coba lagi nanti.
            </p>
          ) : tabEvents.length === 0 ? (
            <p className="rounded-2xl border border-(--hx-pastel) bg-white p-4 text-sm text-(--hx-ink-2)">
              Belum ada event mendatang.
            </p>
          ) : (
            <EventCalendarWrapper
              eventDates={allEventDates}
              today={today}
              timelineGroups={timelineGroups}
            />
          )}
        </section>

        {/* Information & Contact Lines (Helix Drift Style) */}
        <section className="mt-12 pt-8 border-t border-(--hx-pastel)/40 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-(--hx-ink-2)">
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
