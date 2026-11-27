import { redirect } from "next/navigation";

/**
 * Halaman daftar peserta event dialihkan ke /admin/events (issue #172, kode tugas 3.3).
 * WW tidak lagi menerima pendaftaran event.
 */
export default function PesertaEventPage() {
  redirect("/admin/events");
}
