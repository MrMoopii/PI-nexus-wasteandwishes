import { redirect } from "next/navigation";
import { FormEvent } from "../_components/form-event";

// Halaman tambah event admin /admin/events/tambah (kode tugas 3.3).
// Server Action-nya ada di features/event/actions/admin.ts.

/**
 * Halaman form tambah event. Admin sudah dijaga middleware /admin, dan
 * Server Action tambahEvent() memeriksa lagi sesi admin saat menyimpan.
 */
export default async function TambahEventPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const resolved = await searchParams;
  const fromTab = resolved.from || "aktif";

  // Tab asal harus salah satu tab yang dikenal, supaya tautan kembali tidak
  // merusak filter daftar.
  if (!["aktif", "draft", "lalu"].includes(fromTab)) {
    redirect("/admin/events?tab=aktif");
  }

  return (
    <div className="mx-auto max-w-4xl p-6 font-(family-name:--font-plus-jakarta-sans)">
      <FormEvent fromTab={fromTab} />
    </div>
  );
}
