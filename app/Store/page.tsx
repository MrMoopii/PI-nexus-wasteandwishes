"use client";

import { useMemo, useState } from "react";

/* ─── Data contoh produk (ganti dengan data dari database) ─── */
type Produk = {
  id: number;
  nama: string;
  harga: number;
  jenis: "Pupuk" | "Olahan Maggot" | "Pakan Ternak";
  jumlah: "Satuan" | "Puluhan" | "Ratusan";
  waktu: "Terbaru" | "Minggu ini" | "Bulan ini";
  img?: string;
};

const PRODUK: Produk[] = [
  { id: 1, nama: "Pupuk Kasgot 1 Kg", harga: 15000, jenis: "Pupuk", jumlah: "Satuan", waktu: "Terbaru" },
  { id: 2, nama: "Maggot Kering 500 g", harga: 35000, jenis: "Olahan Maggot", jumlah: "Satuan", waktu: "Minggu ini" },
  { id: 3, nama: "Pakan Burung Maggot", harga: 25000, jenis: "Pakan Ternak", jumlah: "Puluhan", waktu: "Bulan ini" },
  { id: 4, nama: "Pupuk Kasgot 5 Kg", harga: 60000, jenis: "Pupuk", jumlah: "Puluhan", waktu: "Terbaru" },
  { id: 5, nama: "Maggot Segar 1 Kg", harga: 20000, jenis: "Olahan Maggot", jumlah: "Ratusan", waktu: "Minggu ini" },
  { id: 6, nama: "Pakan Ayam Maggot", harga: 90000, jenis: "Pakan Ternak", jumlah: "Ratusan", waktu: "Bulan ini" },
];

const WAKTU = [
  { label: "Terbaru", desc: "Produk yang baru ditambahkan" },
  { label: "Minggu ini", desc: "Ditambahkan 7 hari terakhir" },
  { label: "Bulan ini", desc: "Ditambahkan 30 hari terakhir" },
] as const;
const JENIS = ["Pupuk", "Olahan Maggot", "Pakan Ternak"] as const;
const JUMLAH = ["Satuan", "Puluhan", "Ratusan"] as const;
const TABS = ["Etalase Toko", "Tambah", "Edit", "Hapus"] as const;

const HARGA_MAX = 100000;
const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

/* ─── Checkbox group kecil ─── */
function CheckGroup<T extends string>({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div className="border-t border-(--hx-pastel)/40 pt-4">
      <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hx-ink-3)">
        {title}
      </span>
      <div className="space-y-2">
        {options.map((o) => (
          <label
            key={o}
            className="flex cursor-pointer items-center gap-2.5 text-sm text-(--hx-ink-2)"
          >
            <input
              type="checkbox"
              checked={selected.includes(o)}
              onChange={() => onToggle(o)}
              className="h-4 w-4 accent-(--hx-accent)"
            />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

const toggle = <T,>(arr: T[], v: T) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

export default function TokoPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Etalase Toko");
  const [query, setQuery] = useState("");
  const [keywords, setKeywords] = useState<string[]>(["Pupuk", "Maggot", "Pakan Burung"]);
  const [waktu, setWaktu] = useState<Produk["waktu"][]>(WAKTU.map((w) => w.label));
  const [jenis, setJenis] = useState<Produk["jenis"][]>([...JENIS]);
  const [jumlah, setJumlah] = useState<Produk["jumlah"][]>([...JUMLAH]);
  const [hargaMin, setHargaMin] = useState(0);
  const [hargaMax, setHargaMax] = useState(HARGA_MAX);

  /* Keyword = salah satu cocok (OR). Kosong = tampilkan semua. */
  const hasil = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUK.filter((p) => {
      const nama = p.nama.toLowerCase();
      const cocokKeyword =
        keywords.length === 0 ||
        keywords.some((k) => nama.includes(k.toLowerCase()) || p.jenis.toLowerCase().includes(k.toLowerCase()));
      return (
        (q === "" || nama.includes(q)) &&
        cocokKeyword &&
        waktu.includes(p.waktu) &&
        jenis.includes(p.jenis) &&
        jumlah.includes(p.jumlah) &&
        p.harga >= hargaMin &&
        p.harga <= hargaMax
      );
    });
  }, [query, keywords, waktu, jenis, jumlah, hargaMin, hargaMax]);

  const tambahKeyword = () => {
    const k = query.trim();
    if (k && !keywords.some((x) => x.toLowerCase() === k.toLowerCase())) {
      setKeywords([...keywords, k]);
    }
    setQuery("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--hx-canvas) font-(family-name:--font-inter) text-(--hx-ink) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark)">
      {/* Background ambient (sama seperti Beranda) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px] select-none overflow-hidden"
      >
        <div className="hx-ambient-blob-1 opacity-40" />
        <div className="hx-ambient-blob-2 opacity-30" />
        <div className="hx-ambient-blob-3 opacity-30" />
        <div className="hx-dot-grid opacity-20" />
      </div>


      <main className="relative z-10 container mx-auto max-w-7xl px-4 py-10 md:py-14">
        {/* Judul */}
        <div className="mb-10">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hx-ink-3)">
            Toko
          </span>
          <h1 className="font-(family-name:--font-plus-jakarta-sans) text-3xl font-semibold tracking-tight sm:text-4xl">
            Waste & <span className="text-(--hx-accent)">Wishes</span>
          </h1>
          <div className="mt-4 h-0.5 w-16 rounded-full bg-(--hx-accent)" />
        </div>

        <div className="grid grid-cols-[170px_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          {/* ───────── SIDEBAR FILTER ───────── */}
          <aside className="sticky top-4 h-fit space-y-4 rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-4 sm:p-5 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
            {/* Keywords */}
            <div>
              <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hx-ink-3)">
                Keywords
              </span>
              <div className="flex flex-wrap gap-2">
                {keywords.length === 0 && (
                  <span className="text-xs text-(--hx-ink-3)">Belum ada keyword</span>
                )}
                {keywords.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1.5 rounded-full border border-(--hx-pastel) bg-(--hx-canvas) px-3 py-1 text-xs font-medium text-(--hx-ink-2)"
                  >
                    {k}
                    <button
                      type="button"
                      aria-label={`Hapus keyword ${k}`}
                      onClick={() => setKeywords(keywords.filter((x) => x !== k))}
                      className="cursor-pointer text-(--hx-ink-3) transition-colors hover:text-(--hx-accent)"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Waktu */}
            <div className="space-y-2.5 border-t border-(--hx-pastel)/40 pt-4">
              {WAKTU.map((w) => (
                <label key={w.label} className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={waktu.includes(w.label)}
                    onChange={() => setWaktu(toggle(waktu, w.label))}
                    className="mt-0.5 h-4 w-4 accent-(--hx-accent)"
                  />
                  <span>
                    <span className="block text-sm text-(--hx-ink)">{w.label}</span>
                    <span className="block text-xs font-light text-(--hx-ink-3)">{w.desc}</span>
                  </span>
                </label>
              ))}
            </div>

            {/* Harga */}
            <div className="border-t border-(--hx-pastel)/40 pt-4">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hx-ink-3)">
                  Harga
                </span>
                <span className="text-xs font-medium text-(--hx-ink-2)">
                  {rupiah(hargaMin)} – {rupiah(hargaMax)}
                </span>
              </div>
              <div className="toko-range">
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-(--hx-sunk)" />
                <div
                  className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-(--hx-accent)"
                  style={{
                    left: `${(hargaMin / HARGA_MAX) * 100}%`,
                    right: `${100 - (hargaMax / HARGA_MAX) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={HARGA_MAX}
                  step={5000}
                  value={hargaMin}
                  aria-label="Harga minimum"
                  onChange={(e) => setHargaMin(Math.min(Number(e.target.value), hargaMax))}
                />
                <input
                  type="range"
                  min={0}
                  max={HARGA_MAX}
                  step={5000}
                  value={hargaMax}
                  aria-label="Harga maksimum"
                  onChange={(e) => setHargaMax(Math.max(Number(e.target.value), hargaMin))}
                />
              </div>
            </div>

            <CheckGroup title="Jenis" options={JENIS} selected={jenis} onToggle={(v) => setJenis(toggle(jenis, v))} />
            <CheckGroup title="Jumlah" options={JUMLAH} selected={jumlah} onToggle={(v) => setJumlah(toggle(jumlah, v))} />
          </aside>

          {/* ───────── KONTEN UTAMA ───────── */}
          <section>
            {/* Toolbar: pencarian + tab */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex w-full max-w-xs items-center gap-2 rounded-full border border-(--hx-pastel) bg-white/90 py-1.5 pl-5 pr-1.5 backdrop-blur-md focus-within:border-(--hx-accent)">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && tambahKeyword()}
                  placeholder="Cari produk…"
                  aria-label="Cari produk"
                  className="min-w-0 flex-1 bg-transparent text-sm text-(--hx-ink) outline-none placeholder:text-(--hx-ink-3)"
                />
                <button
                  type="button"
                  onClick={tambahKeyword}
                  aria-label="Tambah sebagai keyword"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-(--hx-accent) text-white transition-colors hover:bg-(--hx-accent-dark)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
              </div>

              <div className="inline-flex items-center gap-1 rounded-full border border-(--hx-pastel) bg-white/90 p-1.5 backdrop-blur-md">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                      tab === t
                        ? "bg-(--hx-accent) text-white"
                        : "text-(--hx-ink-2) hover:text-(--hx-accent)"
                    }`}
                  >
                    {tab === t && t === "Etalase Toko" ? "✓ " : ""}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid produk */}
            {hasil.length === 0 ? (
              <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-12 text-center text-sm text-(--hx-ink-2) backdrop-blur-sm">
                Tidak ada produk yang cocok dengan filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                {hasil.map((p) => (
                  <article key={p.id} className="hx-card p-3">
                    {/* Placeholder gambar */}
                    <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-(--hx-sunk)">
                      {p.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.img} alt={p.nama} className="h-full w-full object-cover" />
                      ) : (
                        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--hx-pastel)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="15.5" cy="8.5" r="1.8" />
                          <path d="m3 17 5-5 4 4 3-3 6 6" />
                        </svg>
                      )}
                    </div>
                    <div className="px-1 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--hx-accent)">
                        {p.jenis}
                      </span>
                      <h3 className="mt-1 text-sm font-medium text-(--hx-ink)">{p.nama}</h3>
                      <p className="mt-1 font-(family-name:--font-plus-jakarta-sans) text-sm font-semibold text-(--hx-ink)">
                        {rupiah(p.harga)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
