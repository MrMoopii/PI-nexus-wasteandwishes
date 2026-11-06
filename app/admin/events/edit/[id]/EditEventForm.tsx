"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EventData = {
  idEvent: number;
  namaEvent: string;
  jenisEvent: string;
  biayaEvent: string | number;
  tanggalPelaksanaan: Date | string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  lokasi: string | null;
  statusEvent: string;
  gambarUrl: string | null;
};

export default function EditEventForm({
  existingEvent,
  updateEventAction,
}: {
  existingEvent: EventData;
  updateEventAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();  
  const formattedDate = existingEvent.tanggalPelaksanaan
    ? new Date(existingEvent.tanggalPelaksanaan).toISOString().split("T")[0]
    : "";

  // State untuk memantau perubahan input
  const [tanggal, setTanggal] = useState(formattedDate);
  const [waktuSelesai, setWaktuSelesai] = useState(existingEvent.waktuSelesai || "");
  const [status, setStatus] = useState(existingEvent.statusEvent);

 // 1. Hitung isPastEvent secara langsung
  let isPastEvent = false;
  if (tanggal) {
    const eventDate = new Date(tanggal);
    if (waktuSelesai) {
      const [hours, minutes] = waktuSelesai.split(":");
      eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    } else {
      eventDate.setHours(23, 59, 59, 999);
    }
    isPastEvent = eventDate < new Date();
  }

  // 2. Tentukan status final secara langsung TANPA useEffect
  const finalStatus = isPastEvent ? "lalu" : (status === "lalu" ? "draft" : status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
      <form 
        action={async (formData) => {
          updateEventAction(formData); 
          router.back();                     
        }} 
        className="space-y-6"
      >
        <input type="hidden" name="idEvent" value={existingEvent.idEvent} />
        <div className="flex items-center gap-4 mb-8">
            <button
            type="button"
            onClick={() => router.back()} 
            className="text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition"
            >
            ← Batal
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
      </div>       
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Event *</label>
            <input
              type="text"
              name="namaEvent"
              required
              defaultValue={existingEvent.namaEvent}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Event *</label>
            <input
              type="text"
              name="jenisEvent"
              required
              defaultValue={existingEvent.jenisEvent}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Biaya Event (Rp) *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Pelaksanaan *</label>
            <input
              type="date"
              name="tanggalPelaksanaan"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jam Mulai</label>
              <input
                type="time"
                name="waktuMulai"
                defaultValue={existingEvent.waktuMulai || ""}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jam Selesai</label>
              <input
                type="time"
                name="waktuSelesai"
                value={waktuSelesai}
                onChange={(e) => setWaktuSelesai(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Venue & Lokasi *</label>
            <input
              type="text"
              name="lokasi"
              required
              defaultValue={existingEvent.lokasi || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">URL Poster / Gambar</label>
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
            value={finalStatus}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none text-sm font-medium"
          >
            {isPastEvent ? (
              <option value="lalu">Lalu / Berakhir</option>
            ) : (
              <>
                <option value="draft">Draft</option>
                <option value="aktif">Aktif</option>
              </>
            )}
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
  );
}