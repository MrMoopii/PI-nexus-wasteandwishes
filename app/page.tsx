"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─── Plate data dokumentasi & event ── */
const PLATES = [
  {
    img: "/img/event/1.jpg",
    title: "Sosialisasi Pemilahan Sampah",
    desc: "Kegiatan sosialisasi cara memilah sampah organik dan anorganik bersama warga di wilayah Wedomartani.",
    alt: "Wedomartani",
    month: "Maret",
    stock: "Kegiatan Edukasi",
  },
  {
    img: "/img/event/2.jpg",
    title: "Pelatihan Budidaya Maggot BSF",
    desc: "Workshop intensif budidaya maggot Black Soldier Fly bersama para peternak dan warga UMKM lokal.",
    alt: "Gejayan",
    month: "April",
    stock: "Workshop",
  },
  {
    img: "/img/event/3.jpg",
    title: "Aksi Bersih Lingkungan",
    desc: "Gerakan kerelawanan aksi bersih lingkungan di sekitar kawasan Gejayan bersama ratusan relawan muda.",
    alt: "Gejayan",
    month: "Mei",
    stock: "Gerakan Sosial",
  },
  {
    img: "/img/event/4.jpg",
    title: "Panen Maggot & Pakan Ternak",
    desc: "Panen perdana maggot BSF yang diolah menjadi pakan ternak berkualitas tinggi dan bernilai ekonomi.",
    alt: "Kranggan",
    month: "Juni",
    stock: "Panen Raya",
  },
  {
    img: "/img/event/5.jpg",
    title: "Festival Hijau Waste & Wishes",
    desc: "Festival tahunan Waste & Wishes merayakan pencapaian pengelolaan limbah organik bersama komunitas.",
    alt: "Yogyakarta",
    month: "Oktober",
    stock: "Festival",
  },
];

/* ─── Komponen Statistik Animasi Angka ─── */
interface AnimatedCounterProps {
  value: number;
  suffix: string;
  duration?: number;
  className?: string;
}

function AnimatedCounter({
  value,
  suffix,
  duration = 1400,
  className = "text-(--hx-accent) text-3xl sm:text-4xl font-semibold",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  const elementRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start: number | null = null;
          const startValue = 0;

          const animate = (timestamp: number) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const nextValue = Math.round(startValue + (value - startValue) * eased);
            setCount(nextValue);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [duration, value]);

  return (
    <h3
      ref={elementRef}
      className={`font-(family-name:--font-plus-jakarta-sans) tracking-tight ${className}`}
    >
      {count}
      {suffix}
    </h3>
  );
}

/* ─── Komponen Event Slider (Gaya Drag Helix Drift 3D) ─── */
function EventSlider() {
  const stageRef = useRef<HTMLDivElement>(null);
  const capElRef = useRef<HTMLElement>(null);
  const capNoRef = useRef<HTMLSpanElement>(null);
  const capTitleRef = useRef<HTMLHeadingElement>(null);
  const capDescRef = useRef<HTMLParagraphElement>(null);
  const capMetaRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const scrubFillRef = useRef<HTMLDivElement>(null);
  const ticksRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const scrubLabRef = useRef<HTMLDivElement>(null);

  const stepPrevRef = useRef<() => void>(() => {});
  const stepNextRef = useRef<() => void>(() => {});

  useEffect(() => {
    const STEP = 0.34;
    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = PLATES.length;

    if (
      !stageRef.current ||
      !capElRef.current ||
      !capNoRef.current ||
      !capTitleRef.current ||
      !capDescRef.current ||
      !capMetaRef.current ||
      !scrubRef.current ||
      !scrubFillRef.current ||
      !ticksRef.current ||
      !thumbRef.current ||
      !scrubLabRef.current
    ) {
      return;
    }

    const stage = stageRef.current;
    const capEl = capElRef.current;
    const capNo = capNoRef.current;
    const capTitle = capTitleRef.current;
    const capDesc = capDescRef.current;
    const capMeta = capMetaRef.current;
    const scrub = scrubRef.current;
    const scrubFill = scrubFillRef.current;
    const ticksBox = ticksRef.current;
    const thumb = thumbRef.current;
    const scrubLab = scrubLabRef.current;

    ticksBox.innerHTML = "";

    const plateEls = stage.querySelectorAll<HTMLDivElement>(".hx-plate");
    const plates: { el: HTMLDivElement; media: HTMLSpanElement }[] = [];
    const ticks: HTMLElement[] = [];

    plateEls.forEach((el, i) => {
      const media = el.querySelector<HTMLSpanElement>(".hx-plate-media")!;
      plates.push({ el, media });

      media.style.backgroundImage = `url('${PLATES[i].img}')`;

      const tk = document.createElement("i");
      tk.className = "hx-tick";
      tk.style.left = `${(i / (N - 1)) * 100}%`;
      ticksBox.appendChild(tk);
      ticks.push(tk);
    });

    let pos = 0;
    let target = 0;
    let raf = 0;
    let running = false;
    let settled = -1;
    let RX = 600;
    let RY = 54;
    let FALL = 0.52;
    let range = 5;

    function readVars() {
      const cs = getComputedStyle(document.documentElement);
      const num = (n: string, fb: number) => {
        const v = parseFloat(cs.getPropertyValue(n));
        return isNaN(v) ? fb : v;
      };
      RX = num("--hx-rx", 600);
      RY = num("--hx-ry", 54);
      FALL = num("--hx-fall", 0.52);
    }
    readVars();

    function readRange() {
      range = window.innerWidth < 900 ? 3 : 5;
    }
    readRange();

    function render() {
      let near = 999;
      let nearI = 0;

      for (let i = 0; i < N; i++) {
        const p = plates[i];
        if (!p) continue;

        const d = ((i - pos + N / 2 + N * 2) % N) - N / 2;
        const a = Math.abs(d);

        if (a > range + 0.5) {
          if (p.el.style.display !== "none") p.el.style.display = "none";
          continue;
        }
        if (p.el.style.display === "none") p.el.style.display = "";
        if (a < near) {
          near = a;
          nearI = i;
        }

        const th = d * STEP;
        const curRx = Math.min(RX, window.innerWidth * 0.48);
        const x = Math.sin(th) * curRx;
        const y = -Math.sin(d * 0.9) * RY;
        const rotY = -th * 57.2958 * 0.85;
        const rotZ = d * 1.4;
        const sc = Math.max(0.36, 1 / (1 + FALL * Math.pow(a, 1.15)));
        const op = Math.max(0.14, 1 - 0.34 * a);
        const sat = 0.28 + 0.72 / (1 + 0.9 * a);
        const bl =
          a < 1.6 || window.innerWidth < 900 ? 0 : Math.min(2.2, (a - 1.6) * 1.1);

        p.el.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(
          2
        )}px,${y.toFixed(2)}px,0) rotateY(${rotY.toFixed(
          2
        )}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        p.el.style.opacity = op.toFixed(3);
        p.el.style.zIndex = String(Math.round(1000 - a * 10));
        p.media.style.filter = `saturate(${sat.toFixed(3)})${
          bl ? ` blur(${bl.toFixed(2)}px)` : ""
        }`;
        p.el.classList.toggle("is-centre", a < 0.5);
      }

      paintScrub();
      if (nearI !== settled) setCaption(nearI);
    }

    function loop() {
      pos += (target - pos) * 0.14;
      if (Math.abs(target - pos) < 0.0004) {
        pos = target;
        running = false;
        render();
        return;
      }
      render();
      raf = requestAnimationFrame(loop);
    }

    function kick() {
      if (target > N * 2 || target < -N * 2) {
        const k = Math.round(target / N) * N;
        target -= k;
        pos -= k;
      }
      if (REDUCED) {
        pos = target;
        render();
        return;
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    }

    stepPrevRef.current = () => {
      target = Math.round(target) - 1;
      kick();
    };

    stepNextRef.current = () => {
      target = Math.round(target) + 1;
      kick();
    };

    let swapTimer = 0;
    function setCaption(i: number) {
      settled = i;
      const pl = PLATES[i];
      if (!pl) return;

      window.clearTimeout(swapTimer);
      capEl.classList.add("hx-swap");

      swapTimer = window.setTimeout(() => {
        capNo.textContent = String(i + 1).padStart(2, "0");
        capTitle.textContent = pl.title;
        capDesc.textContent = pl.desc;
        // Tipografi murni Helix Drift tanpa ikon/emoji
        capMeta.innerHTML = `<span>${pl.alt}</span><span>${pl.month}</span><span>${pl.stock}</span>`;
        capEl.classList.remove("hx-swap");
      }, REDUCED ? 0 : 160);

      scrub.setAttribute("aria-valuenow", String(i + 1));
      scrub.setAttribute("aria-valuetext", `${i + 1} dari ${N}, ${pl.title}`);
      scrubLab.textContent = `${String(i + 1).padStart(2, "0")} / 0${N}`;
      ticks.forEach((tk, k) => tk.classList.toggle("on", k === i));
    }

    function ringPos() {
      return ((pos % N) + N) % N;
    }

    function paintScrub() {
      const v = ringPos();
      let frac = v <= N - 1 ? v / (N - 1) : 1 - (v - (N - 1));
      frac = Math.max(0, Math.min(1, frac));
      scrubFill.style.width = `${frac * 100}%`;
      thumb.style.left = `${frac * scrub.clientWidth}px`;
    }

    function scrubTo(clientX: number) {
      const r = scrub.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      const want = frac * (N - 1);
      target = want + Math.round((pos - want) / N) * N;
      kick();
    }

    let scrubbing = false;
    const endScrub = (e?: PointerEvent) => {
      if (!scrubbing) return;
      scrubbing = false;
      try {
        if (e?.pointerId !== undefined) scrub.releasePointerCapture(e.pointerId);
      } catch {}
      target = Math.round(target);
      kick();
    };

    const onScrubDown = (e: PointerEvent) => {
      scrubbing = true;
      try {
        scrub.setPointerCapture(e.pointerId);
      } catch {}
      scrubTo(e.clientX);
      e.preventDefault();
    };

    const onScrubMove = (e: PointerEvent) => {
      if (scrubbing) scrubTo(e.clientX);
    };

    scrub.addEventListener("pointerdown", onScrubDown);
    scrub.addEventListener("pointermove", onScrubMove);
    scrub.addEventListener("pointerup", endScrub as EventListener);
    scrub.addEventListener("pointercancel", endScrub as EventListener);
    window.addEventListener("pointerup", endScrub as EventListener);

    let down = false;
    let startX = 0;
    let startT = 0;
    let lastX = 0;
    let lastT = 0;
    let vel = 0;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      down = true;
      moved = false;
      startX = lastX = e.clientX;
      startT = target;
      lastT = performance.now();
      vel = 0;
      stage.classList.add("grabbing");
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {}
    };

    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      target = startT - dx / ((plates[0]?.el.offsetWidth || 400) * 0.62);
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) {
        vel = (e.clientX - lastX) / dt;
        lastX = e.clientX;
        lastT = now;
      }
      kick();
    };

    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      stage.classList.remove("grabbing");
      try {
        if (e?.pointerId !== undefined) stage.releasePointerCapture(e.pointerId);
      } catch {}
      const flick = Math.max(-2.2, Math.min(2.2, -vel * 0.34));
      target = Math.round(target + flick);
      kick();
    };

    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp as EventListener);
    stage.addEventListener("pointercancel", onUp as EventListener);
    window.addEventListener("pointerup", onUp as EventListener);
    stage.addEventListener("dragstart", (e) => e.preventDefault());

    plates.forEach((p, i) => {
      p.el.addEventListener("click", () => {
        if (moved) return;
        const d = ((i - pos + N / 2 + N * 2) % N) - N / 2;
        if (Math.abs(d) < 0.5) {
          p.el.classList.add("press");
          setTimeout(() => p.el.classList.remove("press"), 140);
          return;
        }
        target = Math.round(pos + d);
        kick();
      });
    });

    let rt = 0;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => {
        readVars();
        readRange();
        render();
      }, 120);
    };
    window.addEventListener("resize", onResize);

    setCaption(0);
    render();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(swapTimer);
      window.clearTimeout(rt);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerup", endScrub as EventListener);
      window.removeEventListener("pointerup", onUp as EventListener);
      scrub.removeEventListener("pointerdown", onScrubDown);
      scrub.removeEventListener("pointermove", onScrubMove);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section className="relative py-16 md:py-24 border-y border-(--hx-pastel)/40">
      <div className="container mx-auto px-4 mb-8 text-center max-w-3xl">
        <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
          Dokumentasi Kegiatan
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
          Galeri &amp; Event Terbaru
        </h2>
        <p className="mt-3 text-base text-(--hx-ink-2) leading-relaxed">
          Geser atau seret gambar ke kiri dan kanan untuk melihat dokumentasi aksi nyata kami bersama komunitas.
        </p>
        <div className="mx-auto bg-(--hx-accent) h-0.5 w-16 rounded-full mt-4" />
      </div>

      {/* 3D Spool Stage (Helix Drift) */}
      <div
        className="hx-stage select-none"
        ref={stageRef}
        role="group"
        aria-label="Galeri foto kegiatan — geser kiri/kanan untuk menjelajahi"
      >
        {PLATES.map((pl, i) => (
          <div
            key={i}
            className="hx-plate"
            role="button"
            tabIndex={0}
            aria-label={`Foto ${i + 1}, ${pl.title}`}
          >
            <span className="hx-plate-media" />
            <span className="hx-plate-no">
              {String(i + 1).padStart(2, "0")} / 0{PLATES.length}
            </span>
            <div className="hx-plate-info">
              <h2>{pl.title}</h2>
              <p>{pl.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Caption Section (Gaya Murni Helix Drift) */}
      <section className="hx-caption" ref={capElRef} aria-live="polite">
        <div className="hx-cap-head">
          <span
            className="hx-cap-no font-normal text-(--hx-accent)"
            ref={capNoRef}
          >
            01
          </span>
          <span className="hx-cap-rule" />
          <h3
            className="hx-cap-title text-(--hx-ink)"
            ref={capTitleRef}
          >
            {PLATES[0].title}
          </h3>
        </div>
        <p
          className="hx-cap-desc"
          ref={capDescRef}
        >
          {PLATES[0].desc}
        </p>
        <div className="hx-cap-meta" ref={capMetaRef}>
          <span>{PLATES[0].alt}</span>
          <span>{PLATES[0].month}</span>
          <span>{PLATES[0].stock}</span>
        </div>
      </section>

      {/* Scrub Bar */}
      <div className="hx-scrub-shell">
        <div
          className="hx-scrub"
          ref={scrubRef}
          role="slider"
          tabIndex={0}
          aria-label="Posisi galeri foto"
          aria-valuemin={1}
          aria-valuemax={PLATES.length}
          aria-valuenow={1}
        >
          <div className="hx-scrub-track" />
          <div className="hx-scrub-fill" ref={scrubFillRef} />
          <div className="hx-scrub-ticks" ref={ticksRef} />
          <div className="hx-thumb" ref={thumbRef}>
            <i />
            <i />
          </div>
        </div>
        <div
          className="hx-scrub-label"
          ref={scrubLabRef}
        >
          01 / 0{PLATES.length}
        </div>
      </div>

      {/* Tombol Navigasi Khas Helix Drift (Capsule Transport Pill) */}
      <div className="mt-10 flex items-center justify-center px-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-(--hx-pastel) bg-white/90 backdrop-blur-md p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => stepPrevRef.current()}
            className="h-8 w-8 rounded-full border border-(--hx-pastel) bg-white text-xs font-semibold text-(--hx-accent) hover:border-(--hx-accent) transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Foto sebelumnya"
          >
            ←
          </button>
          <Link
            href="/event"
            className="px-5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-(--hx-accent) hover:text-(--hx-accent-dark) transition-colors"
          >
            Lihat Agenda Event
          </Link>
          <button
            type="button"
            onClick={() => stepNextRef.current()}
            className="h-8 w-8 rounded-full border border-(--hx-pastel) bg-white text-xs font-semibold text-(--hx-accent) hover:border-(--hx-accent) transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Foto berikutnya"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Halaman Utama (Home Page) ─── */
export default function Home() {
  return (
    <div className="relative min-h-screen bg-(--hx-canvas) text-(--hx-ink) font-(family-name:--font-inter) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark) overflow-hidden">
      {/* Ambient gradient washes matching Helix Drift (identik dengan app/event/page) */}
      <div aria-hidden="true" className="hx-ambient-wash">
        <div className="hx-ambient-blob-1" />
        <div className="hx-ambient-blob-2" />
        <div className="hx-ambient-blob-3" />
      </div>

      <div className="relative z-10">
        {/* ══════════════════════════════════════════════════════════════
            1. BAGIAN ATAS (Hero Section): "Ubah Sampah Organik Menjadi Berkah"
           ══════════════════════════════════════════════════════════════ */}
        <section className="container mx-auto px-4 py-16 md:py-20 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Kolom Kiri: Copywriting & Call to Action */}
            <div>
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-3">
                Solusi Sirkular Ekonomi
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-6 leading-tight">
                Ubah Sampah Organik Menjadi{" "}
                <span className="text-(--hx-accent)">Berkah</span>
              </h1>

              <p className="text-base md:text-lg text-(--hx-ink-2) font-light mb-8 leading-relaxed max-w-xl">
                Waste &amp; Wishes hadir sebagai inisiatif nyata pengelolaan limbah
                organik rumah tangga dan UMKM di wilayah Gejayan serta Wedomartani.
                Melalui teknologi biokonversi maggot BSF (Black Soldier Fly), kami
                mengubah masalah sampah menjadi pakan ternak berprotein tinggi dan
                pupuk organik berkualitas demi bumi yang lebih lestari.
              </p>

              {/* Tombol Helix Drift Style (Pill, Uppercase, Flat Architectural) */}
              <div className="flex flex-wrap gap-4">
                <a
                  href="/langganan"
                  className="inline-flex items-center justify-center rounded-full bg-(--hx-accent) px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-(--hx-accent-dark) transition-colors shadow-xs"
                >
                  Mulai Berlangganan
                </a>
                <a
                  href="#layanan"
                  className="inline-flex items-center justify-center rounded-full border border-(--hx-pastel) bg-white/80 backdrop-blur-sm px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-(--hx-ink-2) hover:border-(--hx-accent) hover:text-(--hx-accent) hover:bg-white transition-colors"
                >
                  Pelajari Layanan
                </a>
              </div>
            </div>

            {/* Kolom Kanan: Kartu Sorotan Fitur (Gaya Helix Drift Card) */}
            <div>
              <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-8 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
                <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase mb-3">
                  Biokonversi Alami
                </span>
                <h3 className="text-2xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-3">
                  Teknologi untuk Kesehatan Bumi
                </h3>
                <p className="text-(--hx-ink-2) text-sm font-light leading-relaxed mb-6">
                  Setiap kilogram sampah organik yang disetorkan akan langsung
                  diurai tuntas oleh pasukan maggot BSF. Proses alami ini memangkas
                  produksi gas metana berbahaya di TPA sekaligus menghasilkan pupuk
                  kasgot bernutrisi dan pakan ternak mandiri berdaya saing tinggi.
                </p>
                <div className="rounded-lg bg-(--hx-canvas)/90 border border-(--hx-pastel)/50 px-4 py-2.5 text-xs text-(--hx-ink-2) font-medium inline-block">
                  Cakupan Wilayah: Wedomartani, Gejayan &amp; Sekitarnya
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            2. BAGIAN TENGAH (Event Slider): Komponen Galeri Helix Drift
           ══════════════════════════════════════════════════════════════ */}
        <EventSlider />

        {/* ══════════════════════════════════════════════════════════════
            3. BAGIAN BAWAH: Layanan Utama Kami & Statistik
           ══════════════════════════════════════════════════════════════ */}
        <section
          id="layanan"
          className="relative py-16 md:py-24 border-t border-(--hx-pastel)/40"
        >
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Header Layanan */}
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                Solusi Terpadu
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                Layanan Utama Kami
              </h2>
              <p className="mt-3 text-base text-(--hx-ink-2) leading-relaxed">
                Solusi terintegrasi dari Waste &amp; Wishes untuk menuntaskan krisis
                sampah organik dan menumbuhkan dampak ekonomi sirkular masyarakat.
              </p>
              <div className="mx-auto bg-(--hx-accent) h-0.5 w-16 rounded-full mt-4" />
            </div>

            {/* Grid Kartu Layanan */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* Card 1: Penjemputan Sampah Organik */}
              <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-7 md:p-8 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm transition hover:border-(--hx-accent)/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase">
                      01 / Penjemputan
                    </span>
                    <span className="rounded-full bg-white/90 border border-(--hx-pastel) px-3 py-0.5 text-[10px] font-semibold tracking-widest uppercase text-(--hx-accent)">
                      Paling Diminati
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-3">
                    Penjemputan Sampah Organik
                  </h3>
                  <p className="text-sm leading-relaxed text-(--hx-ink-2) font-light mb-6">
                    Layanan penjemputan terjadwal langsung dari depan pintu rumah
                    tangga, cafe, restoran, dan UMKM. Cukup pilah sampah dapur
                    Anda, armada kami akan menjemputnya secara berkala dengan
                    wadah bersih berstandar sanitasi.
                  </p>

                  {/* Fitur Layanan Tanpa Ikon */}
                  <ul className="space-y-2 mb-8 text-xs text-(--hx-ink-2) border-t border-(--hx-pastel)/30 pt-4">
                    <li>— Wadah ember khusus terstandar kedap bau &amp; anti bocor</li>
                    <li>— Jadwal penjemputan teratur &amp; terintegrasi sistem digital</li>
                    <li>— Laporan berkala volume sampah terkelola &amp; reduksi emisi</li>
                  </ul>
                </div>

                <div>
                  <a
                    href="/langganan"
                    className="inline-flex w-full items-center justify-center rounded-full bg-(--hx-accent) px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-(--hx-accent-dark) transition-colors sm:w-auto"
                  >
                    Cek Paket Langganan
                  </a>
                </div>
              </div>

              {/* Card 2: Edukasi & Pendampingan */}
              <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-7 md:p-8 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm transition hover:border-(--hx-accent)/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase">
                      02 / Edukasi
                    </span>
                    <span className="rounded-full bg-white/90 border border-(--hx-pastel) px-3 py-0.5 text-[10px] font-semibold tracking-widest uppercase text-(--hx-ink-2)">
                      Program Kolaborasi
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-3">
                    Edukasi &amp; Pendampingan
                  </h3>
                  <p className="text-sm leading-relaxed text-(--hx-ink-2) font-light mb-6">
                    Program pelatihan intensif mengenai teknik budidaya maggot
                    BSF, pembuatan pupuk organik padat dan cair, serta gerakan
                    gaya hidup minim sampah. Cocok bagi komunitas warga,
                    sekolah, institusi, maupun kelompok tani binaan.
                  </p>

                  {/* Fitur Layanan Tanpa Ikon */}
                  <ul className="space-y-2 mb-8 text-xs text-(--hx-ink-2) border-t border-(--hx-pastel)/30 pt-4">
                    <li>— Bimbingan teknis budidaya maggot dari telur sampai panen</li>
                    <li>— Panduan praktis pemilahan sampah organik langsung dari sumber</li>
                    <li>— Fasilitasi starter kit edukasi &amp; e-sertifikat kegiatan resmi</li>
                  </ul>
                </div>

                <div>
                  <a
                    href="/event"
                    className="inline-flex w-full items-center justify-center rounded-full border border-(--hx-pastel) bg-white/80 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-(--hx-ink-2) backdrop-blur-sm hover:border-(--hx-accent) hover:text-(--hx-accent) hover:bg-white transition-colors sm:w-auto"
                  >
                    Lihat Jadwal Terdekat
                  </a>
                </div>
              </div>
            </div>

            {/* ── Komponen Statistik (Facts Grid Khas Helix Drift seperti di app/event/page) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-(--hx-pastel)/40 rounded-2xl overflow-hidden border border-(--hx-pastel)/40 shadow-sm">
              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-6 sm:p-8 text-center">
                <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                  Limbah Organik Terolah
                </span>
                <AnimatedCounter value={18} suffix="+ Ton" />
                <span className="text-xs text-(--hx-ink-2) mt-1 block">
                  Tereduksi dari beban TPA Piyungan
                </span>
              </div>
              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-6 sm:p-8 text-center">
                <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                  Mitra Rumah Tangga &amp; UMKM
                </span>
                <AnimatedCounter value={250} suffix="+" />
                <span className="text-xs text-(--hx-ink-2) mt-1 block">
                  Warga &amp; pelaku usaha aktif
                </span>
              </div>
              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-6 sm:p-8 text-center">
                <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                  Event Edukasi Terlaksana
                </span>
                <AnimatedCounter value={45} suffix="+" />
                <span className="text-xs text-(--hx-ink-2) mt-1 block">
                  Workshop, sosialisasi &amp; aksi bersih
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
