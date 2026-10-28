import Link from "next/link";
import Image from "next/image";
import { formatTanggal, formatWaktu } from "@/lib/format-tanggal";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { events as eventsTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { connection } from "next/server";
import { isEventActive } from "@/app/event/page";

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

  const plateNo = String(eventDipilih.idEvent).padStart(2, "0");

  return (
    <div className="relative min-h-screen bg-(--hx-canvas) text-(--hx-ink) font-(family-name:--font-inter) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark)">
      {/* Ambient gradient washes matching Helix Drift */}
      <div aria-hidden="true" className="hx-ambient-wash">
        <div className="hx-ambient-blob-1" />
        <div className="hx-ambient-blob-2" />
        <div className="hx-ambient-blob-3" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Breadcrumb / Tag Line */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/event"
            className="inline-flex items-center gap-2 text-xs font-semibold text-(--hx-ink-2) hover:text-(--hx-accent) transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Kembali ke Daftar Agenda</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-(--hx-accent)" />
            <span className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase">
              Plate {plateNo}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column (5 Cols): Static Image Plate & Quick Action */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative aspect-16/11 w-full rounded-2xl overflow-hidden bg-(--hx-sunk) border border-(--hx-pastel)/60 shadow-[0_16px_40px_rgb(27,34,51,0.08)]">
              <Image
                src={`/img/event/${eventDipilih.gambarUrl}`}
                alt={eventDipilih.namaEvent}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
              {/* Inner subtle rim highlight matching template */}
              <div className="hx-rim-highlight" />

              {/* Tag pill on image */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-(--hx-accent) uppercase tracking-wider shadow-sm">
                {eventDipilih.jenisEvent}
              </div>

              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-(--hx-accent) text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                Gratis
              </div>
            </div>

            {/* Registration Action Card */}
            <div className="rounded-2xl border border-(--hx-pastel)/50 bg-white/90 p-6 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-(--hx-ink-3) font-semibold">
                  Biaya Kepesertaan
                </span>
                <span className="text-2xl font-bold text-(--hx-accent) font-(family-name:--font-plus-jakarta-sans)">
                  Rp 0{" "}
                  <span className="text-xs font-normal text-(--hx-ink-2)">
                    (Gratis)
                  </span>
                </span>
              </div>

              <p className="text-xs text-(--hx-ink-2) font-light leading-relaxed mb-5">
                Kegiatan didanai melalui inisiatif keberlanjutan Waste &amp;
                Wishes. Setiap peserta akan mendapatkan sertifikat digital dan
                modul praktik.
              </p>

              <Link
                href={`/event/checkout/${eventDipilih.idEvent}`}
                className="hx-btn-primary w-full"
              >
                <span>Daftar Sekarang (Gratis)</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>

              {/* Key perks */}
              <div className="mt-5 pt-4 border-t border-(--hx-sunk)/60 space-y-2 text-xs text-(--hx-ink-2)">
                <div className="flex items-center gap-2">
                  <span className="text-(--hx-accent)">✓</span>
                  <span>Materi panduan &amp; starter kit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-(--hx-accent)">✓</span>
                  <span>Sertifikat keikutsertaan resmi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-(--hx-accent)">✓</span>
                  <span>Sesi tanya-jawab langsung bersama mentor</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Event Details */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Title & Category */}
            <div>
              <span className="inline-block text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase mb-2">
                {eventDipilih.jenisEvent}
              </span>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) leading-tight">
                {eventDipilih.namaEvent}
              </h1>
            </div>

            {/* Quick Metadata Grid (Helix Drift Facts style) */}
            <div className="grid grid-cols-2 gap-px bg-(--hx-pastel)/40 rounded-xl overflow-hidden border border-(--hx-pastel)/40 shadow-sm">
              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4">
                <span className="block text-[10px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                  Tanggal Pelaksanaan
                </span>
                <p className="text-sm sm:text-base font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                  {formatTanggal(eventDipilih.tanggalPelaksanaan)}
                </p>
              </div>

              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4">
                <span className="block text-[10px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                  Waktu &amp; Sesi
                </span>
                <p className="text-sm sm:text-base font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                  {formatWaktu(
                    eventDipilih.waktuMulai,
                    eventDipilih.waktuSelesai,
                  )}
                </p>
              </div>

              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4">
                <span className="block text-[10px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                  Lokasi Pertemuan
                </span>
                <p className="text-sm sm:text-base font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                  {eventDipilih.lokasi || "Lokasi acara menyusul"}
                </p>
              </div>

              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4">
                <span className="block text-[10px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                  Kuota Peserta
                </span>
                <p className="text-sm sm:text-base font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                  {eventDipilih.kuotaPeserta || "Tidak ada batasan kuota"}
                </p>
              </div>
            </div>

            {/* Description Sheet */}
            <div className="rounded-2xl border border-(--hx-pastel)/50 bg-white/80 p-6 sm:p-7 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-3">
                Deskripsi &amp; Gambaran Acara
              </span>
              <p className="text-sm sm:text-base text-(--hx-ink-2) font-light leading-relaxed">
                {eventDipilih.deskripsi || "Tidak ada deskripsi acara"}
              </p>

              <hr className="my-5 border-(--hx-sunk)/80" />

              <h3 className="text-sm font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-3">
                Agenda Kegiatan
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-(--hx-ink-2)">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-(--hx-accent) font-semibold shrink-0">
                    01.
                  </span>
                  <span>
                    Registrasi ulang peserta dan pembagian modul materi
                    pengantar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-(--hx-accent) font-semibold shrink-0">
                    02.
                  </span>
                  <span>
                    Pemaparan materi inti dan demonstrasi praktik oleh
                    fasilitator.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-(--hx-accent) font-semibold shrink-0">
                    03.
                  </span>
                  <span>
                    Praktik langsung per kelompok serta diskusi studi kasus.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-(--hx-accent) font-semibold shrink-0">
                    04.
                  </span>
                  <span>
                    Sesi tanya-jawab interaktif dan penyerahan starter kit
                    kepada peserta.
                  </span>
                </li>
              </ul>
            </div>

            {/* Important Notes */}
            <div className="rounded-2xl border border-(--hx-pastel)/40 bg-[#E8F4F4]/60 p-5 text-xs text-(--hx-ink-2) leading-relaxed">
              <strong className="text-(--hx-accent) font-semibold block mb-1">
                Catatan Kehadiran
              </strong>
              Peserta diharapkan hadir 15 menit sebelum kegiatan dimulai dan
              membawa alat tulis pribadi serta tumbler minum demi mendukung
              gerakan minim sampah.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
