import { requireAdmin } from "@/lib/require-admin";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import TambahEventForm from "./TambahEventForm"; // Import form client component
import { revalidatePath } from "next/cache";

export default function TambahEventPage() {
  
  async function simpanEvent(formData: FormData) {
    "use server";

    const cek = await requireAdmin();
    if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");

    const namaEvent = formData.get("namaEvent") as string;
    const jenisEvent = formData.get("jenisEvent") as string;
    const tanggalPelaksanaan = formData.get("tanggalPelaksanaan") as string;
    const waktuMulai = formData.get("waktuMulai") as string;
    const waktuSelesai = formData.get("waktuSelesai") as string;
    const lokasi = formData.get("lokasi") as string;
    const biayaEvent = formData.get("biayaEvent") as string;
    const statusInput = formData.get("statusEvent") as string;
    const gambarUrl = formData.get("gambarUrl") as string;

    const now = new Date();
    let finalStatus = statusInput;

    // Proteksi tambahan di backend jika admin mencoba "bypass" form
    if ((finalStatus === "aktif" || finalStatus === "draft") && tanggalPelaksanaan) {
      const eventDate = new Date(tanggalPelaksanaan);
      if (waktuSelesai) {
        const [hours, minutes] = waktuSelesai.split(":");
        eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      } else {
        eventDate.setHours(23, 59, 59, 999);
      }
      if (eventDate < now) {
        finalStatus = "lalu";
      }
    }

    await getDb()
      .insert(events)
      .values({
        namaEvent,
        jenisEvent,
        tanggalPelaksanaan,
        waktuMulai: waktuMulai || null,
        waktuSelesai: waktuSelesai || null,
        lokasi,
        biayaEvent: biayaEvent || "0",
        statusEvent: finalStatus,
        gambarUrl: gambarUrl || null,
      });


    revalidatePath("/admin/events", "layout");
    revalidatePath("/event", "page");
    redirect("/admin/events");
  }

  return <TambahEventForm simpanEventAction={simpanEvent} />;
}