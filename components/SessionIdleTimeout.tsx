"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/session";

const IDLE_TIMEOUT_MS = SESSION_IDLE_TIMEOUT_MS;
const LAST_ACTIVITY_KEY = "waste-wishes:last-activity";
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;

export default function SessionIdleTimeout() {
  useEffect(() => {
    let timeout: number;
    let signingOut = false;
    let authenticated = false;
    let disposed = false;
    let lastSessionRefresh = 0;

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
      if (!authenticated) return;
      const now = Date.now();
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      scheduleTimeout(now);
      // Persist activity in the signed JWT so the server can enforce idle expiry.
      if (now - lastSessionRefresh >= 60 * 1000) {
        lastSessionRefresh = now;
        void fetch("/api/auth/activity", { method: "POST", cache: "no-store" }).then(
          (response) => {
            if (response.status === 401 && authenticated) {
              void logoutForInactivity();
            }
          },
        );
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY) return;
      const lastActivity = Number(event.newValue);
      if (Number.isFinite(lastActivity) && lastActivity > 0) {
        scheduleTimeout(lastActivity);
      }
    };

    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => {
        if (disposed) return;
        if (!response.ok) {
          if (response.status === 401) {
            void response.json().then((data) => {
              if (data.code === "SESSION_IDLE") void logoutForInactivity();
            });
          }
          return;
        }
        authenticated = true;
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
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, recordActivity),
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
