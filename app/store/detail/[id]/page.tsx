"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Produk = {
  id: number;
  nama: string;
  harga: number;
  jenis: "Pupuk" | "Olahan Maggot" | "Pakan Ternak";
  waktuDitambahkan: string;
  img?: string;
  deskripsi: string;
  stok: number;
  berat: string;
};

const PRODUK_DATA: Produk[] = [
  {
    id: 1,
    nama: "Magot Segar",
    harga: 20000,
    jenis: "Olahan Maggot",
    waktuDitambahkan: "2026-11-05T08:00:00.000Z",
    img: "/img/produk/1.png",
    deskripsi:
      "Maggot segar berkualitas tinggi dari Black Soldier Fly (BSF) yang dibudidayakan secara organik. Cocok untuk pakan ternak seperti ikan, burung, dan unggas. Kaya protein dan nutrisi alami untuk pertumbuhan optimal hewan ternak Anda.",
    stok: 50,
    berat: "1 Kg",
  },
  {
    id: 2,
    nama: "Magot Proses",
    harga: 35000,
    jenis: "Olahan Maggot",
    waktuDitambahkan: "2026-11-04T10:30:00.000Z",
    img: "/img/produk/2.png",
    deskripsi:
      "Maggot yang telah diproses dan dikeringkan untuk kemudahan penyimpanan dan penggunaan jangka panjang. Kandungan protein tetap terjaga, praktis, dan higienis. Ideal untuk pakan burung, ikan hias, dan reptil.",
    stok: 30,
    berat: "500 g",
  },
  {
    id: 3,
    nama: "Pupuk Kasgot",
    harga: 15000,
    jenis: "Pupuk",
    waktuDitambahkan: "2026-11-04T16:00:00.000Z",
    img: "/img/produk/3.png",
    deskripsi:
      "Pupuk organik Kasgot (Kascing Maggot) hasil olahan limbah organik melalui proses budidaya maggot BSF. Kaya akan nutrisi mikro dan makro untuk menyuburkan tanah dan tanaman. Ramah lingkungan dan meningkatkan kualitas hasil panen secara alami.",
    stok: 100,
    berat: "1 Kg",
  },
  {
    id: 4,
    nama: "waWas Waste Box",
    harga: 50000,
    jenis: "Pakan Ternak",
    waktuDitambahkan: "2026-10-29T11:45:00.000Z",
    img: "/img/produk/4.png",
    deskripsi:
      "Paket starter kit lengkap untuk memulai budidaya maggot BSF di rumah. Berisi box khusus, panduan lengkap, dan akses konsultasi gratis. Solusi praktis untuk mengelola sampah organik rumah tangga sekaligus menghasilkan pupuk dan pakan ternak sendiri.",
    stok: 15,
    berat: "1 Set",
  },
];

const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

function DetailProdukContent() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const produk = PRODUK_DATA.find((p) => p.id === id);
  const [jumlah, setJumlah] = useState(1);
  const [catatan, setCatatan] = useState("");

  const tambahKeKeranjang = () => {
    if (!produk) return;

    const keranjang = JSON.parse(localStorage.getItem("keranjang") || "[]");
    const itemAda = keranjang.find((item: { id: number }) => item.id === produk.id);

    if (itemAda) {
      const keranjangBaru = keranjang.map((item: { id: number; jumlah: number }) =>
        item.id === produk.id
          ? { ...item, jumlah: Math.min(item.jumlah + jumlah, produk.stok) }
          : item
      );
      localStorage.setItem("keranjang", JSON.stringify(keranjangBaru));
    } else {
      keranjang.push({
        id: produk.id,
        nama: produk.nama,
        harga: produk.harga,
        jenis: produk.jenis,
        img: produk.img,
        jumlah: jumlah,
        stok: produk.stok,
        berat: produk.berat,
        catatan: catatan,
      });
      localStorage.setItem("keranjang", JSON.stringify(keranjang));
    }

    router.push("/store/keranjang");
  };

  if (!produk) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-(--hx-canvas) font-(family-name:--font-plus-jakarta-sans) text-(--hx-ink)">
        <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="mb-4 text-2xl font-semibold">Produk tidak ditemukan</h1>
          <Link href="/store" className="text-(--hx-accent) hover:underline">
            Kembali ke Toko
          </Link>
        </div>
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
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-(--hx-ink-2)">
          <Link href="/store" className="hover:text-(--hx-accent) transition-colors">
            Toko
          </Link>
          <span>/</span>
          <span className="text-(--hx-ink)">{produk.nama}</span>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Gambar Produk */}
          <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-6 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
            <div className="aspect-square overflow-hidden rounded-xl bg-(--hx-sunk)">
              {produk.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={produk.img}
                  alt={produk.nama}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--hx-pastel)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="15.5" cy="8.5" r="1.8" />
                    <path d="m3 17 5-5 4 4 3-3 6 6" />
                  </svg>
                </div>
              )}
            </div>

            {/* Badge Jenis */}
            <div className="mt-4 flex gap-2">
              <span className="inline-block rounded-full border border-(--hx-pastel) bg-(--hx-canvas) px-3 py-1 text-xs font-medium text-(--hx-ink-2)">
                {produk.jenis}
              </span>
              <span className="inline-block rounded-full border border-(--hx-pastel) bg-(--hx-canvas) px-3 py-1 text-xs font-medium text-(--hx-ink-2)">
                {produk.berat}
              </span>
            </div>

            {/* Deskripsi */}
            <div className="mt-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-(--hx-ink-3)">
                Deskripsi Produk
              </h2>
              <p className="leading-relaxed text-sm text-(--hx-ink-2)">
                {produk.deskripsi}
              </p>
            </div>
          </div>

          {/* Info Produk */}
          <div className="flex flex-col">
            <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-6 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
              {/* Nama & Harga */}
              <div className="mb-6 border-b border-(--hx-pastel)/40 pb-6">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hx-accent)">
                  {produk.jenis}
                </span>
                <h1 className="mb-4 font-(family-name:--font-plus-jakarta-sans) text-3xl font-semibold tracking-tight text-(--hx-ink)">
                  {produk.nama}
                </h1>
                <p className="font-(family-name:--font-plus-jakarta-sans) text-4xl font-bold text-(--hx-accent)">
                  {rupiah(produk.harga)}
                </p>
              </div>

              {/* Detail Info */}
              <div className="mb-6 space-y-3 rounded-xl border border-(--hx-pastel)/40 bg-(--hx-sunk)/20 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-(--hx-ink-3)">Berat</span>
                  <span className="font-medium text-(--hx-ink)">{produk.berat}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-(--hx-ink-3)">Kondisi</span>
                  <span className="font-medium text-(--hx-ink)">Baru</span>
                </div>
              </div>

              {/* Atur Jumlah dan Catatan */}
              <div className="mb-6 rounded-xl border border-(--hx-pastel)/60 bg-white/90 p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-(--hx-ink)">
                  Atur jumlah dan catatan
                </h3>

                {/* Quantity Control */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setJumlah(Math.max(1, jumlah - 1))}
                      disabled={jumlah <= 1}
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

                    <input
                      type="number"
                      min="1"
                      max={produk.stok}
                      value={jumlah}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setJumlah(Math.min(Math.max(1, val), produk.stok));
                      }}
                      className="w-16 rounded-lg border border-(--hx-pastel) bg-white px-3 py-1.5 text-center text-sm font-medium text-(--hx-ink) focus:border-(--hx-accent) focus:outline-none"
                      aria-label="Jumlah produk"
                    />

                    <button
                      type="button"
                      onClick={() => setJumlah(Math.min(produk.stok, jumlah + 1))}
                      disabled={jumlah >= produk.stok}
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

                  <div className="text-sm">
                    <span className="text-(--hx-ink-3)">Stok: </span>
                    <span className="font-semibold text-(--hx-accent)">
                      Sisa {produk.stok}
                    </span>
                  </div>
                </div>

                {/* Catatan */}
                <div className="mb-4">
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tambahkan catatan untuk penjual (opsional)"
                    rows={3}
                    className="w-full rounded-lg border border-(--hx-pastel) bg-white px-3 py-2 text-sm text-(--hx-ink) placeholder:text-(--hx-ink-3) focus:border-(--hx-accent) focus:outline-none"
                  />
                </div>

                {/* Subtotal */}
                <div className="mb-4 flex items-center justify-between border-t border-(--hx-pastel)/40 pt-4">
                  <span className="text-sm text-(--hx-ink-2)">Subtotal</span>
                  <span className="font-(family-name:--font-plus-jakarta-sans) text-xl font-bold text-(--hx-ink)">
                    {rupiah(produk.harga * jumlah)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    type="button"
                    className="hx-btn-primary w-full"
                    onClick={tambahKeKeranjang}
                  >
                    + Keranjang
                  </button>

                  <button
                    type="button"
                    className="hx-btn-outline w-full"
                  >
                    Beli Langsung
                  </button>
                </div>
              </div>

              {/* Back Button */}
              <Link href="/store" className="hx-btn-outline w-full">
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Kembali ke Toko
              </Link>
            </div>
          </div>
        </div>

        {/* Produk Lainnya */}
        <section className="mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-(family-name:--font-plus-jakarta-sans) text-2xl font-semibold">
              Produk Lainnya
            </h2>
            <Link
              href="/store"
              className="text-sm text-(--hx-accent) hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {PRODUK_DATA.filter((p) => p.id !== produk.id).map((p) => (
              <Link
                key={p.id}
                href={`/store/detail/${p.id}`}
                className="hx-card group p-3"
              >
                <div className="mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-(--hx-sunk)">
                  {p.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.img}
                      alt={p.nama}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <svg
                      width="72"
                      height="72"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--hx-pastel)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
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
                  <h3 className="mt-1 text-sm font-medium text-(--hx-ink) group-hover:text-(--hx-accent) transition-colors">
                    {p.nama}
                  </h3>
                  <p className="mt-1 font-(family-name:--font-plus-jakarta-sans) text-sm font-semibold text-(--hx-ink)">
                    {rupiah(p.harga)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DetailProdukPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen overflow-hidden bg-(--hx-canvas) font-(family-name:--font-plus-jakarta-sans) text-(--hx-ink)">
        <div className="container mx-auto max-w-7xl px-4 py-20 text-center">
          <p className="text-(--hx-ink-2)">Memuat produk...</p>
        </div>
      </div>
    }>
      <DetailProdukContent />
    </Suspense>
  );
}
