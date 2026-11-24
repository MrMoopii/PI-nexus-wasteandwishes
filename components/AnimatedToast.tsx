"use client";

import { Toaster } from "sonner";

export function AnimatedToast() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        className: "bg-(--hx-canvas) border border-(--hx-pastel) text-(--hx-ink) shadow-md",
        descriptionClassName: "text-(--hx-ink-2)",
        duration: 3000,
        style: {
          background: "white",
          color: "var(--hx-ink)",
          border: "1px solid var(--hx-pastel)",
          borderRadius: "1rem",
          boxShadow: "0 20px 60px rgba(27, 34, 51, 0.15)",
          padding: "1.5rem",
          minWidth: "280px",
        },
      }}
    />
  );
}