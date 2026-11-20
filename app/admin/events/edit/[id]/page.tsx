import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { getEventAdmin } from "@/features/event/queries/admin";
import { skemaIdEvent } from "@/features/event/validasi/admin";
import { FormEvent } from "../../_components/form-event";

// Halaman ubah event admin /admin/events/edit/[id] (kode tugas 3.3).
// Server Action-nya ada di features/event/actions/admin.ts.

/**
 * Halaman form ubah event. ID tidak valid atau event tidak ada → notFound().
 * Admin sudah dijaga middleware /admin, dan Server Action ubahEvent()
 * memeriksa lagi sesi admin saat menyimpan.
 */
export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  return (
    <Suspense fallback={<KerangkaFormEvent />}>
      <IsiFormEvent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** Isi halaman: validasi ID, ambil event, lalu susun form. */
async function IsiFormEvent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  // 1. Data runtime per permintaan (CONTRIBUTING 8 no. 2).
  await connection();

  // 2. ID dari URL divalidasi dengan skema Zod (CONTRIBUTING 9.8).
  const resolvedParams = await params;
  const hasilValidasi = skemaIdEvent.safeParse({ idEvent: resolvedParams.id });
  if (!hasilValidasi.success) notFound();
  const { idEvent } = hasilValidasi.data;

  // 3. Ambil event; event yang tidak ada menghasilkan 404.
  const event = await getEventAdmin(idEvent);
  if (!event) notFound();

  // 4. Tab asal harus tab yang dikenal, supaya tautan kembali tidak merusak filter.
  const resolvedSearch = await searchParams;
  const fromTab = resolvedSearch.from || "aktif";
  if (!["aktif", "draft", "lalu"].includes(fromTab)) {
    redirect(`/admin/events/edit/${idEvent}?from=aktif`);
  }

  return (
    <div className="mx-auto max-w-4xl p-6 font-(family-name:--font-plus-jakarta-sans)">
      <FormEvent event={event} fromTab={fromTab} />
    </div>
  );
}

/** Kerangka dengan tinggi yang sama dengan isi asli, supaya tidak ada yang bergeser. */
function KerangkaFormEvent() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 h-8 w-56 animate-pulse rounded bg-gray-200" />
      <div className="h-96 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
    </div>
  );
}
