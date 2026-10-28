import Link from "next/link";
import GambarEvent from "@/components/GambarEvent";
import { formatTanggal } from "@/lib/format-tanggal";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { events as eventsTable, users as usersTable } from "@/lib/db/schema"; // Pastikan usersTable di-import
import { and, eq } from "drizzle-orm";
import { connection } from "next/server";
import { confirmEventRegistration } from "@/app/event/actions";

export const instant = false;

export default async function EventCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    message?: string;
    proofId?: string;
  }>;
}) {
  const session = await auth();

  // Jika belum login, redirect ke halaman login
  if (!session || !session.user?.email) {
    redirect("/auth/login");
  }

  const resolvedParams = await params;
  const idEvent = Number(resolvedParams.id);
  if (!Number.isInteger(idEvent) || idEvent <= 0) {
    notFound();
  }

  let currentUser = null;

  await connection();

  // 1. Ambil data Event dari Database
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

  // 2. Ambil data User dari Database berdasarkan email dari session
  const [user] = await getDb()
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, session.user.email))
    .limit(1);

  if (user) {
    currentUser = user;
  }
  //
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rawErrorMessage =
    typeof resolvedSearchParams.error === "string"
      ? decodeURIComponent(resolvedSearchParams.error)
      : "";
  const infoMessage =
    typeof resolvedSearchParams.message === "string"
      ? decodeURIComponent(resolvedSearchParams.message)
      : "";
  const proofId =
    typeof resolvedSearchParams.proofId === "string"
      ? resolvedSearchParams.proofId
      : "";

  const errorMessage = rawErrorMessage.includes(
    "Sudah terdaftar pada event ini.",
  )
    ? ""
    : rawErrorMessage;
  const bannerMessage = infoMessage.includes("Sudah terdaftar pada event ini.")
    ? ""
    : infoMessage;

  if (!eventDipilih) {
    notFound();
  }

  // Format tanggal lahir untuk input type="date" (YYYY-MM-DD)
  const formatTanggalLahir = currentUser?.tanggalLahir
    ? new Date(currentUser.tanggalLahir).toISOString().split("T")[0]
    : "";

  const plateNo = String(eventDipilih.idEvent).padStart(2, "0");

  const newLocal = "text-(--hx-ink-3)";
  return (
    <div className="relative min-h-screen bg-(--hx-canvas) text-(--hx-ink) font-(family-name:--font-inter) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark)">
      {/* Ambient gradient washes matching Helix Drift */}
      <div aria-hidden="true" className="hx-ambient-wash">
        <div className="hx-ambient-blob-1" />
        <div className="hx-ambient-blob-2" />
        <div className="hx-ambient-blob-3" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/event/detail/${eventDipilih.idEvent}`}
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
            <span>Kembali ke Detail Agenda</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-(--hx-accent)" />
            <span className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase">
              Konfirmasi Registrasi
            </span>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Kolom Kiri (5 Cols): Ringkasan Event */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="rounded-2xl border border-(--hx-pastel)/50 bg-white/90 p-6 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
              <div className="relative aspect-16/10 w-full rounded-xl overflow-hidden bg-(--hx-sunk) border border-(--hx-pastel)/40 mb-5">
                <GambarEvent
                  src={eventDipilih.gambarUrl}
                  alt={eventDipilih.namaEvent}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  preload
                />
                <div className="hx-rim-highlight" />

                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-semibold text-(--hx-accent) tracking-wider uppercase">
                  Plate {plateNo}
                </div>
              </div>

              <span className="text-[10px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase block mb-1">
                Agenda Terpilih
              </span>
              <h2 className="text-xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) leading-snug">
                {eventDipilih.namaEvent}
              </h2>

              <div className="mt-4 pt-4 border-t border-(--hx-sunk)/60 space-y-2 text-xs text-(--hx-ink-2)">
                <div className="flex items-center justify-between">
                  <span className="text-(--hx-ink-3)">Tanggal:</span>
                  <span className="font-medium text-(--hx-ink)">
                    {formatTanggal(eventDipilih.tanggalPelaksanaan) ||
                      "Sesuai Jadwal Publikasi"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={newLocal}>Lokasi:</span>
                  <span className="font-medium text-(--hx-ink)">
                    {eventDipilih.lokasi || "Wedomartani & Gejayan, Sleman"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-(--hx-ink-3)">Status Tiket:</span>
                  <span className="font-bold text-(--hx-accent)">
                    Gratis (1 Slot)
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan Penting Sheet */}
            <div className="rounded-2xl border border-(--hx-pastel)/40 bg-[#E8F4F4]/60 p-5 text-xs text-(--hx-ink-2) leading-relaxed space-y-2">
              <strong className="text-(--hx-accent) font-semibold block">
                Petunjuk Registrasi
              </strong>
              <p>
                1. Tiket digital akan otomatis dicatat atas nama akun yang
                sedang aktif.
              </p>
              <p>
                2. Pengingat jadwal dan koordinasi teknis akan dihubungi via
                nomor WhatsApp terdaftar.
              </p>
            </div>
          </div>

          {/* Kolom Kanan (7 Cols): Form Konfirmasi Data */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-(--hx-pastel)/60 bg-white/95 p-8 sm:p-10 shadow-[0_12px_40px_rgb(27,34,51,0.06)] backdrop-blur-md">
              <div className="border-b border-(--hx-sunk)/80 pb-5 mb-6">
                <span className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase block mb-1">
                  Verifikasi Identitas
                </span>
                <h1 className="text-2xl sm:text-3xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                  Konfirmasi Pendaftaran
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-(--hx-ink-2) font-light">
                  Data peserta di bawah diambil secara otomatis dari profil akun
                  terdaftar Anda.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {!errorMessage && !bannerMessage && proofId && (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-semibold">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Sudah terdaftar
                      </p>
                      <p className="mt-1 text-sm">
                        Anda sudah terdaftar pada event ini.
                      </p>
                    </div>

                    <Link
                      href={`/event/bukti/${proofId}`}
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Lihat Bukti
                    </Link>
                  </div>
                </div>
              )}

              <form action={confirmEventRegistration} className="space-y-5">
                <input
                  type="hidden"
                  name="id_event"
                  value={eventDipilih.idEvent}
                />
                {currentUser && (
                  <input
                    type="hidden"
                    name="id_user"
                    value={currentUser.idUser}
                  />
                )}

                <div>
                  <label
                    htmlFor="nama"
                    className="block text-xs font-semibold text-(--hx-ink) uppercase tracking-wider mb-2"
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
                    className="hx-input-readonly"
                  />
                  <span className="mt-1 block text-[11px] text-(--hx-ink-3)">
                    Nama sesuai profil akun pengguna
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="no_hp"
                    className="block text-xs font-semibold text-(--hx-ink) uppercase tracking-wider mb-2"
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
                    className="hx-input-readonly"
                  />
                  <span className="mt-1 block text-[11px] text-(--hx-ink-3)">
                    Untuk pengiriman informasi lokasi &amp; pengingat acara
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="tgl_lahir"
                    className="block text-xs font-semibold text-(--hx-ink) uppercase tracking-wider mb-2"
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
                    className="hx-input-readonly"
                  />
                </div>

                {/* Summary Box */}
                <div className="rounded-xl border border-(--hx-sunk) bg-(--hx-canvas)/80 p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-(--hx-ink-3) block">
                      Total Biaya Pendaftaran
                    </span>
                    <strong className="text-sm text-(--hx-accent) font-(family-name:--font-plus-jakarta-sans)">
                      Rp 0 (Gratis Penuh)
                    </strong>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--hx-accent)/15 text-(--hx-accent)">
                    Terkonfirmasi
                  </span>
                </div>

                <div className="pt-2">
                  <button type="submit" className="hx-btn-primary w-full">
                    Konfirmasi &amp; Amankan Slot (Gratis)
                  </button>
                </div>

                <p className="text-center text-[11px] text-(--hx-ink-3)">
                  Dengan menekan tombol di atas, Anda menyetujui komitmen
                  kehadiran untuk agenda ini.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
