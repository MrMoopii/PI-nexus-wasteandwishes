"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import GambarEvent from "@/components/GambarEvent";
import { LABEL_PERAN_WW, type PeranWw } from "@/features/event/types";

export type EventRingkas = {
  idEvent: number;
  namaEvent: string;
  jenisEvent: string;
  deskripsi: string | null;
  tanggalPelaksanaan: string;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  gambarUrl: string | null;
  lokasi?: string | null;
  penyelenggara?: string | null;
  peranWw?: PeranWw | null;
  tautanInfo?: string | null;
};

function formatTanggalRingkas(tanggal: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${tanggal}T00:00:00Z`));
}

function formatWaktuRingkas(
  waktuMulai: string | null,
  waktuSelesai: string | null,
): string {
  const mulai = waktuMulai?.slice(0, 5);
  const selesai = waktuSelesai?.slice(0, 5);

  if (mulai && selesai) return `${mulai} – ${selesai} WIB`;
  if (mulai) return `${mulai} WIB`;
  return "Waktu menyusul";
}

export default function EventDrawer({
  event,
  isPast,
  onClose,
}: {
  event: EventRingkas | null;
  isPast: boolean;
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Animasi membuka saat event terpilih
  useEffect(() => {
    if (!event) return;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const frame = requestAnimationFrame(() => {
      setIsOpen(true);
    });

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [event]);

  // Handler menutup dengan transisi halus keluar
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  // Listener tombol Escape
  useEffect(() => {
    if (!event) return;

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [event, handleClose]);

  if (!event) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-(--hx-ink)/35 p-0 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-drawer-title"
      onMouseDown={handleClose}
    >
      <section
        className={`h-full w-full max-w-xl overflow-y-auto border-l border-(--hx-pastel) bg-white shadow-[-16px_0_48px_rgb(27,34,51,0.18)] transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-(--hx-pastel) bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-7">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-(--hx-ink-3)">
            Ringkasan Event
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--hx-pastel) text-(--hx-ink-2) transition-colors hover:border-(--hx-accent) hover:text-(--hx-accent)"
            aria-label="Tutup ringkasan event"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeWidth={2}
                d="m6 6 12 12M18 6 6 18"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-7 p-5 sm:p-7">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-(--hx-sunk)">
            <GambarEvent
              src={event.gambarUrl}
              alt={event.namaEvent}
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
              preload
            />
          </div>

          <div>
            <span className="inline-flex rounded-full bg-(--hx-accent)/10 px-3 py-1 text-xs font-semibold text-(--hx-accent-dark)">
              {event.jenisEvent}
            </span>
            <h2
              id="event-drawer-title"
              className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-(--hx-ink)"
            >
              {event.namaEvent}
            </h2>
            {event.penyelenggara ? (
              <p className="mt-3 text-sm font-medium text-(--hx-ink-2)">
                Diselenggarakan oleh{" "}
                <span className="font-semibold">{event.penyelenggara}</span>
                {event.peranWw && (
                  <span className="ml-2 inline-flex rounded-full bg-(--hx-accent)/10 px-2 py-0.5 text-xs font-semibold text-(--hx-accent-dark)">
                    WW sebagai {LABEL_PERAN_WW[event.peranWw]}
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-3 text-sm font-medium text-(--hx-ink-2)">
                Diselenggarakan oleh Waste &amp; Wishes
              </p>
            )}
          </div>

          <div className="space-y-3 border-y border-(--hx-pastel) py-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-(--hx-ink-3)">
                  Tanggal
                </span>
                <p className="mt-1 text-sm font-semibold capitalize text-(--hx-ink)">
                  {formatTanggalRingkas(event.tanggalPelaksanaan)}
                </p>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-(--hx-ink-3)">
                  Waktu
                </span>
                <p className="mt-1 text-sm font-semibold text-(--hx-ink)">
                  {formatWaktuRingkas(event.waktuMulai, event.waktuSelesai)}
                </p>
              </div>
            </div>
            {event.lokasi && (
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-(--hx-ink-3)">
                  Lokasi
                </span>
                <p className="mt-1 text-sm text-(--hx-ink)">{event.lokasi}</p>
              </div>
            )}
          </div>

          <section className="rounded-2xl border border-(--hx-pastel) bg-(--hx-canvas) p-5">
            <h3 className="text-base font-semibold text-(--hx-ink)">
              Informasi Event
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-(--hx-ink-2)">
              {isPast
                ? "Event ini telah selesai."
                : "Buka detail untuk informasi lengkap dan tautan resmi kegiatan."}
            </p>
            <Link
              href={`/event/detail/${event.idEvent}`}
              className="hx-btn-primary mt-4 w-full justify-center"
            >
              Lihat Detail Event
            </Link>
          </section>

          {event.tautanInfo && (
            <section className="rounded-2xl border border-(--hx-pastel) bg-white p-5">
              <h3 className="text-base font-semibold text-(--hx-ink)">
                Informasi Lebih Lanjut
              </h3>
              <p className="mt-1 text-sm text-(--hx-ink-2)">
                Kunjungi halaman resmi kegiatan untuk informasi selengkapnya.
              </p>
              <a
                href={event.tautanInfo}
                target="_blank"
                rel="noopener noreferrer"
                className="hx-btn-outline mt-3 inline-flex w-full justify-center"
              >
                Buka Halaman Resmi Event
              </a>
            </section>
          )}

          <section>
            <h3 className="border-b border-(--hx-pastel) pb-3 text-base font-semibold text-(--hx-ink)">
              Tentang Event
            </h3>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-(--hx-ink-2)">
              {event.deskripsi || "Tidak ada deskripsi acara"}
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
