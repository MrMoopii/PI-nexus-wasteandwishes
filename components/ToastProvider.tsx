"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <>
      <style>{`
        @keyframes toastPop {
          0% {
            opacity: 0;
            transform: scale(0.85);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        [data-sonner-toast] {
          animation: toastPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border-radius: 1rem !important;
        }

        [data-sonner-toaster] {
          top: 50% !important;
          bottom: auto !important;
          left: 50% !important;
          right: auto !important;
          transform: translate(-50%, -50%) !important;
        }
      `}</style>

      <Toaster
        position="bottom-center"
        toastOptions={{
          className: "bg-white border border-(--hx-pastel) text-(--hx-ink) shadow-lg",
          descriptionClassName: "text-(--hx-ink-2)",
          duration: 3000,
          style: {
            background: "rgba(255, 255, 255, 0.95)",
            color: "var(--hx-ink)",
            border: "1px solid var(--hx-pastel)",
            borderRadius: "1rem",
            boxShadow: "0 20px 60px rgba(27, 34, 51, 0.15)",
            padding: "1.5rem",
            minWidth: "280px",
            backdropFilter: "blur(8px)",
          },
        }}
      />
    </>
  );
}