"use client";

import { type EventRingkas } from "./EventDrawer";

export default function EventCalendarWidget({
  eventDates,
  today,
  viewYear,
  viewMonth,
  onMonthChange,
}: {
  eventDates: string[];
  today: string;
  viewYear: number;
  viewMonth: number;
  onMonthChange: (year: number, month: number) => void;
}) {
  const initialDate = new Date(`${today}T00:00:00Z`);
  const todayYear = initialDate.getUTCFullYear();
  const todayMonth = initialDate.getUTCMonth();
  const eventDateSet = new Set(eventDates);

  const canGoBack = viewYear > todayYear || (viewYear === todayYear && viewMonth > todayMonth);

  const prevMonth = () => {
    if (viewMonth === 0) {
      onMonthChange(viewYear - 1, 11);
    } else {
      onMonthChange(viewYear, viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      onMonthChange(viewYear + 1, 0);
    } else {
      onMonthChange(viewYear, viewMonth + 1);
    }
  };

  const currentDate = new Date(Date.UTC(viewYear, viewMonth, 1));
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(currentDate);

  return (
    <aside className="h-fit rounded-2xl border border-(--hx-pastel) bg-white p-3 shadow-[0_8px_25px_rgb(27,34,51,0.05)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-semibold capitalize text-(--hx-ink)">
          {monthLabel}
        </h3>
        <span className="text-xs text-(--hx-ink-3)">Agenda</span>
      </div>

      <div className="grid grid-cols-7 gap-y-3 text-center text-xs">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
          <span key={day} className="font-semibold text-(--hx-ink-3)">
            {day}
          </span>
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEvent = eventDateSet.has(dateKey);
          const isToday = dateKey === today;
          const isPast = dateKey < today;

          return (
            <span
              key={dateKey}
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
                isToday
                  ? "bg-(--hx-accent) font-bold text-white"
                  : "text-(--hx-ink-2)"
              }`}
            >
              {day}
              {hasEvent && !isPast && !isToday && (
                <span
                  title={isPast ? "Event sudah terlewat" : "Event akan datang"}
                  className={`absolute bottom-0.5 h-1.5 w-1.5 rounded-full ${
                    isPast
                      ? "bg-(--hx-ink-3)/70 ring-1 ring-white"
                      : "bg-(--hx-accent) ring-1 ring-(--hx-accent)/30"
                  }`}
                />
              )}
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-(--hx-sunk) p-1.5">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoBack}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
            canGoBack
              ? "text-(--hx-ink-2) hover:bg-white hover:text-(--hx-accent) hover:shadow-xs"
              : "text-(--hx-ink-3) cursor-not-allowed opacity-50"
          }`}
          aria-label="Bulan sebelumnya"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={nextMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-(--hx-ink-2) transition hover:bg-white hover:text-(--hx-accent) hover:shadow-xs"
          aria-label="Bulan berikutnya"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
}
