"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TambahEventForm({
  simpanEventAction,
  fromTab,
}: {
  simpanEventAction: (formData: FormData) => Promise<void>;
  fromTab : string;
}) {

  const router = useRouter();

  const hariIni = new Date();
  const yyyy = hariIni.getFullYear();
  const mm = String(hariIni.getMonth()+1).padStart(2,"0");
  const dd = String(hariIni.getDate()).padStart(2,"0");
  const tanggalDefault = `${yyyy}-${mm}-${dd}`;

  const [tanggal, setTanggal] = useState(tanggalDefault);
  const [waktuSelesai, setWaktuSelesai] = useState("");
  const [status, setStatus] = useState("draft");

  // 1. Hitung isPastEvent secara langsung (Derived State)
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => router.push(`/admin/events?tab=${fromTab}`)}
          className="text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition"
        >
          ← Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Buat Event Baru</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <form 
        action={(formData) => {
          simpanEventAction(formData); 
          router.push(`/admin/events?tab=${fromTab}`); 
        }} 
        className="space-y-6"
      >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Event *</label>
              <input
                type="text"
                name="namaEvent"
                required
                placeholder="Contoh: Workshop Copywriting for Beginners"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis / Kategori Event *</label>
              <input
                type="text"
                name="jenisEvent"
                required
                placeholder="Contoh: Workshop & Pelatihan"
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
                placeholder="0 untuk gratis"
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
                placeholder="Contoh: JIExpo Kemayoran, Jakarta Pusat"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">URL Poster / Gambar</label>
              <input
                type="url"
                name="gambarUrl"
                placeholder="https://contoh.com/gambar-poster.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-2">
                *Sementara gunakan URL eksternal (misal dari Google Drive/Imgur). Fitur upload file lokal memerlukan cloud storage.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-8 flex items-center justify-end gap-4">
            {/* OPSI RENDER DINAMIS BERDASARKAN isPastEvent */}
            <select
              name="statusEvent"
              value={finalStatus}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none text-sm font-medium text-gray-700"
            >
              {isPastEvent ? (
                <option value="lalu">Lalu / Berakhir</option>
              ) : (
                <>
                  <option value="draft">Simpan sebagai Draft</option>
                  <option value="aktif">Langsung Tayangkan (Aktif)</option>
                </>
              )}
            </select>

            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              Simpan Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}