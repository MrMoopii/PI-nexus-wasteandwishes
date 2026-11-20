import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { getDaftarEventAdmin } from "@/features/event/queries/admin";
import { eventSudahLewat, eventYangStatusnyaBerubah } from "@/features/event/aturan";
import { skemaTabEvent } from "@/features/event/validasi/admin";
import { KartuEvent } from "./_components/kartu-event";

// Halaman daftar event admin /admin/events (kode tugas 3.3).
// Data runtime ada di komponen anak di bawah <Suspense>, dengan fallback
// setinggi isi aslinya (CONTRIBUTING 8 no. 1 dan 10).

/**
 * Halaman daftar event admin dengan tab aktif, draft, dan lalu.
 * Tab yang tidak dikenal diabaikan supaya halaman tetap terbuka.
 */
export default async function AdminEventPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return (
    <Suspense fallback={<KerangkaDaftarEvent />}>
      <DaftarEvent searchParams={searchParams} />
    </Suspense>
  );
}

/** Isi halaman: membaca tab, menyegarkan status event, lalu menyusun kartu. */
async function DaftarEvent({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // 1. Data runtime per permintaan; tanpa ini query dijalankan saat build (CONTRIBUTING 8 no. 2).
  await connection();

  // 2. Tab dari URL divalidasi dengan skema Zod (CONTRIBUTING 9.8).
  const resolved = await searchParams;
  const tabParsed = skemaTabEvent.parse({ tab: resolved.tab });
  const tab = tabParsed.tab;

  // 3. Ambil daftar event; query sudah memastikan pemanggil adalah admin.
  let daftarEvent = await getDaftarEventAdmin();
  const sekarang = new Date();

  // 4. Segarkan status event yang sudah lewat (aktif ke lalu, draft yang
  //    waktunya tiba ke aktif). Satu kali saja per permintaan.
  const { keLalu, keAktif } = eventYangStatusnyaBerubah(daftarEvent, sekarang);
  if (keLalu.length > 0) {
    await getDb()
      .update(events)
      .set({ statusEvent: "lalu" })
      .where(inArray(events.idEvent, keLalu));
  }
  if (keAktif.length > 0) {
    await getDb()
      .update(events)
      .set({ statusEvent: "aktif" })
      .where(inArray(events.idEvent, keAktif));
  }
  if (keLalu.length > 0 || keAktif.length > 0) {
    daftarEvent = await getDaftarEventAdmin();
  }

  // 5. Saring event sesuai tab yang dipilih.
  const dataEvents = daftarEvent.filter((event) => {
    if (tab === "draft") return event.statusEvent === "draft";
    if (tab === "lalu") {
      return (
        event.statusEvent === "lalu" ||
        (event.statusEvent === "aktif" && eventSudahLewat(event, sekarang))
      );
    }
    return event.statusEvent === "aktif" && !eventSudahLewat(event, sekarang);
  });

  return (
    <div className="mx-auto max-w-7xl p-6 font-(family-name:--font-plus-jakarta-sans)">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Event Saya</h1>

      {/* Tab Navigasi */}
      <div className="mb-6 flex border-b border-gray-200">
        {(["aktif", "draft", "lalu"] as const).map((namaTab) => (
          <Link
            key={namaTab}
            href={`?tab=${namaTab}`}
            className={`px-6 py-4 text-sm font-medium ${
              tab === namaTab
                ? "border-b-2 border-(--hx-accent) text-(--hx-accent)"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {namaTab.toUpperCase()}
          </Link>
        ))}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Tombol Buat Event Baru (Disembunyikan di tab "lalu") */}
        {tab !== "lalu" && (
          <Link
            href={`/admin/events/tambah?t=${crypto.randomUUID()}`}
            className="group flex min-h-87.5 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--hx-accent)/50 bg-white transition-colors hover:border-(--hx-accent) hover:bg-[var(--hx-accent)]/5"
          >
            <span className="mb-4 text-5xl font-light text-(--hx-accent) transition-transform group-hover:scale-110">
              +
            </span>
            <span className="text-sm font-semibold text-(--hx-accent)">
              Buat Event Baru
            </span>
          </Link>
        )}

        {/* Pesan Kosong */}
        {dataEvents.length === 0 && (
          <div className="col-span-1 flex min-h-87.5 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 md:col-span-1 lg:col-span-3">
            <p className="text-center font-medium text-gray-500">
              Saat ini belum ada event pada Event{" "}
              {tab.charAt(0).toUpperCase() + tab.slice(1)},
              silakan buat event baru!
            </p>
          </div>
        )}

        {/* Render Kartu Event */}
        {dataEvents.map((event) => (
          <KartuEvent key={event.idEvent} event={event} fromTab={tab} />
        ))}
      </div>
    </div>
  );
}

/** Kerangka dengan tinggi yang sama dengan isi asli, supaya tidak ada yang bergeser. */
function KerangkaDaftarEvent() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8 h-8 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mb-6 h-12 border-b border-gray-200" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-87.5 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    </div>
  );
}
