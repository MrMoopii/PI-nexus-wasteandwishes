import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const eventId = Number(resolvedParams.id);

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

  const formattedDate = existingEvent.tanggalPelaksanaan
    ? new Date(existingEvent.tanggalPelaksanaan).toISOString().split("T")[0]
    : "";

  async function updateEvent(formData: FormData) {
    "use server";
    const id = Number(formData.get("idEvent"));
    if (!id || isNaN(id)) {
      throw new Error("ID Event tidak valid untuk proses update.");
    }
    const namaEvent = formData.get("namaEvent") as string;
    const jenisEvent = formData.get("jenisEvent") as string;
    const tanggalPelaksanaan = formData.get("tanggalPelaksanaan") as string;
    const waktuMulai = formData.get("waktuMulai") as string;
    const waktuSelesai = formData.get("waktuSelesai") as string;
    const lokasi = formData.get("lokasi") as string;
    const biayaEvent = formData.get("biayaEvent") as string;
    const statusEvent = formData.get("statusEvent") as string;
    const gambarUrl = formData.get("gambarUrl") as string;

    await getDb()
      .update(events)
      .set({
        namaEvent,
        jenisEvent,
        tanggalPelaksanaan,
        waktuMulai: waktuMulai || null,
        waktuSelesai: waktuSelesai || null,
        lokasi,
        biayaEvent: biayaEvent || "0",
        statusEvent,
        gambarUrl: gambarUrl || null,
      })
      .where(eq(events.idEvent, id));

    revalidatePath("/admin/events");
    redirect("/admin/events");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/events"
          className="text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition"
        >
          ← Batal
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Event
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <form action={updateEvent} className="space-y-6">
          <input type="hidden" name="idEvent" value={existingEvent.idEvent} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Event *
              </label>
              <input
                type="text"
                name="namaEvent"
                required
                defaultValue={existingEvent.namaEvent}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Event *
              </label>
              <input
                type="text"
                name="jenisEvent"
                required
                defaultValue={existingEvent.jenisEvent}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biaya Event (Rp) *
              </label>
              <input
                type="number"
                name="biayaEvent"
                min="0"
                required
                defaultValue={Number(existingEvent.biayaEvent)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                name="tanggalPelaksanaan"
                required
                defaultValue={formattedDate}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Mulai
                </label>
                <input
                  type="time"
                  name="waktuMulai"
                  defaultValue={existingEvent.waktuMulai || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Selesai
                </label>
                <input
                  type="time"
                  name="waktuSelesai"
                  defaultValue={existingEvent.waktuSelesai || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue & Lokasi *
              </label>
              <input
                type="text"
                name="lokasi"
                required
                defaultValue={existingEvent.lokasi || ""}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Poster / Gambar
              </label>
              <input
                type="url"
                name="gambarUrl"
                defaultValue={existingEvent.gambarUrl || ""}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-8 flex items-center justify-end gap-4">
            <label className="text-sm font-medium text-gray-700">Status Event:</label>
            <select
              name="statusEvent"
              defaultValue={existingEvent.statusEvent}
              className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none text-sm font-medium"
            >
              <option value="draft">Draft</option>
              <option value="aktif">Aktif</option>
              <option value="lalu">Lalu / Berakhir</option>
            </select>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
