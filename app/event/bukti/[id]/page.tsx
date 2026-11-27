import { redirect } from "next/navigation";

/**
 * Halaman bukti pendaftaran event lama.
 * WW tidak menerima pendaftaran lagi; dialihkan ke /event (issue #171, tugas 3.2).
 * File ini belum dihapus sampai rilis (PR tersendiri).
 */
export default function EventRegistrationProofPage() {
  redirect("/event");
}
