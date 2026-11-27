import GambarEvent from "@/components/GambarEvent";
import { formatTanggal, formatWaktu } from "@/lib/format-tanggal";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import {
  getEventDetailPublik,
  tanggalHariIniJakarta,
} from "@/features/event/queries/publik";
import { skemaIdEventPublik } from "@/features/event/validasi/publik";
import { LABEL_PERAN_WW } from "@/features/event/types";

export const instant = false;

/**
 * Halaman detail event publik (tanpa login).
 * ID tidak valid atau event tidak aktif → notFound().
 * Tidak ada tombol daftar atau bayar.
 */
export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. Validasi ID dari URL dengan skema Zod (CONTRIBUTING 9.8).
  const resolvedParams = await params;
  const hasilValidasi = skemaIdEventPublik.safeParse({ id: resolvedParams.id });
  if (!hasilValidasi.success) notFound();
  const { id: idEvent } = hasilValidasi.data;

  // 2. Ambil data dari query publik; event draft/hidden → notFound().
  await connection();
  const eventDipilih = await getEventDetailPublik(idEvent);
  if (!eventDipilih) notFound();

  // 3. Hitung hari ini untuk menentukan apakah event sudah lewat.
  const tanggalHariIni = tanggalHariIniJakarta();
  const eventSudahLewat = eventDipilih.tanggalPelaksanaan < tanggalHariIni;

  const eventDateObj = new Date(`${eventDipilih.tanggalPelaksanaan}T00:00:00Z`);
  const bulanShort = new Intl.DateTimeFormat("id-ID", {
    month: "short",
    timeZone: "UTC",
  })
    .format(eventDateObj)
    .toUpperCase();
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
          {/* Penyelenggara dan peran WW (dari kolom 3.1). */}
          {eventDipilih.penyelenggara ? (
            <p className="mt-2 text-lg text-(--hx-ink-2)">
              Diselenggarakan oleh{" "}
              <span className="font-semibold">{eventDipilih.penyelenggara}</span>
              {eventDipilih.peranWw && (
                <span className="ml-2 inline-flex rounded-full bg-(--hx-accent)/10 px-2 py-0.5 text-sm font-semibold text-(--hx-accent-dark)">
                  WW sebagai {LABEL_PERAN_WW[eventDipilih.peranWw]}
                </span>
              )}
            </p>
          ) : (
            <p className="mt-2 text-lg text-(--hx-ink-2)">
              Diselenggarakan oleh Waste &amp; Wishes
            </p>
          )}
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
                <p className="text-sm text-(--hx-ink-2)">
                  {eventDipilih.lokasi || "Lokasi acara menyusul"}
                </p>
              </div>
            </div>

            {/* Tentang Event */}
            <section>
              <h2 className="text-xl font-semibold text-(--hx-ink) mb-4 border-b pb-2">
                Tentang Event
              </h2>
              <p className="text-base text-(--hx-ink-2) leading-relaxed">
                {eventDipilih.deskripsi || "Tidak ada deskripsi acara"}
              </p>
            </section>

            {/* Tautan info eksternal (jika ada) — dibuka di tab baru (CONTRIBUTING issue #171). */}
            {eventDipilih.tautanInfo && (
              <section>
                <h2 className="text-xl font-semibold text-(--hx-ink) mb-4 border-b pb-2">
                  Informasi Lebih Lanjut
                </h2>
                <a
                  href={eventDipilih.tautanInfo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hx-btn-outline inline-flex"
                >
                  Buka halaman resmi event
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </section>
            )}
          </div>

          {/* Kolom Kanan: Status event (tanpa tombol daftar/bayar). */}
          <div className="lg:col-span-1">
            <div className="sticky top-10 rounded-2xl border border-(--hx-pastel) bg-white p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-semibold text-(--hx-ink)">
                Informasi Event
              </h3>
              {eventSudahLewat ? (
                <p className="rounded-xl bg-(--hx-sunk) px-4 py-3 text-center text-sm font-semibold text-(--hx-ink-3)">
                  Event ini telah selesai
                </p>
              ) : (
                <p className="rounded-xl bg-(--hx-accent)/10 px-4 py-3 text-center text-sm font-semibold text-(--hx-accent-dark)">
                  Event akan datang
                </p>
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
