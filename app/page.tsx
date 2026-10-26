"use client";

import { useEffect, useRef } from "react";

/* ─── Plate data (menggunakan gambar dari public/img/event) ── */
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

export default function Home() {
  /* ── refs ── */
  const stageRef      = useRef<HTMLDivElement>(null);
  const capElRef      = useRef<HTMLElement>(null);
  const capNoRef      = useRef<HTMLSpanElement>(null);
  const capTitleRef   = useRef<HTMLHeadingElement>(null);
  const capDescRef    = useRef<HTMLParagraphElement>(null);
  const capMetaRef    = useRef<HTMLDivElement>(null);
  const scrubRef      = useRef<HTMLDivElement>(null);
  const scrubFillRef  = useRef<HTMLDivElement>(null);
  const ticksRef      = useRef<HTMLDivElement>(null);
  const thumbRef      = useRef<HTMLDivElement>(null);
  const scrubLabRef   = useRef<HTMLDivElement>(null);
  const tpBtnRef      = useRef<HTMLButtonElement>(null);
  const tpFillRef     = useRef<HTMLElement>(null);
  const tpValRef      = useRef<HTMLSpanElement>(null);
  const tpMinusRef    = useRef<HTMLButtonElement>(null);
  const tpPlusRef     = useRef<HTMLButtonElement>(null);
  const fabRef        = useRef<HTMLButtonElement>(null);
  const panelRef      = useRef<HTMLElement>(null);
  const closeBtnRef   = useRef<HTMLButtonElement>(null);
  const sRxRef        = useRef<HTMLInputElement>(null);
  const sRyRef        = useRef<HTMLInputElement>(null);
  const sFallRef      = useRef<HTMLInputElement>(null);
  const vRxRef        = useRef<HTMLSpanElement>(null);
  const vRyRef        = useRef<HTMLSpanElement>(null);
  const vFallRef      = useRef<HTMLSpanElement>(null);
  const stateElRef    = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    /* ── constants ── */
    const STEP    = 0.34;
    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N       = PLATES.length;

    /* ── element shortcuts ── */
    const stage     = stageRef.current!;
    const capEl     = capElRef.current!;
    const capNo     = capNoRef.current!;
    const capTitle  = capTitleRef.current!;
    const capDesc   = capDescRef.current!;
    const capMeta   = capMetaRef.current!;
    const scrub     = scrubRef.current!;
    const scrubFill = scrubFillRef.current!;
    const ticksBox  = ticksRef.current!;
    const thumb     = thumbRef.current!;
    const scrubLab  = scrubLabRef.current!;
    const tpBtn     = tpBtnRef.current!;
    const tpFill    = tpFillRef.current!;
    const tpVal     = tpValRef.current!;
    const tpMinus   = tpMinusRef.current!;
    const tpPlus    = tpPlusRef.current!;
    const fab       = fabRef.current!;
    const panel     = panelRef.current!;
    const closeBtn  = closeBtnRef.current!;
    const sRx       = sRxRef.current!;
    const sRy       = sRyRef.current!;
    const sFall     = sFallRef.current!;
    const vRx       = vRxRef.current!;
    const vRy       = vRyRef.current!;
    const vFall     = vFallRef.current!;
    const stateEl   = stateElRef.current!;

    /* ── build plates + ticks from DOM ── */
    const plateEls = stage.querySelectorAll<HTMLDivElement>(".hx-plate");
    const plates: { el: HTMLDivElement; media: HTMLSpanElement }[] = [];
    const ticks: HTMLElement[] = [];

    plateEls.forEach((el, i) => {
      const media = el.querySelector<HTMLSpanElement>(".hx-plate-media")!;
      plates.push({ el, media });

      /* preload image */
      const img = new Image();
      img.onload  = () => { media.style.backgroundImage = `url('${img.src}')`; };
      img.onerror = () => { media.style.backgroundImage = `linear-gradient(135deg,#DDE7F2,#96B1D0)`; };
      img.src = PLATES[i].img;

      /* tick mark */
      const tk = document.createElement("i");
      tk.className = "hx-tick";
      tk.style.left = `${(i / (N - 1)) * 100}%`;
      ticksBox.appendChild(tk);
      ticks.push(tk);
    });

    /* ── animation state ── */
    let pos = 0, target = 0, raf = 0, running = false, settled = -1;
    let RX = 600, RY = 54, FALL = 0.52, range = 5;

    function readVars() {
      const cs  = getComputedStyle(document.documentElement);
      const num = (n: string, fb: number) => { const v = parseFloat(cs.getPropertyValue(n)); return isNaN(v) ? fb : v; };
      RX   = num("--hx-rx",   600);
      RY   = num("--hx-ry",   54);
      FALL = num("--hx-fall", 0.52);
    }
    readVars();
    function readRange() { range = window.innerWidth < 900 ? 3 : 5; }
    readRange();

    /* ── render coil ── */
    function render() {
      let near = 999, nearI = 0;
      for (let i = 0; i < N; i++) {
        const p = plates[i];
        const d = ((i - pos + N / 2 + N * 2) % N) - N / 2;
        const a = Math.abs(d);
        if (a > range + 0.5) { if (p.el.style.display !== "none") p.el.style.display = "none"; continue; }
        if (p.el.style.display === "none") p.el.style.display = "";
        if (a < near) { near = a; nearI = i; }

        const th   = d * STEP;
        const x    = Math.sin(th) * RX;
        const y    = -Math.sin(d * 0.9) * RY;
        const rotY = -th * 57.2958 * 0.85;
        const rotZ = d * 1.4;
        const sc   = Math.max(0.36, 1 / (1 + FALL * Math.pow(a, 1.15)));
        const op   = Math.max(0.14, 1 - 0.34 * a);
        const sat  = 0.28 + 0.72 / (1 + 0.9 * a);
        const bl   = (a < 1.6 || window.innerWidth < 900) ? 0 : Math.min(2.2, (a - 1.6) * 1.1);

        p.el.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
        p.el.style.opacity   = op.toFixed(3);
        p.el.style.zIndex    = String(Math.round(1000 - a * 10));
        p.media.style.filter = `saturate(${sat.toFixed(3)})${bl ? ` blur(${bl.toFixed(2)}px)` : ""}`;
        p.el.classList.toggle("is-centre", a < 0.5);
      }
      paintScrub();
      if (nearI !== settled) setCaption(nearI);
    }

    function loop() {
      pos += (target - pos) * 0.14;
      if (Math.abs(target - pos) < 0.0004) { pos = target; running = false; render(); return; }
      render();
      raf = requestAnimationFrame(loop);
    }

    function kick() {
      if (target > N * 2 || target < -N * 2) { const k = Math.round(target / N) * N; target -= k; pos -= k; }
      if (REDUCED) { pos = target; render(); return; }
      if (!running) { running = true; raf = requestAnimationFrame(loop); }
    }

    /* ── caption ── */
    let swapTimer = 0;
    function setCaption(i: number) {
      settled = i;
      const pl = PLATES[i];
      clearTimeout(swapTimer);
      capEl.classList.add("hx-swap");
      swapTimer = window.setTimeout(() => {
        capNo.textContent    = String(i + 1).padStart(2, "0");
        capTitle.textContent = pl.title;
        capDesc.textContent  = pl.desc;
        capMeta.innerHTML    = `<span>${pl.alt}</span><span>${pl.month}</span><span>${pl.stock}</span>`;
        capEl.classList.remove("hx-swap");
      }, REDUCED ? 0 : 160);
      scrub.setAttribute("aria-valuenow", String(i + 1));
      scrub.setAttribute("aria-valuetext", `${i + 1} dari ${N}, ${pl.title}`);
      scrubLab.textContent = `${String(i + 1).padStart(2, "0")} / 0${N}`;
      ticks.forEach((tk, k) => tk.classList.toggle("on", k === i));
    }

    /* ── scrub bar ── */
    function ringPos() { return ((pos % N) + N) % N; }
    function paintScrub() {
      const v    = ringPos();
      let frac   = v <= N - 1 ? v / (N - 1) : 1 - (v - (N - 1));
      frac = Math.max(0, Math.min(1, frac));
      scrubFill.style.width = `${frac * 100}%`;
      thumb.style.left      = `${frac * scrub.clientWidth}px`;
    }
    function scrubTo(clientX: number) {
      const r    = scrub.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      const want = frac * (N - 1);
      target = want + Math.round((pos - want) / N) * N;
      kick();
    }
    let scrubbing = false;
    const endScrub = (e?: PointerEvent) => {
      if (!scrubbing) return;
      scrubbing = false;
      try { if (e?.pointerId !== undefined) scrub.releasePointerCapture(e.pointerId); } catch {}
      target = Math.round(target); kick();
    };
    scrub.addEventListener("pointerdown", (e) => { if (playing) setPlay(false); scrubbing = true; try { scrub.setPointerCapture(e.pointerId); } catch {} scrubTo(e.clientX); e.preventDefault(); });
    scrub.addEventListener("pointermove", (e) => { if (scrubbing) scrubTo(e.clientX); });
    scrub.addEventListener("pointerup",     endScrub as EventListener);
    scrub.addEventListener("pointercancel", endScrub as EventListener);
    window.addEventListener("pointerup",    endScrub as EventListener);

    /* ── stage drag ── */
    let down = false, startX = 0, startT = 0, lastX = 0, lastT = 0, vel = 0, moved = false;
    const onDown = (e: PointerEvent) => {
      if (playing) setPlay(false);
      down = true; moved = false; startX = lastX = e.clientX;
      startT = target; lastT = performance.now(); vel = 0;
      stage.classList.add("grabbing");
      try { stage.setPointerCapture(e.pointerId); } catch {}
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      target = startT - dx / ((plates[0]?.el.offsetWidth || 400) * 0.62);
      const now = performance.now(), dt = now - lastT;
      if (dt > 0) { vel = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = now; }
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false; stage.classList.remove("grabbing");
      try { if (e?.pointerId !== undefined) stage.releasePointerCapture(e.pointerId); } catch {}
      const flick = Math.max(-2.2, Math.min(2.2, -vel * 0.34));
      target = Math.round(target + flick); kick();
    };
    stage.addEventListener("pointerdown",   onDown);
    stage.addEventListener("pointermove",   onMove);
    stage.addEventListener("pointerup",     onUp as EventListener);
    stage.addEventListener("pointercancel", onUp as EventListener);
    window.addEventListener("pointerup",    onUp as EventListener);
    stage.addEventListener("dragstart",     (e) => e.preventDefault());
    stage.addEventListener("wheel", (e) => {
      const raw = Math.max(-0.9, Math.min(0.9, (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.0032));
      target += raw; kick();
      clearTimeout((stage as HTMLDivElement & { _wt?: number })._wt);
      (stage as HTMLDivElement & { _wt?: number })._wt = window.setTimeout(() => { target = Math.round(target); kick(); }, 170);
      e.preventDefault();
    }, { passive: false });

    /* click a side plate to bring it centre */
    plates.forEach((p, i) => {
      p.el.addEventListener("click", () => {
        if (moved) return;
        const d = ((i - pos + N / 2 + N * 2) % N) - N / 2;
        if (Math.abs(d) < 0.5) {
          p.el.classList.add("press");
          setTimeout(() => p.el.classList.remove("press"), 140);
          return;
        }
        target = Math.round(pos + d); kick();
      });
      p.el.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        const d = ((i - pos + N / 2 + N * 2) % N) - N / 2;
        if (Math.abs(d) < 0.5) { p.el.classList.add("press"); setTimeout(() => p.el.classList.remove("press"), 140); }
        else { target = Math.round(pos + d); kick(); }
      });
    });

    /* arrow keys */
    const onKeyGlobal = (e: KeyboardEvent) => {
      if (e.target && /INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName)) return;
      if (e.key === "ArrowLeft")  { target = Math.round(target) - 1; kick(); }
      if (e.key === "ArrowRight") { target = Math.round(target) + 1; kick(); }
    };
    document.addEventListener("keydown", onKeyGlobal);

    /* ── transport / autoplay ── */
    const DUR_MIN = 1, DUR_MAX = 9;
    let dur = 2, playing = false, tStart = 0, tRaf = 0;

    const tickFn = (now: number) => {
      if (!playing) return;
      const f = (now - tStart) / (dur * 1000);
      if (f >= 1) { tStart = now; target = Math.round(target) + 1; kick(); }
      tpFill.style.width = `${Math.min(f, 1) * 100}%`;
      tRaf = requestAnimationFrame(tickFn);
    };

    function setPlay(on: boolean) {
      playing = on;
      tpBtn.classList.toggle("playing", on);
      tpBtn.setAttribute("aria-pressed", String(on));
      tpBtn.setAttribute("aria-label", on ? "Jeda auto advance" : "Putar auto advance");
      cancelAnimationFrame(tRaf);
      if (on) { tStart = performance.now(); tRaf = requestAnimationFrame(tickFn); }
      else tpFill.style.width = "0%";
    }
    function setDur(v: number) {
      dur = Math.max(DUR_MIN, Math.min(DUR_MAX, v));
      tpVal.textContent  = `${dur}s`;
      tpMinus.disabled   = dur <= DUR_MIN;
      tpPlus.disabled    = dur >= DUR_MAX;
      if (playing) tStart = performance.now(); else tpFill.style.width = "0%";
    }
    tpBtn.addEventListener("click",  () => setPlay(!playing));
    tpMinus.addEventListener("click", () => setDur(dur - 1));
    tpPlus.addEventListener("click",  () => setDur(dur + 1));
    document.addEventListener("visibilitychange", () => {
      if (!playing) return;
      if (document.hidden) cancelAnimationFrame(tRaf);
      else { tStart = performance.now(); tRaf = requestAnimationFrame(tickFn); }
    });

    setDur(2);
    setPlay(!REDUCED);

    /* ── coil control panel ── */
    function fillRange(el: HTMLInputElement) {
      el.style.setProperty("--fill", `${((+el.value - +el.min) / (+el.max - +el.min)) * 100}%`);
    }
    function coilName(ry: number) {
      if (ry <= 18) return "Flat reel";
      if (ry <= 44) return "Slack coil";
      if (ry <= 68) return "Working spool";
      return "Tight winding";
    }
    function applyVars() {
      document.documentElement.style.setProperty("--hx-rx",   sRx.value);
      document.documentElement.style.setProperty("--hx-ry",   sRy.value);
      document.documentElement.style.setProperty("--hx-fall", sFall.value);
      vRx.textContent   = sRx.value;
      vRy.textContent   = sRy.value;
      vFall.textContent = parseFloat(sFall.value).toFixed(2);
      stateEl.textContent = coilName(parseFloat(sRy.value));
      readVars(); render();
    }
    [sRx, sRy, sFall].forEach((el) => {
      fillRange(el);
      el.addEventListener("input", () => { fillRange(el); applyVars(); });
    });

    function setControl(open: boolean) {
      panel.classList.toggle("open", open);
      fab.classList.toggle("gone",  open);
      fab.setAttribute("aria-expanded", String(open));
    }
    fab.addEventListener("click",     () => setControl(true));
    closeBtn.addEventListener("click", () => setControl(false));
    setControl(false);

    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (panel.classList.contains("open")) setControl(false);
    };
    document.addEventListener("keydown", onEsc);

    /* ── reveal on scroll ── */
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    document.querySelectorAll(".hx-rv").forEach((el) => io.observe(el));
    /* fallback: reveal all after 3 s */
    const fallbackReveal = window.setTimeout(() => {
      document.querySelectorAll(".hx-rv").forEach((el) => el.classList.add("in"));
    }, 3000);

    /* hide transport when stage scrolls away */
    const stageIO = new IntersectionObserver((ents) => {
      document.body.classList.toggle("away", ents[0].intersectionRatio < 0.5);
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    stageIO.observe(stage);

    /* resize */
    let rt = 0;
    const onResize = () => { clearTimeout(rt); rt = window.setTimeout(() => { readVars(); readRange(); render(); }, 120); };
    window.addEventListener("resize", onResize);

    /* ── kick off ── */
    setCaption(0);
    render();

    /* ── cleanup ── */
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(tRaf);
      clearTimeout(fallbackReveal);
      window.removeEventListener("resize",   onResize);
      window.removeEventListener("pointerup", endScrub as EventListener);
      window.removeEventListener("pointerup", onUp as EventListener);
      document.removeEventListener("keydown", onKeyGlobal);
      document.removeEventListener("keydown", onEsc);
      io.disconnect();
      stageIO.disconnect();
    };
  }, []);

  /* ── JSX ── */
  return (
    <div className="hx-wrap">
      <div className="hx-inner">

          {/* ══ STAGE ══ */}
          <div
            className="hx-stage"
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

          {/* ══ CAPTION ══ */}
          <section
            className="hx-caption hx-rv"
            ref={capElRef as React.RefObject<HTMLElement>}
            aria-live="polite"
          >
            <div className="hx-cap-head">
              <span className="hx-cap-no" ref={capNoRef}>01</span>
              <span className="hx-cap-rule" />
              <h1 className="hx-cap-title" ref={capTitleRef}>{PLATES[0].title}</h1>
            </div>
            <p className="hx-cap-desc" ref={capDescRef} />
            <div className="hx-cap-meta" ref={capMetaRef} />
          </section>

          {/* ══ SCRUB BAR ══ */}
          <div className="hx-scrub-shell hx-rv">
            <div
              className="hx-scrub"
              ref={scrubRef}
              role="slider"
              tabIndex={0}
              aria-label="Posisi spool"
              aria-valuemin={1}
              aria-valuemax={PLATES.length}
              aria-valuenow={1}
            >
              <div className="hx-scrub-track" />
              <div className="hx-scrub-fill" ref={scrubFillRef} />
              <div className="hx-scrub-ticks" ref={ticksRef} />
              <div className="hx-thumb" ref={thumbRef}>
                <i /><i />
              </div>
            </div>
            <div className="hx-scrub-label" ref={scrubLabRef}>
              01 / 0{PLATES.length}
            </div>
          </div>

          {/* ══ ABOUT SHEET ══ */}
          <section className="hx-sheet hx-rv" id="about">
            <span className="hx-sheet-tag">Tentang Kami</span>
            <h2>Mengubah sampah menjadi harapan</h2>
            <p>
              Waste &amp; Wishes adalah inisiatif pengelolaan limbah organik berbasis
              komunitas di kawasan Wedomartani &amp; Gejayan. Kami membantu rumah
              tangga dan UMKM memilah dan menyetorkan sampah organik yang kemudian
              diolah melalui budidaya maggot Black Soldier Fly (BSF).
            </p>
            <p>
              Setiap kilogram sampah yang terolah menghasilkan pakan ternak bernilai
              tinggi sekaligus mengurangi beban tempat pembuangan akhir. Bergabunglah
              bersama ratusan mitra kami dan jadilah bagian dari perubahan.
            </p>
            <dl className="hx-facts">
              <div><dt>Berdiri</dt><dd>2022</dd></div>
              <div><dt>Limbah Terolah</dt><dd>10+ Ton</dd></div>
              <div><dt>Mitra Aktif</dt><dd>250+</dd></div>
              <div><dt>Event</dt><dd>15+</dd></div>
            </dl>
          </section>

          {/* ══ CONTACT SHEET ══ */}
          <section className="hx-sheet hx-rv" id="contact">
            <span className="hx-sheet-tag">Kontak</span>
            <h2>Berlangganan &amp; kolaborasi</h2>
            <p>
              Daftarkan rumah tangga atau UMKM Anda untuk layanan pengambilan sampah
              organik terjadwal. Kami juga terbuka untuk kolaborasi edukasi dan
              kerelawanan lingkungan.
            </p>
            <ul className="hx-lines">
              <li><span>Email</span><a href="mailto:hello@wasteandwishes.id">hello@wasteandwishes.id</a></li>
              <li><span>Area</span><a href="#contact">Wedomartani, Gejayan &amp; sekitarnya</a></li>
              <li><span>Jam</span><a href="#contact">Senin–Sabtu, 08.00–17.00 WIB</a></li>
            </ul>
          </section>

          {/* ══ FOOTER ══ */}
          <footer className="hx-foot hx-rv">
            <span>Waste &amp; Wishes — Pengelolaan Limbah Organik, Yogyakarta.</span>
            <span>
              Desain berbasis{" "}
              <a href="https://templatemo.com/tm-630-helix-drift" rel="nofollow noopener" target="_blank">
                Helix Drift
              </a>
            </span>
          </footer>
        </div>

        {/* ══ TRANSPORT (autoplay) ══ */}
        <div className="hx-transport" role="group" aria-label="Auto advance">
          <button
            className="hx-tp-btn playing"
            ref={tpBtnRef}
            aria-pressed="true"
            aria-label="Jeda auto advance"
          >
            <svg className="ico-play" width="12" height="13" viewBox="0 0 12 13" aria-hidden="true">
              <path d="M1 1.2 11 6.5 1 11.8Z" fill="#17afb0" />
            </svg>
            <svg className="ico-pause" width="11" height="12" viewBox="0 0 11 12" aria-hidden="true">
              <rect x="1" y="1" width="3" height="10" fill="#17afb0" />
              <rect x="7" y="1" width="3" height="10" fill="#17afb0" />
            </svg>
          </button>
          <span className="hx-tp-stack">
            <span className="hx-tp-dur">
              <button className="hx-tp-step" ref={tpMinusRef} aria-label="Interval lebih pendek">−</button>
              <span className="hx-tp-val" ref={tpValRef} aria-live="polite">2s</span>
              <button className="hx-tp-step" ref={tpPlusRef} aria-label="Interval lebih panjang">+</button>
            </span>
            <span className="hx-tp-line" aria-hidden="true">
              <i ref={tpFillRef as React.RefObject<HTMLElement>} />
            </span>
          </span>
        </div>

        {/* ══ FAB + COIL CONTROL PANEL ══ */}
        <button
          className="hx-fab"
          ref={fabRef}
          aria-label="Buka kontrol coil"
          aria-expanded="false"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#17afb0" strokeWidth="1.2" strokeLinecap="round">
            <path d="M12 3c-4.5 0-8 2-8 4.5S7 12 12 12s8 2 8 4.5S16.5 21 12 21" />
            <path d="M4 7.5v9C4 19 7.5 21 12 21" />
            <path d="M20 16.5v-9C20 5 16.5 3 12 3" />
          </svg>
        </button>

        <section
          className="hx-panel"
          ref={panelRef as React.RefObject<HTMLElement>}
          role="dialog"
          aria-label="Kontrol coil"
          aria-modal="false"
        >
          <h2>Coil</h2>
          <div className="hx-slot">
            <label htmlFor="hx-sRx">
              <span>Coil width</span><span ref={vRxRef}>600</span>
            </label>
            <input ref={sRxRef} type="range" id="hx-sRx" min="360" max="780" step="10" defaultValue="600" />
          </div>
          <div className="hx-slot">
            <label htmlFor="hx-sRy">
              <span>Coil rise</span><span ref={vRyRef}>54</span>
            </label>
            <input ref={sRyRef} type="range" id="hx-sRy" min="0" max="96" step="2" defaultValue="54" />
          </div>
          <div className="hx-slot">
            <label htmlFor="hx-sFall">
              <span>Depth falloff</span><span ref={vFallRef}>0.52</span>
            </label>
            <input ref={sFallRef} type="range" id="hx-sFall" min="0.30" max="0.86" step="0.02" defaultValue="0.52" />
          </div>
          <div className="hx-panel-out">
            <span className="hx-state" ref={stateElRef}>Working spool</span>
            <button className="hx-close" ref={closeBtnRef} aria-label="Tutup kontrol coil">×</button>
          </div>
        </section>
      </div>
  );
}
