"use client";

import { useState } from "react";
import Link from "next/link";

type ItemKeranjang = {
  id: number;
  nama: string;
  harga: number;
  jenis: string;
  img?: string;
  jumlah: number;
  stok: number;
  berat?: string;
  catatan?: string;
};

const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

export default function KeranjangPage() {
  const [items, setItems] = useState<ItemKeranjang[]>(() => {
    // Lazy initialization - hanya dijalankan sekali saat mount
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("keranjang") || "[]");
      } catch {
        return [];
      }
    }
    return [];
  });

  const updateJumlah = (id: number, jumlahBaru: number) => {
    const itemsBaru = items.map((item) =>
      item.id === id
        ? { ...item, jumlah: Math.min(Math.max(1, jumlahBaru), item.stok) }
        : item
    );
    setItems(itemsBaru);
    localStorage.setItem("keranjang", JSON.stringify(itemsBaru));
  };

  const hapusItem = (id: number) => {
    const itemsBaru = items.filter((item) => item.id !== id);
    setItems(itemsBaru);
    localStorage.setItem("keranjang", JSON.stringify(itemsBaru));
  };

  const subtotal = items.reduce((acc, item) => acc + item.harga * item.jumlah, 0);
  const ongkir = 15000;
  const total = subtotal + ongkir;

  if (items.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-(--hx-canvas) font-(family-name:--font-plus-jakarta-sans) text-(--hx-ink) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark)">
        {/* Background ambient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[720px] select-none overflow-hidden"
        >
          <div className="hx-ambient-blob-1 opacity-40" />
          <div className="hx-ambient-blob-2 opacity-30" />
          <div className="hx-ambient-blob-3 opacity-30" />
          <div className="hx-dot-grid opacity-20" />
        </div>

        <main className="relative z-10 container mx-auto max-w-7xl px-4 py-20">
          <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-12 text-center shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
            <svg
              className="mx-auto mb-6 h-20 w-20 text-(--hx-pastel)"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            <h1 className="mb-4 text-2xl font-semibold text-(--hx-ink)">
              Keranjang Kosong
            </h1>
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--hx-canvas) font-(family-name:--font-plus-jakarta-sans) text-(--hx-ink) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark)">
      {/* Background ambient */}
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
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-(--hx-ink-2)">
            <Link href="/store" className="hover:text-(--hx-accent) transition-colors">
              Toko
            </Link>
            <span>/</span>
            <span className="text-(--hx-ink)">Keranjang</span>
          </nav>

          <h1 className="font-(family-name:--font-plus-jakarta-sans) text-3xl font-semibold tracking-tight sm:text-4xl">
            Keranjang <span className="text-(--hx-accent)">Belanja</span>
          </h1>
          <div className="mt-4 h-0.5 w-16 rounded-full bg-(--hx-accent)" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          {/* Daftar Item Keranjang */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-4 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Gambar Produk */}
                  <Link
                    href={`/store/detail/${item.id}`}
                    className="flex-shrink-0"
                  >
                    <div className="h-24 w-24 overflow-hidden rounded-xl bg-(--hx-sunk)">
                      {item.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.img}
                          alt={item.nama}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--hx-pastel)"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <circle cx="15.5" cy="8.5" r="1.8" />
                            <path d="m3 17 5-5 4 4 3-3 6 6" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info Produk */}
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <Link
                        href={`/store/detail/${item.id}`}
                        className="group"
                      >
                        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-(--hx-accent)">
                          {item.jenis}
                        </span>
                        <h3 className="text-base font-medium text-(--hx-ink) group-hover:text-(--hx-accent) transition-colors">
                          {item.nama}
                        </h3>
                      </Link>
                      <p className="mt-1 font-(family-name:--font-plus-jakarta-sans) text-lg font-semibold text-(--hx-accent)">
                        {rupiah(item.harga)}
                      </p>
                    </div>

                    {/* Kontrol Jumlah */}
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateJumlah(item.id, item.jumlah - 1)}
                          disabled={item.jumlah <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--hx-pastel) text-(--hx-ink-2) transition-colors hover:border-(--hx-accent) hover:text-(--hx-accent) disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Kurangi jumlah"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          </svg>
                        </button>

                        <span className="flex h-8 w-12 items-center justify-center rounded-lg border border-(--hx-pastel) bg-white text-sm font-medium text-(--hx-ink)">
                          {item.jumlah}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateJumlah(item.id, item.jumlah + 1)}
                          disabled={item.jumlah >= item.stok}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--hx-pastel) text-(--hx-ink-2) transition-colors hover:border-(--hx-accent) hover:text-(--hx-accent) disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Tambah jumlah"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => hapusItem(item.id)}
                        className="flex items-center gap-1.5 text-xs text-(--hx-ink-3) transition-colors hover:text-red-500"
                        aria-label={`Hapus ${item.nama}`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m19 7-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"
                          />
                        </svg>
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ringkasan Pesanan */}
          <div className="h-fit space-y-4">
            <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-6 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
              <h2 className="mb-4 text-lg font-semibold text-(--hx-ink)">
                Ringkasan Pesanan
              </h2>

              <div className="space-y-3 border-b border-(--hx-pastel)/40 pb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-(--hx-ink-2)">
                    Subtotal ({items.length} produk)
                  </span>
                  <span className="font-medium text-(--hx-ink)">
                    {rupiah(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-(--hx-ink-2)">Ongkos Kirim</span>
                  <span className="font-medium text-(--hx-ink)">
                    {rupiah(ongkir)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-4">
                <span className="text-base font-semibold text-(--hx-ink)">
                  Total
                </span>
                <span className="font-(family-name:--font-plus-jakarta-sans) text-2xl font-bold text-(--hx-accent)">
                  {rupiah(total)}
                </span>
              </div>

              <button
                type="button"
                className="hx-btn-primary mb-3 w-full"
              >
                Checkout
              </button>

              <Link href="/store" className="hx-btn-outline w-full">
                Lanjut Belanja
              </Link>
            </div>

            {/* Info Tambahan */}
            <div className="rounded-xl border border-(--hx-pastel)/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-(--hx-accent)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <div>
                  <h3 className="mb-1 text-sm font-semibold text-(--hx-ink)">
                    Catatan Pengiriman
                  </h3>
                  <p className="text-xs leading-relaxed text-(--hx-ink-2)">
                    Estimasi pengiriman 2-3 hari kerja untuk wilayah Jabodetabek.
                    Pesanan akan dikonfirmasi melalui WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
