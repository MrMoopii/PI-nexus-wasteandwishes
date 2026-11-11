"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  hapusDariKeranjang,
  ubahJumlahKeranjang,
  type ItemKeranjang,
} from "@/app/store/keranjang/actions";

const rupiah = (nilai: number): string => `Rp${nilai.toLocaleString("id-ID")}`;

export default function KeranjangClient({
  itemsAwal,
}: {
  itemsAwal: ItemKeranjang[];
}) {
  const [items, setItems] = useState(itemsAwal);
  const [pesan, setPesan] = useState<string | null>(null);

  const [sedangMemproses, mulaiTransisi] = useTransition();

  function updateJumlah(item: ItemKeranjang, jumlahBaru: number): void {
    if (
      !(Number.isInteger(jumlahBaru) && jumlahBaru > 0) ||
      jumlahBaru > item.stok
    ) {
      return;
    }

    setPesan(null);
    mulaiTransisi(async () => {
      const hasil = await ubahJumlahKeranjang(item.id, jumlahBaru);
      if (!hasil.ok) {
        setPesan(hasil.error);
        return;
      }
      setItems((nilai) =>
        nilai.map((baris) =>
          baris.id === item.id ? { ...baris, jumlah: jumlahBaru } : baris,
        ),
      );
    });
  }

  function hapusItem(id: number): void {
    setPesan(null);
    mulaiTransisi(async () => {
      const hasil = await hapusDariKeranjang(id);
      if (!hasil.ok) {
        setPesan(hasil.error);
        return;
      }
      setItems((nilai) => nilai.filter((item) => item.id !== id));
    });
  }

  if (items.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-(--hx-canvas) font-(family-name:--font-plus-jakarta-sans) text-(--hx-ink)">
        <main className="relative z-10 container mx-auto max-w-7xl px-4 py-20">
          <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-12 text-center">
            <h1 className="mb-4 text-2xl font-semibold">Keranjang Kosong</h1>
            <p className="mb-6 text-sm text-(--hx-ink-2)">
              Belum ada produk di keranjang Anda. Yuk, mulai berbelanja!
            </p>
            <Link href="/store" className="hx-btn-primary">
              Belanja Sekarang
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const subtotal = items.reduce(
    (total, item) => total + item.harga * item.jumlah,
    0,
  );
  const ongkir = 15000;
  const total = subtotal + ongkir;

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--hx-canvas) font-(family-name:--font-plus-jakarta-sans) text-(--hx-ink)">
      <main className="relative z-10 container mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-(--hx-ink-2)">
            <Link href="/store" className="hover:text-(--hx-accent)">
              Toko
            </Link>
            <span>/</span>
            <span>Keranjang</span>
          </nav>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Keranjang <span className="text-(--hx-accent)">Belanja</span>
          </h1>
          <div className="mt-4 h-0.5 w-16 rounded-full bg-(--hx-accent)" />
        </div>

        {pesan && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {pesan}
          </p>
        )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link href={`/store/detail/${item.id}`} className="shrink-0">
                    <div className="h-24 w-24 overflow-hidden rounded-xl bg-(--hx-sunk)">
                      {item.gambarUrl ? (
                        <img
                          src={item.gambarUrl}
                          alt={item.nama}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-(--hx-ink-3)">
                          Tidak ada gambar
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <Link href={`/store/detail/${item.id}`} className="group">
                        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-(--hx-accent)">
                          {item.jenis}
                        </span>
                        <h2 className="text-base font-medium group-hover:text-(--hx-accent)">
                          {item.nama}
                        </h2>
                      </Link>
                      <p className="mt-1 text-lg font-semibold text-(--hx-accent)">
                        {rupiah(item.harga)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateJumlah(item, item.jumlah - 1)}
                          disabled={item.jumlah <= 1 || sedangMemproses}
                          className="h-8 w-8 rounded-lg border border-(--hx-pastel) disabled:opacity-40"
                          aria-label="Kurangi jumlah"
                        >
                          −
                        </button>
                        <span className="flex h-8 w-12 items-center justify-center rounded-lg border border-(--hx-pastel) text-sm">
                          {item.jumlah}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateJumlah(item, item.jumlah + 1)}
                          disabled={item.jumlah >= item.stok || sedangMemproses}
                          className="h-8 w-8 rounded-lg border border-(--hx-pastel) disabled:opacity-40"
                          aria-label="Tambah jumlah"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => hapusItem(item.id)}
                        disabled={sedangMemproses}
                        className="text-xs text-(--hx-ink-3) hover:text-red-500 disabled:opacity-40"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-6">
            <h2 className="mb-4 text-lg font-semibold">Ringkasan Pesanan</h2>
            <div className="space-y-3 border-b border-(--hx-pastel)/40 pb-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} produk)</span>
                <span>{rupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim</span>
                <span>{rupiah(ongkir)}</span>
              </div>
            </div>
            <div className="flex justify-between py-4 font-semibold">
              <span>Total</span>
              <span className="text-xl text-(--hx-accent)">
                {rupiah(total)}
              </span>
            </div>
            <button
              type="button"
              className="hx-btn-primary mb-3 w-full"
              disabled
            >
              Checkout
            </button>
            <Link href="/store" className="hx-btn-outline w-full">
              Lanjut Belanja
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
