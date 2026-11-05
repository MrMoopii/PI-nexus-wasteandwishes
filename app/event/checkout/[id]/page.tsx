import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { events as eventsTable, users as usersTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { connection } from "next/server";
import RingkasanEvent from "./ringkasan-event";
import FormKonfirmasi from "./form-konfirmasi";

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

  return (
    <div className="relative min-h-screen bg-(--hx-canvas) text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark)">
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
          <RingkasanEvent event={eventDipilih} />

          {/* Kolom Kanan (7 Cols): Form Konfirmasi Data */}
          <FormKonfirmasi
            event={eventDipilih}
            currentUser={currentUser}
            formatTanggalLahir={formatTanggalLahir}
            errorMessage={errorMessage}
            bannerMessage={bannerMessage}
            proofId={proofId}
          />
        </div>
      </div>
    </div>
  );
}
