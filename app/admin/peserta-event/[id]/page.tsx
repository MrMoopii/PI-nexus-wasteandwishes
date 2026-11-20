import { redirect } from "next/navigation";

/**
 * Halaman detail peserta event dialihkan ke /admin/events (issue #172, kode tugas 3.3).
 * WW tidak lagi menerima pendaftaran event.
 */
export default function DetailPesertaEventPage({
  params: _params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect("/admin/events");
}
