import Link from "next/link";

export default function EventSliderKerangka() {
  return (
    <section
      aria-busy="true"
      className="relative py-16 md:py-24 border-y border-(--hx-pastel)/40"
    >
      {/* Judul: statis, sama persis dengan EventSlider */}
      <div className="container mx-auto px-4 mb-8 text-center max-w-3xl">
        <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
          Dokumentasi Kegiatan
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
          Galeri &amp; Event Terbaru
        </h2>
        <p className="mt-3 text-base text-(--hx-ink-2) leading-relaxed">
          Geser atau seret gambar ke kiri dan kanan untuk melihat event kami.
          Klik gambar di tengah untuk membuka detail event.
        </p>
        <div className="mx-auto bg-(--hx-accent) h-0.5 w-16 rounded-full mt-4" />
      </div>

      <span className="sr-only">Memuat daftar event…</span>

      {/* Pengganti .hx-stage: tinggi min(62vh, 560px), minimal 340px */}
      <div className="flex h-[min(62vh,560px)] min-h-[340px] items-center justify-center px-4">
        <div className="h-[85%] w-full max-w-md rounded-2xl bg-(--hx-pastel)/40 animate-pulse" />
      </div>

      {/* Pengganti caption: class hx-caption memberi min-height 96px + margin yang sama */}
      <div className="hx-caption animate-pulse">
        <div className="h-5 w-2/3 rounded bg-(--hx-pastel)/50" />
        <div className="mt-3 h-3 w-full rounded bg-(--hx-pastel)/40" />
        <div className="mt-2 h-3 w-5/6 rounded bg-(--hx-pastel)/40" />
      </div>

      {/* Pengganti scrub bar: hx-scrub-shell memberi lebar & margin;
          isinya meniru tinggi bar (26px) + label (margin 0.7rem, teks 1.05rem) */}
      <div className="hx-scrub-shell animate-pulse">
        <div className="flex h-[26px] items-center">
          <div className="h-1 w-full rounded-full bg-(--hx-pastel)/60" />
        </div>
        <div className="mt-[0.7rem] flex h-[1.05rem] justify-center">
          <div className="h-full w-12 rounded bg-(--hx-pastel)/40" />
        </div>
      </div>

      {/* Kapsul navigasi: tombol ← → diganti lingkaran diam seukuran aslinya */}
      <div className="mt-10 flex items-center justify-center px-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-(--hx-pastel) bg-white/90 backdrop-blur-md p-1.5 shadow-xs">
          <span
            aria-hidden="true"
            className="h-8 w-8 rounded-full border border-(--hx-pastel) bg-white"
          />
          <Link
            href="/event"
            className="px-5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-(--hx-accent) hover:text-(--hx-accent-dark) transition-colors"
          >
            Lihat Agenda Event
          </Link>
          <span
            aria-hidden="true"
            className="h-8 w-8 rounded-full border border-(--hx-pastel) bg-white"
          />
        </div>
      </div>
    </section>
  );
}