"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = "waste-wishes:last-activity";
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

export default function SessionIdleTimeout() {
  useEffect(() => {
    let timeout: number;
    let signingOut = false;

    const logoutForInactivity = async () => {
      if (signingOut) return;
      signingOut = true;
      window.localStorage.removeItem(LAST_ACTIVITY_KEY);
      await signOut({ redirectTo: "/auth/login?reason=idle" });
    };

    const scheduleTimeout = (lastActivity: number) => {
      window.clearTimeout(timeout);
      const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivity);
      if (remaining <= 0) {
        void logoutForInactivity();
      } else {
        timeout = window.setTimeout(() => void logoutForInactivity(), remaining);
      }
    };

    const recordActivity = () => {
      const now = Date.now();
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      scheduleTimeout(now);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY) return;
      const lastActivity = Number(event.newValue);
      if (Number.isFinite(lastActivity) && lastActivity > 0) {
        scheduleTimeout(lastActivity);
      }
    };

    const lastActivity = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY));
    if (Number.isFinite(lastActivity) && lastActivity > 0) {
      scheduleTimeout(lastActivity);
    } else {
      recordActivity();
    }

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, recordActivity, { passive: true }),
    );
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearTimeout(timeout);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, recordActivity),
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
