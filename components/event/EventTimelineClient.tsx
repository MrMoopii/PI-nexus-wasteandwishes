"use client";

import { useState } from "react";
import GambarEvent from "@/components/GambarEvent";
import EventDrawer, { type EventRingkas } from "./EventDrawer";

export type EventTimelineItem = EventRingkas & {
  waktuLabel: string;
};

export default function EventTimelineClient({
  groups,
  today,
}: {
  groups: { tanggal: string; label: string; events: EventTimelineItem[] }[];
  today: string;
}) {
  const [eventTerpilih, setEventTerpilih] = useState<EventRingkas | null>(null);

  return (
    <>
      <div className="space-y-9">
        {groups.map((group) => (
          <div key={group.tanggal} className="relative pl-7 sm:pl-10">
            <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-(--hx-accent) ring-4 ring-(--hx-accent)/15" />
            <div className="absolute left-1.5 top-5 bottom-[-2.25rem] border-l border-dashed border-(--hx-pastel-deep)" />
            <h3 className="mb-4 text-lg font-semibold capitalize text-(--hx-ink)">
              {group.label}
            </h3>
            <div className="space-y-4">
              {group.events.map((event) => {
                const isPast = event.tanggalPelaksanaan < today;

                return (
                  <button
                    key={event.idEvent}
                    type="button"
                    onClick={() => setEventTerpilih(event)}
                    className="group flex min-h-48 w-full flex-col-reverse justify-between gap-5 rounded-2xl border border-(--hx-pastel) bg-white p-5 text-left shadow-[0_8px_25px_rgb(27,34,51,0.05)] transition-shadow hover:shadow-[0_12px_30px_rgb(27,34,51,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-(--hx-accent) sm:flex-row"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-(--hx-ink-3)">
                        {event.waktuLabel}
                      </p>
                      <h4 className="mt-2 text-xl font-semibold leading-snug text-(--hx-ink) group-hover:text-(--hx-accent)">
                        {event.namaEvent}
                      </h4>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-(--hx-ink-2)">
                        {event.deskripsi || "Tidak ada deskripsi acara"}
                      </p>
                      <span
                        className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          isPast
                            ? "bg-(--hx-sunk) text-(--hx-ink-3)"
                            : "bg-(--hx-accent)/10 text-(--hx-accent-dark)"
                        }`}
                      >
                        {isPast ? "Pendaftaran ditutup" : event.jenisEvent}
                      </span>
                    </div>
                    <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-(--hx-sunk) sm:h-32 sm:w-44">
                      <GambarEvent
                        src={event.gambarUrl}
                        alt={event.namaEvent}
                        sizes="(max-width: 640px) 100vw, 176px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <EventDrawer
        event={eventTerpilih}
        isPast={Boolean(
          eventTerpilih && eventTerpilih.tanggalPelaksanaan < today,
        )}
        onClose={() => setEventTerpilih(null)}
      />
    </>
  );
}
