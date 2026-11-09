import { requireAdmin } from "@/lib/require-admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import EditEventForm from "./EditEventForm"; // Import form client component

export const instant = false;

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{t?:string; from?:string}>;
}) {
  await connection();

  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const eventId = Number(resolvedParams.id);
  const editKey = resolvedSearch.t || "default";
  const fromTab = resolvedSearch.from || "aktif";

  if (!eventId || isNaN(eventId)) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold text-red-600">ID Event tidak valid.</h1>
        <Link href="/admin/events" className="text-blue-600 mt-4 inline-block">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const dataEvent = await getDb()
    .select()
    .from(events)
    .where(eq(events.idEvent, eventId));

  const existingEvent = dataEvent[0];

  if (!existingEvent) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Event tidak ditemukan!</h1>
        <Link href="/admin/events" className="text-blue-600 mt-4 inline-block">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }


  async function updateEvent(formData: FormData) {
    "use server";

    const cek = await requireAdmin();
    if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");

    const idEvent = Number(formData.get("idEvent"));
    const namaEvent = formData.get("namaEvent") as string;
    const jenisEvent = formData.get("jenisEvent") as string;
    const biayaEvent = formData.get("biayaEvent") as string;
    const tanggalPelaksanaan = formData.get("tanggalPelaksanaan") as string;
    const waktuMulai = formData.get("waktuMulai") as string;
    const waktuSelesai = formData.get("waktuSelesai") as string;
    const lokasi = formData.get("lokasi") as string;
    const statusInput = formData.get("statusEvent") as string; 
    const gambarUrl = formData.get("gambarUrl") as string;
    
    const targetTab = fromTab;
    const now = new Date();
    let finalStatus = statusInput; 

    // Pengecekan ulang di backend agar lebih aman
    if (finalStatus === "aktif" && tanggalPelaksanaan) {
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
      .update(events)
      .set({  
        namaEvent,
        jenisEvent,
        biayaEvent,
        tanggalPelaksanaan,
        waktuMulai: waktuMulai || null,
        waktuSelesai: waktuSelesai || null,
        lokasi,
        statusEvent: finalStatus,
        gambarUrl: gambarUrl || null,
      })
      .where(eq(events.idEvent, idEvent));

    revalidatePath(`/admin/events/edit/${idEvent}`, "page");
    revalidatePath("/admin/events", "layout");
    revalidatePath("/event", "page");
    redirect(`/admin/events?tab=${targetTab}`);
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto font-(family-name:--font-plus-jakarta-sans)">

      {/* Gunakan Client Component dan oper data & action-nya */}
      <EditEventForm 
        key={editKey}
        existingEvent={existingEvent} 
        updateEventAction={updateEvent} 
        fromTab={fromTab}
      />
    </div>
  );
}