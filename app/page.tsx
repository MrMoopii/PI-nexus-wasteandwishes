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

/* ─── CSS styles (scoped dengan prefix hx-) ──────────────── */
const helixStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@200;300;400;500&family=Newsreader:ital,opsz,wght@0,6..72,200;0,6..72,300;0,6..72,400;1,6..72,300&display=swap');

  :root {
    --hx-canvas: #F4F7FA;
    --hx-sunk: #DDE7F2;
    --hx-pastel: #B9CDE5;
    --hx-pastel-deep: #96B1D0;
    --hx-ink: #1B2233;
    --hx-ink-2: #5B6879;
    --hx-ink-3: #93A0B2;
    --hx-accent: #17afb0;
    --hx-rx: 600;
    --hx-ry: 54;
    --hx-fall: 0.52;
    --hx-ease: cubic-bezier(.22,1,.36,1);
  }

  .hx-wrap {
    font-family: 'Albert Sans', system-ui, sans-serif;
    font-weight: 300;
    background: var(--hx-canvas);
    color: var(--hx-ink);
    position: relative;
    overflow-x: hidden;
    min-height: 100vh;
  }

  /* ambient wash */
  .hx-wrap::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(120vw 90vh at 8% -10%, rgba(185,205,229,.55), transparent 62%),
      radial-gradient(110vw 80vh at 98% 108%, rgba(221,231,242,.85), transparent 60%);
  }

  /* grid + grain overlay */
  .hx-wrap::after {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.34' numOctaves='2' stitchTiles='stitch'/></filter><rect width='320' height='320' filter='url(%23n)' opacity='0.10'/></svg>"),
      linear-gradient(to right, rgba(150,177,208,.30) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(150,177,208,.30) 1px, transparent 1px);
    background-size: 320px 320px, 72px 72px, 72px 72px;
    mix-blend-mode: overlay;
    opacity: .5;
    -webkit-mask-image: radial-gradient(80vw 80vh at 50% 42%, #000 20%, transparent 82%);
    mask-image: radial-gradient(80vw 80vh at 50% 42%, #000 20%, transparent 82%);
  }

  .hx-inner { position: relative; z-index: 1; }

  /* ── stage ── */
  .hx-stage {
    position: relative;
    height: min(62vh, 560px);
    min-height: 340px;
    perspective: 1400px;
    touch-action: pan-y;
    cursor: grab;
    overflow: hidden;
    min-width: 0;
  }
  .hx-stage.grabbing { cursor: grabbing; }

  .hx-plate {
    position: absolute;
    left: 50%; top: 50%;
    width: min(46vw, 620px);
    aspect-ratio: 16/10;
    padding: 0; border: 0;
    background: transparent;
    border-radius: 3px;
    cursor: pointer;
    -webkit-user-drag: none;
    user-select: none;
    transform-style: preserve-3d;
    backface-visibility: hidden;
    will-change: transform, opacity;
  }
  .hx-plate > * { pointer-events: none; }

  .hx-plate-media {
    position: absolute;
    inset: 0;
    border-radius: 3px;
    overflow: hidden;
    background-color: var(--hx-sunk);
    background-size: cover;
    background-position: center;
    box-shadow: 0 22px 46px -20px rgba(27,34,51,.42), 0 2px 6px rgba(27,34,51,.08);
    transition: transform .14s var(--hx-ease);
  }
  .hx-plate-media::after {
    content: "";
    position: absolute; inset: 0;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.42);
    border-radius: 3px;
  }
  .hx-plate-no {
    position: absolute;
    left: 0; bottom: -30px;
    font-family: 'Newsreader', serif;
    font-style: italic;
    font-weight: 300;
    font-size: .9rem;
    color: var(--hx-ink-3);
    letter-spacing: .04em;
    opacity: 0;
    transition: opacity .3s;
  }
  .hx-plate.is-centre .hx-plate-no { opacity: 1; }
  .hx-plate.press .hx-plate-media { transform: scale(.988); }
  .hx-plate-info {
    position: absolute; width: 1px; height: 1px;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }

  /* ── caption ── */
  .hx-caption {
    max-width: 620px;
    min-height: 96px;
    margin: 1.9rem auto 0;
    padding: 0 clamp(18px,5vw,24px);
    transition: opacity .22s var(--hx-ease), transform .22s var(--hx-ease);
  }
  .hx-caption.hx-swap { opacity: 0; transform: translateY(6px); }

  .hx-cap-head { display: flex; align-items: baseline; gap: .9rem; margin-bottom: .5rem; }
  .hx-cap-no {
    font-family: 'Newsreader', serif;
    font-style: italic; font-weight: 300;
    font-size: 1.15rem; color: var(--hx-accent);
  }
  .hx-cap-rule { flex: 0 0 34px; height: 1px; background: var(--hx-pastel); transform: translateY(-4px); }
  .hx-cap-title {
    font-family: 'Newsreader', serif;
    font-weight: 300; font-size: 1.5rem;
    letter-spacing: -.02em; line-height: 1.2;
  }
  .hx-cap-desc {
    font-size: .94rem; line-height: 1.62;
    color: var(--hx-ink-2); font-weight: 300;
    max-width: 56ch; margin-top: .4rem;
  }
  .hx-cap-meta {
    margin-top: .7rem; font-size: .7rem;
    letter-spacing: .16em; text-transform: uppercase;
    color: var(--hx-ink-3);
    display: flex; flex-wrap: wrap; gap: .4rem 1.1rem;
  }

  /* ── scrub ── */
  .hx-scrub-shell { margin: 1.9rem auto 0; width: 340px; max-width: calc(100vw - 44px); }
  .hx-scrub {
    position: relative; height: 26px;
    display: flex; align-items: center;
    touch-action: none; cursor: pointer;
  }
  .hx-scrub:focus-visible { outline: 2px solid var(--hx-accent); outline-offset: 6px; border-radius: 4px; }
  .hx-scrub-track {
    position: absolute; left: 0; right: 0; height: 4px; border-radius: 2px;
    background: var(--hx-sunk);
    box-shadow: inset 0 1px 2px rgba(90,110,145,.22), inset 0 -1px 0 rgba(255,255,255,.9);
  }
  .hx-scrub-fill { position: absolute; left: 0; height: 4px; border-radius: 2px; background: var(--hx-pastel-deep); width: 0; }
  .hx-scrub-ticks { position: absolute; left: 0; right: 0; height: 26px; pointer-events: none; }
  .hx-tick {
    position: absolute; top: 50%;
    width: 1px; height: 9px; margin-top: -4.5px;
    background: var(--hx-pastel);
    transition: height .3s var(--hx-ease), background .3s, margin-top .3s var(--hx-ease);
  }
  .hx-tick.on { height: 13px; margin-top: -6.5px; background: var(--hx-accent); }
  .hx-thumb {
    position: absolute; top: 50%;
    width: 34px; height: 14px;
    margin-top: -7px; margin-left: -17px;
    border-radius: 7px; background: #fff;
    border: 1px solid var(--hx-pastel);
    box-shadow: 0 3px 8px rgba(90,110,145,.28);
    display: flex; align-items: center; justify-content: center; gap: 3px;
    pointer-events: none;
  }
  .hx-thumb i { width: 1px; height: 6px; background: var(--hx-pastel-deep); display: block; }
  .hx-scrub-label { margin-top: .7rem; text-align: center; font-size: .7rem; letter-spacing: .18em; color: var(--hx-ink-3); font-variant-numeric: tabular-nums; }

  /* ── sheets ── */
  .hx-sheet { max-width: 620px; margin: clamp(52px,9vh,104px) auto 0; padding: 0 clamp(18px,5vw,24px); }
  .hx-sheet-tag { display: block; font-size: .68rem; letter-spacing: .2em; text-transform: uppercase; color: var(--hx-ink-3); margin-bottom: .9rem; }
  .hx-sheet h2 {
    font-family: 'Newsreader', serif;
    font-weight: 300; font-size: clamp(1.5rem,3.4vw,2rem);
    letter-spacing: -.02em; line-height: 1.18; margin-bottom: 1rem;
  }
  .hx-sheet p { font-size: .95rem; line-height: 1.75; color: var(--hx-ink-2); margin-bottom: 1rem; max-width: 58ch; }

  .hx-facts {
    display: grid; grid-template-columns: repeat(2,1fr);
    gap: 1px; margin-top: 1.6rem; background: var(--hx-pastel);
  }
  .hx-facts > div { background: var(--hx-canvas); padding: 1.2rem 1rem; }
  .hx-facts dt { font-size: .68rem; letter-spacing: .18em; text-transform: uppercase; color: var(--hx-ink-3); margin-bottom: .35rem; }
  .hx-facts dd { font-size: 1.35rem; font-weight: 400; color: var(--hx-ink); }

  .hx-lines { list-style: none; padding: 0; margin-top: 1.2rem; }
  .hx-lines li { display: flex; gap: 1.2rem; padding: .65rem 0; border-bottom: 1px solid rgba(150,177,208,.25); font-size: .94rem; }
  .hx-lines li span { color: var(--hx-ink-3); min-width: 52px; font-size: .78rem; letter-spacing: .1em; text-transform: uppercase; }
  .hx-lines a { color: var(--hx-accent); text-decoration: none; }

  /* ── footer ── */
  .hx-foot {
    margin-top: clamp(48px,8vh,96px);
    background: var(--hx-sunk);
    border-top: 1px solid rgba(150,177,208,.4);
    padding: 2.4rem clamp(18px,5vw,54px);
    display: flex; flex-wrap: wrap; gap: 1rem;
    justify-content: space-between; align-items: center;
    font-size: .78rem; color: var(--hx-ink-2);
  }
  .hx-foot a { color: var(--hx-accent); text-decoration: none; border-bottom: 1px solid rgba(23,175,176,.35); }
  .hx-foot a:hover { border-bottom-color: var(--hx-accent); }

  /* ── transport (autoplay control) ── */
  .hx-transport {
    position: fixed; left: 20px; bottom: 20px; z-index: 70;
    display: flex; align-items: center; gap: .7rem;
    padding: .55rem .85rem; border-radius: 30px;
    background: rgba(255,255,255,.86);
    border: 1px solid var(--hx-pastel);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 6px 18px -6px rgba(27,34,51,.22);
    transition: opacity .3s var(--hx-ease), transform .3s var(--hx-ease);
  }
  body.away .hx-transport { transform: translateX(calc(-100% - 30px)); opacity: 0; pointer-events: none; }
  body.lock .hx-transport { opacity: 0; pointer-events: none; }

  .hx-tp-btn {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1px solid var(--hx-pastel); background: rgba(255,255,255,.9);
    display: flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .hx-tp-btn .ico-pause { display: none; }
  .hx-tp-btn.playing .ico-play { display: none; }
  .hx-tp-btn.playing .ico-pause { display: block; }

  .hx-tp-stack { display: flex; flex-direction: column; gap: .2rem; }
  .hx-tp-dur { display: flex; align-items: center; gap: .4rem; font-size: .74rem; color: var(--hx-ink-2); }
  .hx-tp-step {
    width: 18px; height: 18px; border-radius: 50%;
    border: 1px solid var(--hx-pastel); background: rgba(255,255,255,.9);
    cursor: pointer; font-size: .8rem; line-height: 1;
    display: flex; align-items: center; justify-content: center; color: var(--hx-ink-2);
  }
  .hx-tp-val { min-width: 22px; text-align: center; font-variant-numeric: tabular-nums; }
  .hx-tp-line { height: 3px; border-radius: 2px; background: var(--hx-sunk); overflow: hidden; }
  .hx-tp-line i { display: block; height: 100%; width: 0; background: var(--hx-accent); }

  /* ── fab + coil control panel ── */
  .hx-fab {
    position: fixed; right: 20px; bottom: 20px; z-index: 70;
    width: 46px; height: 46px; border-radius: 50%;
    background: rgba(255,255,255,.86);
    border: 1px solid var(--hx-pastel);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 6px 18px -6px rgba(27,34,51,.3);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: opacity .3s var(--hx-ease), transform .3s var(--hx-ease);
  }
  .hx-fab.gone { opacity: 0; transform: scale(.68); pointer-events: none; }
  body.away .hx-fab, body.away .hx-panel {
    transform: translateX(calc(100% + 30px)); opacity: 0; pointer-events: none;
  }

  .hx-panel {
    position: fixed; right: 20px; bottom: 20px; z-index: 71;
    width: min(308px, calc(100vw - 28px));
    padding: 1.15rem 1.15rem .95rem; border-radius: 8px;
    background: rgba(255,255,255,.82);
    backdrop-filter: blur(16px) saturate(124%);
    -webkit-backdrop-filter: blur(16px) saturate(124%);
    border: 1px solid rgba(255,255,255,.9);
    box-shadow: -6px -6px 16px rgba(255,255,255,.9), 6px 6px 20px rgba(150,177,208,.34);
    opacity: 0; visibility: hidden; transform: translateY(14px) scale(.97); pointer-events: none;
    transition: opacity .3s var(--hx-ease), transform .3s var(--hx-ease), visibility .3s;
  }
  .hx-panel.open { opacity: 1; visibility: visible; transform: none; pointer-events: auto; }
  .hx-panel h2 {
    font-family: 'Newsreader', serif; font-weight: 300;
    font-size: .94rem; letter-spacing: .14em; text-transform: uppercase;
    color: var(--hx-ink); margin-bottom: 1rem;
  }
  .hx-slot { margin-bottom: .85rem; }
  .hx-slot label { display: flex; justify-content: space-between; font-size: .68rem; letter-spacing: .14em; text-transform: uppercase; color: var(--hx-ink-3); margin-bottom: .45rem; font-variant-numeric: tabular-nums; }
  .hx-panel input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 16px; background: transparent; cursor: pointer; }
  .hx-panel input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(to right, var(--hx-pastel-deep) 0 var(--fill,50%), var(--hx-sunk) var(--fill,50%) 100%); box-shadow: inset 0 1px 2px rgba(90,110,145,.2); }
  .hx-panel input[type=range]::-moz-range-track { height: 4px; border-radius: 2px; background: linear-gradient(to right, var(--hx-pastel-deep) 0 var(--fill,50%), var(--hx-sunk) var(--fill,50%) 100%); }
  .hx-panel input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 15px; height: 15px; border-radius: 50%; background: #fff; border: 1px solid var(--hx-pastel-deep); margin-top: -5.5px; box-shadow: 0 2px 5px rgba(90,110,145,.3); }
  .hx-panel input[type=range]::-moz-range-thumb { width: 15px; height: 15px; border-radius: 50%; border: 1px solid var(--hx-pastel-deep); background: #fff; box-shadow: 0 2px 5px rgba(90,110,145,.3); }
  .hx-panel-out { display: flex; align-items: center; gap: .7rem; margin-top: .9rem; padding-top: .75rem; border-top: 1px solid rgba(150,177,208,.35); }
  .hx-state { font-size: .76rem; color: var(--hx-ink-2); letter-spacing: .02em; }
  .hx-close {
    margin-left: auto; width: 36px; height: 36px; border-radius: 50%;
    border: 1px solid var(--hx-pastel); background: rgba(255,255,255,.9);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    box-shadow: -3px -3px 8px rgba(255,255,255,.9), 3px 3px 8px rgba(150,177,208,.3);
    color: var(--hx-ink-2); font-size: 1rem; line-height: 1;
  }

  /* ── reveal animation ── */
  .hx-rv { opacity: 0; transform: translateY(18px); transition: opacity .55s var(--hx-ease), transform .55s var(--hx-ease); }
  .hx-rv.in { opacity: 1; transform: none; }

  /* ── responsive ── */
  @media (max-width: 600px) {
    .hx-plate { width: min(80vw, 340px); }
    .hx-facts { grid-template-columns: 1fr; }
  }
`;

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
    <>
      {/* inject styles */}
      <style dangerouslySetInnerHTML={{ __html: helixStyles }} />

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
    </>
  );
}
