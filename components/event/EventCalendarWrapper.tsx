"use client";

import { useState } from "react";
import EventTimelineClient, {
  type EventTimelineItem,
} from "./EventTimelineClient";
import EventCalendarWidget from "./EventCalendarWidget";

export default function EventCalendarWrapper({
  eventDates,
  today,
  timelineGroups,
}: {
  eventDates: string[];
  today: string;
  timelineGroups: { tanggal: string; label: string; events: EventTimelineItem[] }[];
}) {
  const initialDate = new Date(`${today}T00:00:00Z`);
  const todayYear = initialDate.getUTCFullYear();
  const todayMonth = initialDate.getUTCMonth();
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);
  const [scrollTargetTanggal, setScrollTargetTanggal] = useState<string | null>(null);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    // Prevent going back before today
    if (newYear < todayYear || (newYear === todayYear && newMonth < todayMonth)) {
      return;
    }
    setViewYear(newYear);
    setViewMonth(newMonth);

    // Find first event in the new month to scroll to
    const firstEventInMonth = timelineGroups.find((group) => {
      const groupDate = new Date(`${group.tanggal}T00:00:00Z`);
      return groupDate.getUTCFullYear() === newYear && groupDate.getUTCMonth() === newMonth;
    });
    if (firstEventInMonth) {
      setScrollTargetTanggal(firstEventInMonth.tanggal);
    } else {
      setScrollTargetTanggal(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <EventTimelineClient
        groups={timelineGroups}
        today={today}
        scrollTargetTanggal={scrollTargetTanggal}
      />

      <EventCalendarWidget
        eventDates={eventDates}
        today={today}
        viewYear={viewYear}
        viewMonth={viewMonth}
        onMonthChange={handleMonthChange}
      />
    </div>
  );
}