"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ─── Bentuk data event untuk slider (dikirim dari app/page.tsx) ─── */
export type SliderEvent = {
  id: string | number;
  judul: string;
  deskripsi: string;
  gambarUrl: string | null;
  lokasi: string;
  tanggal: string;
  jenis: string;
};

interface EventSliderProps {
  events: SliderEvent[];
  loggedIn: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");

/* ─── Komponen Event Slider (Gaya Drag Helix Drift 3D) ─── */
export default function EventSlider({ events, loggedIn }: EventSliderProps) {
  const router = useRouter();

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
    const N = events.length;
    if (N === 0) return;

    const STEP = 0.34;
    const REDUCED = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

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

    // Semua listener dilepas sekaligus lewat ac.abort() saat cleanup
    const ac = new AbortController();
    const opts = { signal: ac.signal };

    ticksBox.innerHTML = "";

    const plateEls = stage.querySelectorAll<HTMLDivElement>(".hx-plate");
    const plates: { el: HTMLDivElement; media: HTMLSpanElement }[] = [];
    const ticks: HTMLElement[] = [];

    plateEls.forEach((el, i) => {
      const media = el.querySelector<HTMLSpanElement>(".hx-plate-media")!;
      plates.push({ el, media });

      const tk = document.createElement("i");
      tk.className = "hx-tick";
      tk.style.left = N > 1 ? `${(i / (N - 1)) * 100}%` : "0%";
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
          a < 1.6 || window.innerWidth < 900
            ? 0
            : Math.min(2.2, (a - 1.6) * 1.1);

        p.el.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(
          2,
        )}px,${y.toFixed(2)}px,0) rotateY(${rotY.toFixed(
          2,
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

    /* ── Autoplay: geser otomatis setiap 10 detik ── */
    const AUTO_MS = 10000;
    let autoTimer = 0;

    function startAuto() {
      window.clearInterval(autoTimer);
      if (REDUCED || N < 2) return;
      autoTimer = window.setInterval(() => {
        if (document.hidden) return;
        target = Math.round(target) + 1;
        kick();
      }, AUTO_MS);
    }

    stepPrevRef.current = () => {
      target = Math.round(target) - 1;
      kick();
      startAuto();
    };

    stepNextRef.current = () => {
      target = Math.round(target) + 1;
      kick();
      startAuto();
    };

    /* ── Klik gambar utama → halaman detail event ──
       Belum login → ke halaman login dulu, lalu kembali ke detail event. */
    function goDetail(i: number) {
      const dest = `/event/detail/${events[i].id}`;
      router.push(
        loggedIn
          ? dest
          : `/auth/login?callbackUrl=${encodeURIComponent(dest)}`,
      );
    }

    /* Gambar di tengah → buka detail. Gambar di samping → geser ke tengah. */
    function activate(i: number) {
      startAuto();
      const d = ((i - pos + N / 2 + N * 2) % N) - N / 2;
      if (Math.abs(d) < 0.5) {
        const el = plates[i].el;
        el.classList.add("press");
        window.setTimeout(() => el.classList.remove("press"), 140);
        goDetail(i);
        return;
      }
      target = Math.round(pos + d);
      kick();
    }

    let swapTimer = 0;
    function setCaption(i: number) {
      settled = i;
      const ev = events[i];
      if (!ev) return;

      window.clearTimeout(swapTimer);
      capEl.classList.add("hx-swap");

      swapTimer = window.setTimeout(
        () => {
          capNo.textContent = pad(i + 1);
          capTitle.textContent = ev.judul;
          capDesc.textContent = ev.deskripsi;
          // textContent (bukan innerHTML) agar data dari database aman
          capMeta.replaceChildren(
            ...[ev.lokasi, ev.tanggal, ev.jenis].map((t) => {
              const s = document.createElement("span");
              s.textContent = t;
              return s;
            }),
          );
          capEl.classList.remove("hx-swap");
        },
        REDUCED ? 0 : 160,
      );

      scrub.setAttribute("aria-valuenow", String(i + 1));
      scrub.setAttribute("aria-valuetext", `${i + 1} dari ${N}, ${ev.judul}`);
      scrubLab.textContent = `${pad(i + 1)} / ${pad(N)}`;
      ticks.forEach((tk, k) => tk.classList.toggle("on", k === i));
    }

    function ringPos() {
      return ((pos % N) + N) % N;
    }

    function paintScrub() {
      let frac = 0;
      if (N > 1) {
        const v = ringPos();
        frac = v <= N - 1 ? v / (N - 1) : 1 - (v - (N - 1));
        frac = Math.max(0, Math.min(1, frac));
      }
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
        if (e?.pointerId !== undefined)
          scrub.releasePointerCapture(e.pointerId);
      } catch {}
      target = Math.round(target);
      kick();
    };

    const onScrubDown = (e: PointerEvent) => {
      startAuto();
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

    scrub.addEventListener("pointerdown", onScrubDown, opts);
    scrub.addEventListener("pointermove", onScrubMove, opts);
    scrub.addEventListener("pointerup", endScrub as EventListener, opts);
    scrub.addEventListener("pointercancel", endScrub as EventListener, opts);
    window.addEventListener("pointerup", endScrub as EventListener, opts);

    let down = false;
    let startX = 0;
    let startT = 0;
    let lastX = 0;
    let lastT = 0;
    let vel = 0;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      startAuto();
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
        if (e?.pointerId !== undefined)
          stage.releasePointerCapture(e.pointerId);
      } catch {}

      /* Tap/klik (bukan drag): cari gambar di titik klik.
         Dilakukan di sini karena pointer capture membuat event click
         tidak sampai ke masing-masing gambar. */
      if (!moved && e.type === "pointerup") {
        const hit = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest<HTMLElement>(".hx-plate");
        const idx = hit ? plates.findIndex((p) => p.el === hit) : -1;
        if (idx >= 0) {
          activate(idx);
          return;
        }
      }

      const flick = Math.max(-2.2, Math.min(2.2, -vel * 0.34));
      target = Math.round(target + flick);
      kick();
    };

    stage.addEventListener("pointerdown", onDown, opts);
    stage.addEventListener("pointermove", onMove, opts);
    stage.addEventListener("pointerup", onUp as EventListener, opts);
    stage.addEventListener("pointercancel", onUp as EventListener, opts);
    window.addEventListener("pointerup", onUp as EventListener, opts);
    stage.addEventListener("dragstart", (e) => e.preventDefault(), opts);

    /* Akses keyboard: Enter / Spasi pada gambar */
    plates.forEach((p, i) => {
      p.el.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activate(i);
          }
        },
        opts,
      );
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
    window.addEventListener("resize", onResize, opts);

    setCaption(0);
    render();
    startAuto();

    return () => {
      ac.abort();
      window.clearInterval(autoTimer);
      cancelAnimationFrame(raf);
      window.clearTimeout(swapTimer);
      window.clearTimeout(rt);
    };
  }, [events, loggedIn, router]);

  const total = events.length;

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
          Geser atau seret gambar ke kiri dan kanan untuk melihat event kami.
          Klik gambar di tengah untuk membuka detail event.
        </p>
        <div className="mx-auto bg-(--hx-accent) h-0.5 w-16 rounded-full mt-4" />
      </div>

      {total === 0 ? (
        <p className="px-4 text-center text-sm text-(--hx-ink-2)">
          Belum ada event yang tersedia.
        </p>
      ) : (
        <>
          {/* 3D Spool Stage (Helix Drift) */}
          <div
            className="hx-stage select-none"
            ref={stageRef}
            role="group"
            aria-label="Galeri event — geser kiri/kanan untuk menjelajahi"
          >
            {events.map((ev, i) => (
              <div
                key={ev.id}
                className="hx-plate"
                role="button"
                tabIndex={0}
                aria-label={`Event ${i + 1}, ${ev.judul}`}
              >
                <span
                  className="hx-plate-media"
                  style={
                    ev.gambarUrl
                      ? { backgroundImage: `url(${JSON.stringify(ev.gambarUrl)})` }
                      : undefined
                  }
                />
                <span className="hx-plate-no">
                  {pad(i + 1)} / {pad(total)}
                </span>
                <div className="hx-plate-info">
                  <h2>{ev.judul}</h2>
                  <p>{ev.deskripsi}</p>
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
              <h3 className="hx-cap-title text-(--hx-ink)" ref={capTitleRef}>
                {events[0].judul}
              </h3>
            </div>
            <p className="hx-cap-desc" ref={capDescRef}>
              {events[0].deskripsi}
            </p>
            <div className="hx-cap-meta" ref={capMetaRef}>
              <span>{events[0].lokasi}</span>
              <span>{events[0].tanggal}</span>
              <span>{events[0].jenis}</span>
            </div>
          </section>

          {/* Scrub Bar */}
          <div className="hx-scrub-shell">
            <div
              className="hx-scrub"
              ref={scrubRef}
              role="slider"
              tabIndex={0}
              aria-label="Posisi galeri event"
              aria-valuemin={1}
              aria-valuemax={total}
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
            <div className="hx-scrub-label" ref={scrubLabRef}>
              01 / {pad(total)}
            </div>
          </div>
        </>
      )}

      {/* Tombol Navigasi Khas Helix Drift (Capsule Transport Pill) */}
      <div className="mt-10 flex items-center justify-center px-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-(--hx-pastel) bg-white/90 backdrop-blur-md p-1.5 shadow-xs">
          {total > 1 && (
            <button
              type="button"
              onClick={() => stepPrevRef.current()}
              className="h-8 w-8 rounded-full border border-(--hx-pastel) bg-white text-xs font-semibold text-(--hx-accent) hover:border-(--hx-accent) transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Event sebelumnya"
            >
              ←
            </button>
          )}
          <Link
            href="/event"
            className="px-5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-(--hx-accent) hover:text-(--hx-accent-dark) transition-colors"
          >
            Lihat Agenda Event
          </Link>
          {total > 1 && (
            <button
              type="button"
              onClick={() => stepNextRef.current()}
              className="h-8 w-8 rounded-full border border-(--hx-pastel) bg-white text-xs font-semibold text-(--hx-accent) hover:border-(--hx-accent) transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Event berikutnya"
            >
              →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
