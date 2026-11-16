"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageKitEventUpload } from "@/components/admin/ImageKitEventUpload";

type PosterItem = {
  url: string;
  fileId: string;
};

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
  gambarFileId?: string | null;
};

export default function EditEventForm({
  existingEvent,
  updateEventAction,
  fromTab,
}: {
  existingEvent: EventData;
  updateEventAction: (formData: FormData) => Promise<void>;
  fromTab: string;
}) {
  const router = useRouter();
  const formattedDate = existingEvent.tanggalPelaksanaan
    ? new Date(existingEvent.tanggalPelaksanaan).toISOString().split("T")[0]
    : "";

  // State untuk memantau perubahan input
  const [tanggal, setTanggal] = useState(formattedDate);
  const [waktuSelesai, setWaktuSelesai] = useState(
    existingEvent.waktuSelesai || "",
  );
  const [status, setStatus] = useState(existingEvent.statusEvent);

  // Poster yang tersimpan (URL + fileId). Jika tidak ada, tetap tampilkan URL lama.
  const [poster, setPoster] = useState<PosterItem | null>(() => {
    if (existingEvent.gambarUrl) {
      return {
        url: existingEvent.gambarUrl,
        fileId: existingEvent.gambarFileId || "",
      };
    }
    return null;
  });
  const [deletedFileId, setDeletedFileId] = useState<string | null>(null);

  const handlePosterChange = (p: PosterItem | null, d: string | null) => {
    setPoster(p);
    setDeletedFileId(d);
  };

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
  const finalStatus = isPastEvent
    ? "lalu"
    : status === "lalu"
      ? "draft"
      : status;

  const handleSubmit = async (formData: FormData) => {
    formData.set("statusEvent", finalStatus);

    // Poster dari ImageKit (kosongkan jika dihapus)
    formData.set("gambarUrl", poster?.url ?? "");
    formData.set("gambarFileId", poster?.fileId ?? "");

    // Sinyal file poster lama yang perlu dibersihkan dari ImageKit
    if (deletedFileId) {
      formData.set("deletedPosterFileId", deletedFileId);
    }

    await updateEventAction(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="idEvent" value={existingEvent.idEvent} />
        <input type="hidden" name="fromTab" value={fromTab} />
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => {
              setTanggal(formattedDate);
              setWaktuSelesai(existingEvent.waktuSelesai || "");
              setStatus(existingEvent.statusEvent);
              router.push(`/admin/events?tab=${fromTab}`);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-(--hx-ink-2) shadow-xs transition-all hover:bg-gray-50 hover:text-(--hx-accent)"
          >
            <span aria-hidden="true">←</span>
            <span>Batal</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        </div>
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
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
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
                value={waktuSelesai}
                onChange={(e) => setWaktuSelesai(e.target.value)}
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

          <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <ImageKitEventUpload
              existingPoster={poster}
              onChange={handlePosterChange}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-8 flex items-center justify-end gap-4">
          <label className="text-sm font-medium text-gray-700">
            Status Event:
          </label>
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
