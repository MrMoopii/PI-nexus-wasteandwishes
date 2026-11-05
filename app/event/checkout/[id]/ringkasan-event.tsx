import GambarEvent from "@/components/GambarEvent";
import { formatTanggal } from "@/lib/format-tanggal";
import { events as eventsTable } from "@/lib/db/schema";

type Event = typeof eventsTable.$inferSelect;

export default function RingkasanEvent({ event }: { event: Event }) {
  const plateNo = String(event.idEvent).padStart(2, "0");

  return (
    <div className="lg:col-span-5 flex flex-col gap-6">
      <div className="rounded-2xl border border-(--hx-pastel)/50 bg-white/90 p-6 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
        <div className="relative aspect-16/10 w-full rounded-xl overflow-hidden bg-(--hx-sunk) border border-(--hx-pastel)/40 mb-5">
          <GambarEvent
            src={event.gambarUrl}
            alt={event.namaEvent}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            preload
          />
          <div className="hx-rim-highlight" />

          <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-semibold text-(--hx-accent) tracking-wider uppercase">
            Plate {plateNo}
          </div>
        </div>

        <span className="text-[10px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase block mb-1">
          Agenda Terpilih
        </span>
        <h2 className="text-xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) leading-snug">
          {event.namaEvent}
        </h2>

        <div className="mt-4 pt-4 border-t border-(--hx-sunk)/60 space-y-2 text-xs text-(--hx-ink-2)">
          <div className="flex items-center justify-between">
            <span className="text-(--hx-ink-3)">Tanggal:</span>
            <span className="font-medium text-(--hx-ink)">
              {formatTanggal(event.tanggalPelaksanaan) ||
                "Sesuai Jadwal Publikasi"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-(--hx-ink-3)">Lokasi:</span>
            <span className="font-medium text-(--hx-ink)">
              {event.lokasi || "Lokasi menyusul"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-(--hx-ink-3)">Status Tiket:</span>
            <span className="font-bold text-(--hx-accent)">
              Gratis (1 Slot)
            </span>
          </div>
        </div>
      </div>

      {/* Catatan Penting Sheet */}
      <div className="rounded-2xl border border-(--hx-pastel)/40 bg-[#E8F4F4]/60 p-5 text-xs text-(--hx-ink-2) leading-relaxed space-y-2">
        <strong className="text-(--hx-accent) font-semibold block">
          Petunjuk Registrasi
        </strong>
        <p>
          1. Tiket digital akan otomatis dicatat atas nama akun yang sedang
          aktif.
        </p>
        <p>
          2. Pengingat jadwal dan koordinasi teknis akan dihubungi via nomor
          WhatsApp terdaftar.
        </p>
      </div>
    </div>
  );
}
