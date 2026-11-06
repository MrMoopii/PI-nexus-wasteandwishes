"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { produk } from "@/lib/db/schema";

type Produk = typeof produk.$inferSelect;

const rupiah = (nilai: number): string => `Rp${nilai.toLocaleString("id-ID")}`;
const jenisPilihan = [
  "Pupuk",
  "Olahan Maggot",
  "Pakan Ternak",
  "MaWas WasteBox",
] as const;

export default function EtalaseProduk({
  produkList,
}: {
  produkList: Produk[];
}) {
  const [query, setQuery] = useState("");
  const [jenis, setJenis] = useState<string[]>([...jenisPilihan]);
  const [hargaMax, setHargaMax] = useState(100000);

  const hasil = useMemo(() => {
    const kata = query.trim().toLowerCase();
    return produkList.filter((item) => {
      const cocokNama =
        kata === "" || item.namaProduk.toLowerCase().includes(kata);
      const cocokJenis = jenis.includes(item.jenisProduk);
      const harga = Number(item.hargaProduk);
      return cocokNama && cocokJenis && harga <= hargaMax;
    });
  }, [jenis, hargaMax, produkList, query]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-(--hx-canvas) font-(family-name:--font-plus-jakarta-sans) text-(--hx-ink)">
      <main className="relative z-10 container mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="mb-10">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hx-ink-3)">
            Toko
          </span>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Waste & <span className="text-(--hx-accent)">Wishes</span>
          </h1>
          <div className="mt-4 h-0.5 w-16 rounded-full bg-(--hx-accent)" />
        </div>

        <div className="grid grid-cols-[170px_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          <aside className="sticky top-4 h-fit space-y-5 rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-4 sm:p-5">
            <div>
              <label
                htmlFor="cari-produk"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hx-ink-3)"
              >
                Cari produk
              </label>
              <input
                id="cari-produk"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nama produk"
                className="w-full rounded-lg border border-(--hx-pastel) bg-white px-3 py-2 text-sm outline-none focus:border-(--hx-accent)"
              />
            </div>
            <div className="border-t border-(--hx-pastel)/40 pt-4">
              <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hx-ink-3)">
                Harga maksimal
              </span>
              <input
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={hargaMax}
                onChange={(event) => setHargaMax(Number(event.target.value))}
                className="w-full accent-(--hx-accent)"
              />
              <span className="text-xs text-(--hx-ink-2)">
                {rupiah(hargaMax)}
              </span>
            </div>
            <div className="border-t border-(--hx-pastel)/40 pt-4">
              <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hx-ink-3)">
                Jenis
              </span>
              {jenisPilihan.map((pilihan) => (
                <label
                  key={pilihan}
                  className="mb-2 flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={jenis.includes(pilihan)}
                    onChange={() =>
                      setJenis((nilai) =>
                        nilai.includes(pilihan)
                          ? nilai.filter((item) => item !== pilihan)
                          : [...nilai, pilihan],
                      )
                    }
                    className="accent-(--hx-accent)"
                  />
                  {pilihan}
                </label>
              ))}
            </div>
          </aside>

          <section>
            {hasil.length === 0 ? (
              <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-12 text-center text-sm text-(--hx-ink-2)">
                Tidak ada produk aktif yang cocok dengan filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                {hasil.map((item) => (
                  <Link
                    key={item.idProduk}
                    href={`/store/detail/${item.idProduk}`}
                    className="hx-card group p-3"
                  >
                    <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-(--hx-sunk)">
                      {item.gambarUrl ? (
                        <img
                          src={item.gambarUrl}
                          alt={item.namaProduk}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-sm text-(--hx-ink-3)">
                          Tidak ada gambar
                        </span>
                      )}
                    </div>
                    <div className="px-1 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--hx-accent)">
                        {item.jenisProduk}
                      </span>
                      <h2 className="mt-1 text-sm font-medium group-hover:text-(--hx-accent)">
                        {item.namaProduk}
                      </h2>
                      <p className="mt-1 text-sm font-semibold">
                        {rupiah(Number(item.hargaProduk))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
