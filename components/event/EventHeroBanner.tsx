"use client";

import { useEffect, useState } from "react";
import GambarEvent from "@/components/GambarEvent";

export type HeroBannerEvent = {
  idEvent: number;
  namaEvent: string;
  jenisEvent: string;
  deskripsi: string | null;
  gambarUrl: string | null;
};

export default function EventHeroBanner({
  events,
}: {
  events: HeroBannerEvent[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (events.length <= 1) return;

    // Setiap 10 detik (10.000 ms) ganti ke event berikutnya
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
        setIsTransitioning(false);
      }, 350); // Waktu transisi fade
    }, 10000);

    return () => clearInterval(interval);
  }, [events.length]);

  const currentEvent = events[currentIndex] ?? null;

  return (
    <header className="mb-8">
      {/* Compact Banner Image */}
      <div className="relative aspect-24/9 sm:aspect-24/8 w-full overflow-hidden rounded-2xl border border-(--hx-pastel) bg-(--hx-sunk) shadow-[0_8px_25px_rgb(27,34,51,0.06)]">
        <div
          className={`h-full w-full transition-opacity duration-500 ease-in-out ${
            isTransitioning ? "opacity-30" : "opacity-100"
          }`}
        >
          <GambarEvent
            src={currentEvent?.gambarUrl ?? null}
            alt={currentEvent?.namaEvent ?? "Waste & Wishes Event"}
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
            preload
          />
        </div>

        {events.length > 1 && (
          <div className="absolute bottom-2 right-3 z-10 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 backdrop-blur-sm">
            {events.map((evt, idx) => (
              <button
                key={evt.idEvent}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1 rounded-full transition-all ${
                  idx === currentIndex
                    ? "w-3 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Lihat banner event ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="mt-4 px-2 sm:px-4">
        <div
          className={`transition-opacity duration-300 ease-in-out ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-(--hx-accent) mb-1">
            {currentEvent?.jenisEvent || "Agenda Komunitas"}
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) leading-tight">
            {currentEvent?.namaEvent || "Daftar Kegiatan & Aksi Hijau"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm sm:text-base text-(--hx-ink-2) font-light leading-relaxed">
            {currentEvent?.deskripsi ||
              "Inisiatif aksi hijau, edukasi keberlanjutan, dan pengelolaan sampah organik bersama Waste & Wishes."}
          </p>
        </div>
      </div>
    </header>
  );
}
