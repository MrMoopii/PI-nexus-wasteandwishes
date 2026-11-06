"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { produk } from "@/lib/db/schema";
import { tambahKeKeranjang as tambahKeKeranjangServer } from "../../keranjang/actions";

type Produk = typeof produk.$inferSelect;

function rupiah(nilai: number): string {
  return `Rp${nilai.toLocaleString("id-ID")}`;
}

export default function DetailProdukClient({
  produkUtama,
  produkLainnya,
}: {
  produkUtama: Produk;
  produkLainnya: Produk[];
}) {
  const router = useRouter();
  const [jumlah, setJumlah] = useState(1);
  const [pesanKeranjang, setPesanKeranjang] = useState<string | null>(null);
  const [sedangMenambah, setSedangMenambah] = useState(false);
  const harga = Number(produkUtama.hargaProduk);
  const stokHabis = produkUtama.jumlahStok === 0;

  function ubahJumlah(nilai: number): void {
    if (!Number.isInteger(nilai)) return;
    setJumlah(Math.min(Math.max(1, nilai), produkUtama.jumlahStok));
  }

  function tambahKeKeranjang(): void {
    if (stokHabis || sedangMenambah) return;

    setSedangMenambah(true);
    setPesanKeranjang(null);
    startTransition(async () => {
      const hasil = await tambahKeKeranjangServer({
        produkId: produkUtama.idProduk,
        jumlah,
      });
      setSedangMenambah(false);

      if (!hasil.ok) {
        if (hasil.status === 401) {
          router.push("/auth/login");
          return;
        }
        setPesanKeranjang(hasil.error);
        return;
      }

      router.push("/store/keranjang");
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--hx-canvas) font-(family-name:--font-plus-jakarta-sans) text-(--hx-ink)">
      <main className="relative z-10 container mx-auto max-w-7xl px-4 py-10 md:py-14">
        <nav className="mb-8 flex items-center gap-2 text-sm text-(--hx-ink-2)">
          <Link href="/store" className="hover:text-(--hx-accent)">Toko</Link>
          <span>/</span>
          <span className="text-(--hx-ink)">{produkUtama.namaProduk}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <section className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-6">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-(--hx-sunk)">
              {produkUtama.gambarUrl ? <img src={produkUtama.gambarUrl} alt={produkUtama.namaProduk} className="h-full w-full object-cover" /> : <span className="text-sm text-(--hx-ink-3)">Tidak ada gambar produk</span>}
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="rounded-full border border-(--hx-pastel) px-3 py-1">{produkUtama.jenisProduk}</span>
              <span className="rounded-full border border-(--hx-pastel) px-3 py-1">{produkUtama.berat ?? "Berat belum dicantumkan"}</span>
            </div>
            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-(--hx-ink-3)">Deskripsi Produk</h2>
              <p className="text-sm leading-relaxed text-(--hx-ink-2)">{produkUtama.deskripsi ?? "Deskripsi belum tersedia."}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hx-accent)">{produkUtama.jenisProduk}</span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{produkUtama.namaProduk}</h1>
            <p className="mt-4 text-4xl font-bold text-(--hx-accent)">{rupiah(harga)}</p>

            <div className="my-6 flex justify-between rounded-xl border border-(--hx-pastel)/40 bg-(--hx-sunk)/20 p-4 text-sm">
              <span className="text-(--hx-ink-3)">Stok tersedia</span>
              <span className="font-semibold">{produkUtama.jumlahStok}</span>
            </div>

            <div className="rounded-xl border border-(--hx-pastel)/60 p-5">
              <label htmlFor="jumlah-produk" className="mb-3 block text-sm font-semibold">Jumlah</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => ubahJumlah(jumlah - 1)} disabled={jumlah <= 1 || stokHabis || sedangMenambah} className="h-8 w-8 rounded-lg border border-(--hx-pastel) disabled:opacity-40" aria-label="Kurangi jumlah">−</button>
                <input id="jumlah-produk" type="number" min="1" max={produkUtama.jumlahStok} value={jumlah} disabled={stokHabis || sedangMenambah} onChange={(event) => ubahJumlah(Number(event.target.value))} className="w-16 rounded-lg border border-(--hx-pastel) py-1 text-center" />
                <button type="button" onClick={() => ubahJumlah(jumlah + 1)} disabled={jumlah >= produkUtama.jumlahStok || stokHabis || sedangMenambah} className="h-8 w-8 rounded-lg border border-(--hx-pastel) disabled:opacity-40" aria-label="Tambah jumlah">+</button>
              </div>
              <div className="my-4 flex justify-between border-t border-(--hx-pastel)/40 pt-4">
                <span>Subtotal</span>
                <span className="font-bold">{rupiah(harga * jumlah)}</span>
              </div>
              {pesanKeranjang && <p role="alert" className="mb-3 text-sm text-red-600">{pesanKeranjang}</p>}
              <button type="button" className="hx-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50" onClick={tambahKeKeranjang} disabled={stokHabis || sedangMenambah}>
                {stokHabis ? "Stok Habis" : sedangMenambah ? "Menambahkan..." : "+ Keranjang"}
              </button>
            </div>
          </section>
        </div>

        {produkLainnya.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Produk Lainnya</h2>
              <Link href="/store" className="text-sm text-(--hx-accent) hover:underline">Lihat Semua</Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {produkLainnya.map((item) => (
                <Link key={item.idProduk} href={`/store/detail/${item.idProduk}`} className="hx-card group p-3">
                  <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-(--hx-sunk)">
                    {item.gambarUrl ? <img src={item.gambarUrl} alt={item.namaProduk} className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <span className="text-sm text-(--hx-ink-3)">Tidak ada gambar</span>}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--hx-accent)">{item.jenisProduk}</span>
                  <h3 className="mt-1 text-sm font-medium group-hover:text-(--hx-accent)">{item.namaProduk}</h3>
                  <p className="mt-1 text-sm font-semibold">{rupiah(Number(item.hargaProduk))}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
