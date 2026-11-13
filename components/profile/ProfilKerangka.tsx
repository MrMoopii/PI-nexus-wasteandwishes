"use client";

export default function ProfilKerangka() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-(--hx-canvas)">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120vw 90vh at 8% -10%, rgba(185, 205, 229, 0.55), transparent 62%), radial-gradient(110vw 80vh at 98% 108%, rgba(221, 231, 242, 0.85), transparent 60%)",
        }}
      />

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50 mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(150, 177, 208, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(150, 177, 208, 0.3) 1px, transparent 1px)",
          backgroundSize: "72px 72px, 72px 72px",
          maskImage:
            "radial-gradient(80vw 80vh at 50% 42%, #000 20%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(80vw 80vh at 50% 42%, #000 20%, transparent 82%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-sm border border-[rgba(150,177,208,0.35)] bg-white p-6 text-center">
              <div className="mx-auto mb-5 h-28 w-28 animate-pulse rounded-full border-2 border-[#96B1D0]/40 bg-gray-100" />
              <div className="mx-auto h-8 w-40 animate-pulse rounded bg-gray-200" />
              <div className="mx-auto mt-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mx-auto mt-6 h-11 w-32 animate-pulse rounded-sm border border-[#B9CDE5] bg-gray-100" />
            </section>

            <section className="rounded-sm border border-[rgba(150,177,208,0.35)] bg-white p-6">
              <div className="mb-4 h-6 w-36 animate-pulse rounded bg-gray-200" />
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-[rgba(150,177,208,0.35)] pt-5">
                <div className="mb-2 h-3 w-16 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              </div>
            </section>
          </aside>

          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm border border-[rgba(150,177,208,0.35)] bg-white p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="h-7 w-16 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="rounded-sm border border-[rgba(150,177,208,0.35)] bg-white p-6">
              <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-28 animate-pulse rounded-full bg-gray-100" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              </div>
            </section>

            <section className="rounded-sm border border-[rgba(150,177,208,0.35)] bg-white">
              <div className="border-b border-[rgba(150,177,208,0.35)] px-6 py-4">
                <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="space-y-0">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-[rgba(150,177,208,0.35)] px-6 py-4 last:border-b-0"
                  >
                    <div className="space-y-2">
                      <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
                    </div>
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}