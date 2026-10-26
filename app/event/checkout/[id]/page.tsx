import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, events as eventsTable, users as usersTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export const instant = false;

const DEFAULT_EVENTS: Record<
  number,
  {
    id_event: number;
    nama_event: string;
    gambar: string;
    tanggal_pelaksanaan?: string;
    lokasi?: string;
    kategori?: string;
  }
> = {
  1: {
    id_event: 1,
    nama_event: "Pelatihan Budidaya Maggot BSF",
    gambar: "1.jpg",
    tanggal_pelaksanaan: "25 Oktober 2026",
    lokasi: "Wedomartani, Sleman",
    kategori: "Workshop Budidaya",
  },
  2: {
    id_event: 2,
    nama_event: "Sosialisasi Pemilahan Limbah Dapur",
    gambar: "2.jpg",
    tanggal_pelaksanaan: "02 November 2026",
    lokasi: "Gejayan, Yogyakarta",
    kategori: "Edukasi Warga",
  },
  3: {
    id_event: 3,
    nama_event: "Aksi Hijau Gejayan Bersih",
    gambar: "3.jpg",
    tanggal_pelaksanaan: "15 November 2026",
    lokasi: "Kawasan Gejayan",
    kategori: "Aksi Relawan",
  },
  4: {
    id_event: 4,
    nama_event: "Workshop Kasgot & Pupuk Organik",
    gambar: "4.jpg",
    tanggal_pelaksanaan: "28 November 2026",
    lokasi: "Kranggan, Sleman",
    kategori: "Pertanian Urban",
  },
  5: {
    id_event: 5,
    nama_event: "Edukasi Sirkular Ekonomi Desa",
    gambar: "5.jpg",
    tanggal_pelaksanaan: "10 Desember 2026",
    lokasi: "Sleman, D.I. Yogyakarta",
    kategori: "Seminar Komunitas",
  },
};

export default async function EventCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  // Jika belum login, redirect ke halaman login
  if (!session || !session.user?.email) {
    redirect("/auth");
  }

  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  let event = DEFAULT_EVENTS[eventId] || DEFAULT_EVENTS[1];
  let currentUser = null;

  try {
    // 1. Ambil data Event dari Database
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
        gambar: fallback.gambar,
        tanggal_pelaksanaan: dbEvent.tanggalPelaksanaan || fallback.tanggal_pelaksanaan,
        lokasi: fallback.lokasi,
        kategori: fallback.kategori,
      };
    }

    // 2. Ambil data User dari Database berdasarkan email dari session
    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (dbUser) {
      currentUser = dbUser;
    }
  } catch (error) {
    console.error("Database error:", error);
  }

  if (!event) {
    notFound();
  }

  // Format tanggal lahir untuk input type="date" (YYYY-MM-DD)
  const formatTanggalLahir = currentUser?.tanggalLahir
    ? new Date(currentUser.tanggalLahir).toISOString().split("T")[0]
    : "";

  const plateNo = String(event.id_event).padStart(2, "0");

  return (
    <div className="relative min-h-screen bg-[#F4F7FA] text-[#1B2233] font-[family-name:var(--font-inter)] selection:bg-[#17afb0]/20 selection:text-[#118586]">
      {/* Ambient gradient washes matching Helix Drift */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#B9CDE5]/40 blur-3xl" />
        <div className="absolute top-[30%] -right-32 h-[550px] w-[550px] rounded-full bg-[#DDE7F2]/70 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-[450px] w-[450px] rounded-full bg-[#B9CDE5]/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/event/detail/${event.id_event}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B6879] hover:text-[#17afb0] transition-colors"
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
            <span>Kembali ke Detail Agenda</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#17afb0]" />
            <span className="text-[11px] font-semibold tracking-[0.2em] text-[#93A0B2] uppercase">
              Konfirmasi Registrasi
            </span>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Kolom Kiri (5 Cols): Ringkasan Event */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-2xl border border-[#B9CDE5]/50 bg-white/90 p-6 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#DDE7F2] border border-[#B9CDE5]/40 mb-5">
                <Image
                  src={`/img/event/${event.gambar}`}
                  alt={event.nama_event}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]" />

                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-semibold text-[#17afb0] tracking-wider uppercase">
                  Plate {plateNo}
                </div>
              </div>

              <span className="text-[10px] font-semibold tracking-[0.2em] text-[#17afb0] uppercase block mb-1">
                Agenda Terpilih
              </span>
              <h2 className="text-xl font-semibold text-[#1B2233] font-[family-name:var(--font-plus-jakarta-sans)] leading-snug">
                {event.nama_event}
              </h2>

              <div className="mt-4 pt-4 border-t border-[#DDE7F2]/60 space-y-2 text-xs text-[#5B6879]">
                <div className="flex items-center justify-between">
                  <span className="text-[#93A0B2]">Tanggal:</span>
                  <span className="font-medium text-[#1B2233]">
                    {event.tanggal_pelaksanaan || "Sesuai Jadwal Publikasi"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#93A0B2]">Lokasi:</span>
                  <span className="font-medium text-[#1B2233]">
                    {event.lokasi || "Wedomartani & Gejayan, Sleman"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#93A0B2]">Status Tiket:</span>
                  <span className="font-bold text-[#17afb0]">Gratis (1 Slot)</span>
                </div>
              </div>
            </div>

            {/* Catatan Penting Sheet */}
            <div className="rounded-2xl border border-[#B9CDE5]/40 bg-[#E8F4F4]/60 p-5 text-xs text-[#5B6879] leading-relaxed space-y-2">
              <strong className="text-[#17afb0] font-semibold block">
                Petunjuk Registrasi
              </strong>
              <p>
                1. Tiket digital akan otomatis dicatat atas nama akun yang sedang aktif.
              </p>
              <p>
                2. Pengingat jadwal dan koordinasi teknis akan dihubungi via nomor WhatsApp terdaftar.
              </p>
            </div>
          </div>

          {/* Kolom Kanan (7 Cols): Form Konfirmasi Data */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#B9CDE5]/60 bg-white/95 p-8 sm:p-10 shadow-[0_12px_40px_rgb(27,34,51,0.06)] backdrop-blur-md">
              <div className="border-b border-[#DDE7F2]/80 pb-5 mb-6">
                <span className="text-[11px] font-semibold tracking-[0.2em] text-[#17afb0] uppercase block mb-1">
                  Verifikasi Identitas
                </span>
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#1B2233] font-[family-name:var(--font-plus-jakarta-sans)]">
                  Konfirmasi Pendaftaran
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-[#5B6879] font-light">
                  Data peserta di bawah diambil secara otomatis dari profil akun terdaftar Anda.
                </p>
              </div>

              <form action="/api/event/checkout" method="POST" className="space-y-5">
                <input type="hidden" name="id_event" value={event.id_event} />
                {currentUser && (
                  <input type="hidden" name="id_user" value={currentUser.idUser} />
                )}

                <div>
                  <label
                    htmlFor="nama"
                    className="block text-xs font-semibold text-[#1B2233] uppercase tracking-wider mb-2"
                  >
                    Nama Lengkap Peserta
                  </label>
                  <input
                    type="text"
                    id="nama"
                    name="nama"
                    required
                    readOnly
                    defaultValue={currentUser?.namaPelanggan || ""}
                    placeholder="Masukkan nama lengkap"
                    className="w-full rounded-xl border border-[#B9CDE5]/60 bg-[#F4F7FA] px-4 py-3 text-sm text-[#1B2233] cursor-not-allowed focus:outline-none"
                  />
                  <span className="mt-1 block text-[11px] text-[#93A0B2]">
                    Nama sesuai profil akun pengguna
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="no_hp"
                    className="block text-xs font-semibold text-[#1B2233] uppercase tracking-wider mb-2"
                  >
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    id="no_hp"
                    name="no_hp"
                    required
                    readOnly
                    defaultValue={currentUser?.nomorTelp || ""}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-xl border border-[#B9CDE5]/60 bg-[#F4F7FA] px-4 py-3 text-sm text-[#1B2233] cursor-not-allowed focus:outline-none"
                  />
                  <span className="mt-1 block text-[11px] text-[#93A0B2]">
                    Untuk pengiriman informasi lokasi &amp; pengingat acara
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="tgl_lahir"
                    className="block text-xs font-semibold text-[#1B2233] uppercase tracking-wider mb-2"
                  >
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    id="tgl_lahir"
                    name="tgl_lahir"
                    required
                    readOnly
                    defaultValue={formatTanggalLahir}
                    className="w-full rounded-xl border border-[#B9CDE5]/60 bg-[#F4F7FA] px-4 py-3 text-sm text-[#1B2233] cursor-not-allowed focus:outline-none"
                  />
                </div>

                {/* Summary Box */}
                <div className="rounded-xl border border-[#DDE7F2] bg-[#F4F7FA]/80 p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#93A0B2] block">Total Biaya Pendaftaran</span>
                    <strong className="text-sm text-[#17afb0] font-[family-name:var(--font-plus-jakarta-sans)]">
                      Rp 0 (Gratis Penuh)
                    </strong>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#17afb0]/15 text-[#17afb0]">
                    Terkonfirmasi
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#17afb0] px-6 py-4 text-sm font-bold text-white shadow-md shadow-[#17afb0]/25 transition-all duration-200 hover:bg-[#118586] hover:shadow-lg active:scale-[0.99] cursor-pointer"
                  >
                    Konfirmasi &amp; Amankan Slot (Gratis)
                  </button>
                </div>

                <p className="text-center text-[11px] text-[#93A0B2]">
                  Dengan menekan tombol di atas, Anda menyetujui komitmen kehadiran untuk agenda ini.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
