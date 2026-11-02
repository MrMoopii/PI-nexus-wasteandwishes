import { connection } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { events as eventsTable } from "@/lib/db/schema";
import { formatTanggal } from "@/lib/format-tanggal";
import EventSlider, {type SliderEvent} from "@/components/event-slider/EventSlider";
    
export default async function EventSliderServer() {
  // Ambil event aktif dari database (sama seperti app/event/page.tsx)
  await connection();

  let sliderEvents: SliderEvent[] = [];
  try {
    const rows = await getDb()
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.statusEvent, "aktif"))
      .orderBy(asc(eventsTable.tanggalPelaksanaan))
      .limit(8); // batasi jumlah gambar di slider

    sliderEvents = rows.map((e) => {
      const deskripsi = e.deskripsi ?? "";
      return {
        id: e.idEvent,
        judul: e.namaEvent,
        deskripsi:
          deskripsi.length > 140 ? `${deskripsi.slice(0, 140).trimEnd()}…` : deskripsi,
        gambarUrl: e.gambarUrl ?? null,
        lokasi: e.lokasi || "Lokasi menyusul",
        tanggal: formatTanggal(e.tanggalPelaksanaan),
        jenis: e.jenisEvent || "Workshop",
      };
    });
  } catch (error) {
    console.error("Error fetching events for home slider", error);
  }

  // Status login (sama dengan logika di Header)
  const session = await auth();
  const loggedIn = !!session?.user && !session.user.isIdle;

    return ( 
    <EventSlider events={sliderEvents} loggedIn = {loggedIn}/>);

}