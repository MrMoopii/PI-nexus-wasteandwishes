import Link from "next/link";
import GambarEvent from "@/components/GambarEvent";
import { formatTanggal, formatWaktu } from "@/lib/format-tanggal";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { events as eventsTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { connection } from "next/server";

export const instant = false;

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const idEvent = Number(resolvedParams.id);

  if (!Number.isInteger(idEvent) || idEvent <= 0) {
    notFound();
  }

  await connection();

  const [eventDipilih] = await getDb()
    .select()
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.idEvent, idEvent),
        eq(eventsTable.statusEvent, "aktif"),
      ),
    )
    .limit(1);

  if (!eventDipilih) {
    notFound();
  }

  const tanggalHariIni = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const eventSudahLewat = eventDipilih.tanggalPelaksanaan < tanggalHariIni;

  const eventDateObj = new Date(`${eventDipilih.tanggalPelaksanaan}T00:00:00Z`);
  const bulanShort = new Intl.DateTimeFormat("id-ID", {
    month: "short",
    timeZone: "UTC",
  }).format(eventDateObj).toUpperCase();
  const tanggalAngka = eventDateObj.getUTCDate();

  return (
    <div className="relative min-h-screen bg-white text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
      {/* Banner Utama */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-(--hx-sunk)">
        <GambarEvent
          src={eventDipilih.gambarUrl}
          alt={eventDipilih.namaEvent}
          sizes="100vw"
          className="object-cover"
          preload
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Header Info */}
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-(--hx-accent)">
            {eventDipilih.jenisEvent}
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-(--hx-ink)">
            {eventDipilih.namaEvent}
          </h1>
          <p className="mt-2 text-lg text-(--hx-ink-2)">
            Diselenggarakan oleh Waste &amp; Wishes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Kolom Kiri: Deskripsi & Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informasi Utama */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-(--hx-sunk) px-3 py-2 text-center">
                  <span className="block text-xs font-bold uppercase text-(--hx-ink-3)">
                    {bulanShort}
                  </span>
                  <span className="block text-xl font-bold text-(--hx-ink)">
                    {tanggalAngka}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-(--hx-ink)">
                    {formatTanggal(eventDipilih.tanggalPelaksanaan)}
                  </p>
                  <p className="text-sm text-(--hx-ink-2)">
                    {formatWaktu(eventDipilih.waktuMulai, eventDipilih.waktuSelesai)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-(--hx-sunk)">
                  <svg className="h-5 w-5 text-(--hx-ink-2)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-(--hx-ink-2)">{eventDipilih.lokasi || "Lokasi acara menyusul"}</p>
              </div>
            </div>

            {/* Tentang Event */}
            <section>
              <h2 className="text-xl font-semibold text-(--hx-ink) mb-4 border-b pb-2">Tentang Event</h2>
              <p className="text-base text-(--hx-ink-2) leading-relaxed">
                {eventDipilih.deskripsi || "Tidak ada deskripsi acara"}
              </p>
            </section>
          </div>

          {/* Kolom Kanan: Pendaftaran (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-10 rounded-2xl border border-(--hx-pastel) bg-white p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-semibold text-(--hx-ink)">Pendaftaran</h3>
              <p className="text-sm text-(--hx-ink-2)">Selamat datang! Silakan daftar untuk mengikuti kegiatan ini.</p>

              {eventSudahLewat ? (
                <p className="rounded-xl bg-(--hx-sunk) px-4 py-3 text-center text-sm font-semibold text-(--hx-ink-3)">
                  Pendaftaran event telah ditutup
                </p>
              ) : (
                <Link
                  href={`/event/checkout/${eventDipilih.idEvent}`}
                  className="hx-btn-primary w-full justify-center text-center"
                >
                  Daftar
                </Link>
              )}

              <Link
                href="/event"
                className="hx-btn-outline w-full justify-center text-center"
              >
                Kembali ke Daftar Agenda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
