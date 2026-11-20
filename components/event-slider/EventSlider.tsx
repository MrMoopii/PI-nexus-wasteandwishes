"use client";

import { useEffect, useRef, useState } from "react";
import FadeInOnMount from "@/components/FadeInOnMount";

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

/* ─── Wrapper: preload semua gambar dulu, baru render slider ─── */
export default function EventSlider({ events, loggedIn }: EventSliderProps) {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    if (events.length === 0) {
      window.setTimeout(() => setImagesLoaded(true), 0);
      return;
    }

    const imageUrls = events
      .map((ev) => ev.gambarUrl)
      .filter((url): url is string => url !== null);

    if (imageUrls.length === 0) {
      window.setTimeout(() => setImagesLoaded(true), 0);
      return;
    }

    let loadedCount = 0;
    const totalImages = imageUrls.length;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        setImagesLoaded(true);
      }
    };

    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      if (img.complete) {
        checkAllLoaded();
      } else {
        img.onload = checkAllLoaded;
        img.onerror = checkAllLoaded; // Continue even if some images fail
      }
    });
  }, [events]);

  if (!imagesLoaded) {
    return (
      <section
        aria-busy="true"
        className="relative py-16 md:py-24 border-y border-(--hx-pastel)/40"
        style={{ visibility: "hidden", opacity: 0, pointerEvents: "none" }}
      >
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

        <span className="sr-only">Memuat gambar event…</span>

        <div className="flex h-[min(62vh,560px)] min-h-85 items-center justify-center px-4">
          <div className="h-[85%] w-full max-w-md rounded-2xl bg-(--hx-pastel)/40 animate-pulse" />
        </div>

        <div className="hx-caption animate-pulse">
          <div className="h-5 w-2/3 rounded bg-(--hx-pastel)/50" />
          <div className="mt-3 h-3 w-full rounded bg-(--hx-pastel)/40" />
          <div className="mt-2 h-3 w-5/6 rounded bg-(--hx-pastel)/40" />
        </div>
      </section>
    );
  }

  return <EventSliderContent events={events} loggedIn={loggedIn} />;
}

/* ─── Konten slider (semua hook selalu dipanggil karena hanya dirender
       setelah seluruh gambar siap) ─── */
function EventSliderContent({ events, loggedIn }: EventSliderProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const capElRef = useRef<HTMLElement>(null);
  const capTitleRef = useRef<HTMLHeadingElement>(null);
  const capDescRef = useRef<HTMLParagraphElement>(null);
  const capMetaRef = useRef<HTMLDivElement>(null);

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
      !capTitleRef.current ||
      !capDescRef.current ||
      !capMetaRef.current
    ) {
      return;
    }

    const stage = stageRef.current;
    const capEl = capElRef.current;
    const capTitle = capTitleRef.current;
    const capDesc = capDescRef.current;
    const capMeta = capMetaRef.current;

    // Semua listener dilepas sekaligus lewat ac.abort() saat cleanup
    const ac = new AbortController();
    const opts = { signal: ac.signal };

    const plateEls = stage.querySelectorAll<HTMLDivElement>(".hx-plate");
    const plates: { el: HTMLDivElement; media: HTMLSpanElement }[] = [];

    plateEls.forEach((el) => {
      const media = el.querySelector<HTMLSpanElement>(".hx-plate-media")!;
      plates.push({ el, media });
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
    const AUTO_MS = 2000;
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

    /* ── Klik gambar utama → halaman detail event (tanpa perlu login) ── */
    function goDetail(i: number) {
      window.location.href = `/event/detail/${events[i].id}`;
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
          capTitle.textContent = ev.judul;
          capDesc.textContent = ev.deskripsi;
          // textContent (bukan innerHTML) agar data dari database aman
          capMeta.replaceChildren(
            ...[
              `Lokasi: ${ev.lokasi}`,
              `Tanggal: ${ev.tanggal}`,
              `Tipe: ${ev.jenis}`,
            ].map((t) => {
              const s = document.createElement("span");
              s.textContent = t;
              return s;
            }),
          );
          capEl.classList.remove("hx-swap");
        },
        REDUCED ? 0 : 160,
      );
    }

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
  }, [events, loggedIn]);

  const total = events.length;

  return (
    <section className="relative py-16 md:py-24 border-y border-(--hx-pastel)/40">
      <FadeInOnMount waitForScroll delay={0}>
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
      </FadeInOnMount>

      <FadeInOnMount waitForScroll delay={150}>
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
                        ? {
                            backgroundImage: `url(${JSON.stringify(ev.gambarUrl)})`,
                          }
                        : undefined
                    }
                  />
                  <div className="hx-plate-info">
                    <h2>{ev.judul}</h2>
                    <p>{ev.deskripsi}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </FadeInOnMount>

      <FadeInOnMount waitForScroll delay={300}>
        <section className="hx-caption" ref={capElRef} aria-live="polite">
          <h3 className="hx-cap-title text-(--hx-accent)" ref={capTitleRef}>
            {events[0]?.judul}
          </h3>
          <p className="hx-cap-desc" ref={capDescRef}>
            {events[0]?.deskripsi}
          </p>
          <div className="hx-cap-meta" ref={capMetaRef}>
            <span>Lokasi: {events[0]?.lokasi}</span>
            <span>Tanggal: {events[0]?.tanggal}</span>
            <span>Tipe: {events[0]?.jenis}</span>
          </div>
        </section>
      </FadeInOnMount>
    </section>
  );
}
