import { redirect } from "next/navigation";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";

export default function TambahEventPage() {
  // Server Action: Fungsi ini akan dieksekusi di server saat form di-submit
  async function simpanEvent(formData: FormData) {
    "use server";

    // Mengambil data dari input form
    const namaEvent = formData.get("namaEvent") as string;
    const jenisEvent = formData.get("jenisEvent") as string;
    const tanggalPelaksanaan = formData.get("tanggalPelaksanaan") as string;
    const waktuMulai = formData.get("waktuMulai") as string;
    const waktuSelesai = formData.get("waktuSelesai") as string;
    const lokasi = formData.get("lokasi") as string;
    const biayaEvent = formData.get("biayaEvent") as string;
    const statusEvent = formData.get("statusEvent") as string;
    const gambarUrl = formData.get("gambarUrl") as string;

    // Memasukkan data ke tabel events menggunakan Drizzle ORM
    await getDb().insert(events).values({
      namaEvent,
      jenisEvent,
      tanggalPelaksanaan,
      waktuMulai: waktuMulai || null,
      waktuSelesai: waktuSelesai || null,
      lokasi,
      biayaEvent: biayaEvent || "0",
      statusEvent,
      gambarUrl: gambarUrl || null,
    });

    // Mengarahkan user kembali ke halaman daftar event setelah sukses
    redirect("/admin/events");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/admin/events" 
          className="text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition"
        >
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Buat Event Baru</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        {/* Form menggunakan action yang mengarah ke Server Action */}
        <form action={simpanEvent} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Event */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Event *
              </label>
              <input
                type="text"
                name="namaEvent"
                required
                placeholder="Contoh: Workshop Copywriting for Beginners"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Jenis Event */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis / Kategori Event *
              </label>
              <input
                type="text"
                name="jenisEvent"
                required
                placeholder="Contoh: Workshop & Pelatihan"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Biaya Event */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biaya Event (Rp) *
              </label>
              <input
                type="number"
                name="biayaEvent"
                min="0"
                required
                placeholder="0 untuk gratis"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Tanggal Pelaksanaan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Pelaksanaan *
              </label>
              <input
                type="date"
                name="tanggalPelaksanaan"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Jam Pelaksanaan */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jam Mulai
                </label>
                <input
                  type="time"
                  name="waktuMulai"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Lokasi */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue & Lokasi *
              </label>
              <input
                type="text"
                name="lokasi"
                required
                placeholder="Contoh: JIExpo Kemayoran, Jakarta Pusat"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Link Gambar / Poster */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Poster / Gambar
              </label>
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
            {/* Pilihan untuk langsung aktif atau simpan sebagai draft */}
            <select 
              name="statusEvent" 
              className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none text-sm font-medium text-gray-700"
            >
              <option value="draft">Simpan sebagai Draft</option>
              <option value="aktif">Langsung Tayangkan (Aktif)</option>
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
