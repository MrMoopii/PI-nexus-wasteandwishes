import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { events as eventsTable } from "@/lib/db/schema";
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
    lokasi?: string;
    kategori?: string;
    waktu?: string;
    kuota?: string;
  }
> = {
  1: {
    id_event: 1,
    nama_event: "Pelatihan Budidaya Maggot BSF",
    deskripsi:
      "Pelajari teknik budidaya Black Soldier Fly (BSF) dari pembibitan hingga panen larva sebagai pakan ternak berkualitas tinggi dan pengolah sampah organik tercepat.",
    gambar: "1.jpg",
    tanggal_pelaksanaan: "25 Oktober 2026",
    lokasi: "Wedomartani, Sleman, D.I. Yogyakarta",
    kategori: "Workshop Budidaya",
    waktu: "09.00 - 14.30 WIB",
    kuota: "30 Peserta",
  },
  2: {
    id_event: 2,
    nama_event: "Sosialisasi Pemilahan Limbah Dapur",
    deskripsi:
      "Panduan praktis bagi ibu rumah tangga dan pelaku UMKM dalam memilah sampah basah dan kering agar bernilai guna dan tidak mencemari lingkungan.",
    gambar: "2.jpg",
    tanggal_pelaksanaan: "02 November 2026",
    lokasi: "Balai RW Gejayan, Yogyakarta",
    kategori: "Edukasi Warga",
    waktu: "08.30 - 11.30 WIB",
    kuota: "50 Peserta",
  },
  3: {
    id_event: 3,
    nama_event: "Aksi Hijau Gejayan Bersih",
    deskripsi:
      "Gerakan relawan lingkungan bersama komunitas Nexus membersihkan bantaran sungai dan kawasan Gejayan secara berkala.",
    gambar: "3.jpg",
    tanggal_pelaksanaan: "15 November 2026",
    lokasi: "Kawasan Gejayan & Bantaran Sungai",
    kategori: "Aksi Relawan",
    waktu: "06.30 - 10.00 WIB",
    kuota: "100 Relawan",
  },
  4: {
    id_event: 4,
    nama_event: "Workshop Kasgot & Pupuk Organik",
    deskripsi:
      "Mengolah residu kasgot (bekas maggot) menjadi pupuk organik padat dan cair yang kaya nutrisi untuk tanaman dan pertanian urban.",
    gambar: "4.jpg",
    tanggal_pelaksanaan: "28 November 2026",
    lokasi: "Kranggan, Sleman, D.I. Yogyakarta",
    kategori: "Pertanian Urban",
    waktu: "09.00 - 13.00 WIB",
    kuota: "25 Peserta",
  },
  5: {
    id_event: 5,
    nama_event: "Edukasi Sirkular Ekonomi Desa",
    deskripsi:
      "Membuka potensi ekonomi dari pengelolaan limbah berbasis komunitas menuju desa mandiri energi dan pakan berkelanjutan.",
    gambar: "5.jpg",
    tanggal_pelaksanaan: "10 Desember 2026",
    lokasi: "Aula Balai Desa, Sleman",
    kategori: "Seminar Komunitas",
    waktu: "09.30 - 12.30 WIB",
    kuota: "60 Peserta",
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
    const [dbEvent] = await getDb()
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
        lokasi: fallback.lokasi,
        kategori: fallback.kategori,
        waktu: fallback.waktu,
        kuota: fallback.kuota,
      };
    }
  } catch {
    // Keep fallback
  }

  if (!event) {
    notFound();
  }

  const plateNo = String(event.id_event).padStart(2, "0");

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
              Plate {plateNo} / 05
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column (5 Cols): Static Image Plate & Quick Action */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative aspect-16/11 w-full rounded-2xl overflow-hidden bg-(--hx-sunk) border border-(--hx-pastel)/60 shadow-[0_16px_40px_rgb(27,34,51,0.08)]">
              <Image
                src={`/img/event/${event.gambar}`}
                alt={event.nama_event}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
              {/* Inner subtle rim highlight matching template */}
              <div className="hx-rim-highlight" />

              {/* Tag pill on image */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-(--hx-accent) uppercase tracking-wider shadow-sm">
                {event.kategori || "Workshop"}
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
                href={`/event/checkout/${event.id_event}`}
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
                {event.kategori || "Program Edukasi Lingkungan"}
              </span>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) leading-tight">
                {event.nama_event}
              </h1>
            </div>

            {/* Quick Metadata Grid (Helix Drift Facts style) */}
            <div className="grid grid-cols-2 gap-px bg-(--hx-pastel)/40 rounded-xl overflow-hidden border border-(--hx-pastel)/40 shadow-sm">
              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4">
                <span className="block text-[10px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                  Tanggal Pelaksanaan
                </span>
                <p className="text-sm sm:text-base font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                  {event.tanggal_pelaksanaan}
                </p>
              </div>

              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4">
                <span className="block text-[10px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                  Waktu &amp; Sesi
                </span>
                <p className="text-sm sm:text-base font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                  {event.waktu || "09.00 - 13.00 WIB"}
                </p>
              </div>

              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4">
                <span className="block text-[10px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                  Lokasi Pertemuan
                </span>
                <p className="text-sm sm:text-base font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                  {event.lokasi || "Wedomartani & Gejayan, Sleman"}
                </p>
              </div>

              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-4">
                <span className="block text-[10px] font-semibold tracking-wider text-(--hx-ink-3) uppercase mb-1">
                  Kuota Peserta
                </span>
                <p className="text-sm sm:text-base font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                  {event.kuota || "30 Peserta (Terbuka)"}
                </p>
              </div>
            </div>

            {/* Description Sheet */}
            <div className="rounded-2xl border border-(--hx-pastel)/50 bg-white/80 p-6 sm:p-7 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-3">
                Deskripsi &amp; Gambaran Acara
              </span>
              <p className="text-sm sm:text-base text-(--hx-ink-2) font-light leading-relaxed">
                {event.deskripsi}
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
