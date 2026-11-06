import Image from "next/image";
import AnimatedCounter from "@/components/AnimatedCounter";
import EventSliderServer from "@/components/event-slider/EventSliderServer";
import { Suspense } from "react";
import EventSliderKerangka from "@/components/event-slider/EventSliderKerangka";

/* ─── Hero Background Image (Bumi Hijau) ─── */
const HERO_BG_IMAGE = "/background/background.jpg";

/* ─── Halaman Utama (Home Page) ─── */
export default async function Home() {


  return (
    <div className="relative min-h-screen bg-(--hx-canvas) text-(--hx-ink) font-(family-name:--font-inter) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark) overflow-hidden">
      {/* ── Background Image Layer (Bumi Hijau + Blur Halus) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 right-0 h-180 md:h-205 overflow-hidden select-none z-0"
      >
        {/* Gambar bumi: hue-rotate mengubah biru → hijau, blur tipis */}
        <Image
          src={HERO_BG_IMAGE}
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover object-center scale-110 opacity-60"
          style={{ filter: "hue-rotate(-80deg) saturate(1.25) blur(3px)" }}
        />

        {/* Tint hijau tosca agar warna konsisten dengan brand (--hx-accent) */}
        <div className="absolute inset-0 bg-(--hx-accent)/20 mix-blend-color" />

        {/* Wash lembut supaya teks tetap terbaca */}
        <div className="absolute inset-0 bg-(--hx-canvas)/35" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-(--hx-canvas)/50 to-(--hx-canvas)" />
        <div className="absolute inset-0 bg-linear-to-r from-(--hx-canvas)/80 via-(--hx-canvas)/30 to-transparent" />

        {/* Ambient Blobs & Dot Grid */}
        <div className="hx-ambient-blob-1 opacity-40" />
        <div className="hx-ambient-blob-2 opacity-30" />
        <div className="hx-ambient-blob-3 opacity-30" />
        <div className="hx-dot-grid opacity-20" />
      </div>

      <div className="relative z-10">
        {/* ══════════════════════════════════════════════════════════════
            1. BAGIAN ATAS (Hero Section): "Ubah Sampah Organik Menjadi Berkah"
           ══════════════════════════════════════════════════════════════ */}
        <section className="container mx-auto px-4 py-16 md:py-20 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Kolom Kiri: Copywriting & Call to Action */}
            <div>
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-3">
                Solusi Sirkular Ekonomi
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-6 leading-tight">
                Ubah Sampah Organik Menjadi{" "}
                <span className="text-(--hx-accent)">Berkah</span>
              </h1>

              <p className="text-base md:text-lg text-(--hx-ink-2) font-light mb-8 leading-relaxed max-w-xl">
                Waste &amp; Wishes hadir sebagai inisiatif nyata pengelolaan
                limbah organik rumah tangga dan UMKM di wilayah Gejayan serta
                Wedomartani. Melalui teknologi biokonversi maggot BSF (Black
                Soldier Fly), kami mengubah masalah sampah menjadi pakan ternak
                berprotein tinggi dan pupuk organik berkualitas demi bumi yang
                lebih lestari.
              </p>

              {/* Tombol Helix Drift Style (Pill, Uppercase, Flat Architectural) */}
              <div className="flex flex-wrap gap-4">
                <a
                  href="/langganan"
                  className="inline-flex items-center justify-center rounded-full bg-(--hx-accent) px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-(--hx-accent-dark) transition-colors shadow-xs"
                >
                  Mulai Berlangganan
                </a>
                <a
                  href="#layanan"
                  className="inline-flex items-center justify-center rounded-full border border-(--hx-pastel) bg-white/80 backdrop-blur-sm px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-(--hx-ink-2) hover:border-(--hx-accent) hover:text-(--hx-accent) hover:bg-white transition-colors"
                >
                  Pelajari Layanan
                </a>
              </div>
            </div>

            {/* Kolom Kanan: Kartu Sorotan Fitur (Frosted Glass di atas Background Gambar) */}
            <div className="relative">
              {/* Glow Aksen Tosca di Belakang Kartu */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 sm:-inset-6 rounded-3xl bg-linear-to-tr from-(--hx-accent)/25 via-(--hx-pastel)/30 to-transparent blur-2xl -z-10"
              />

              <div className="relative rounded-2xl border border-white/70 bg-white/80 p-8 shadow-[0_16px_40px_rgba(27,34,51,0.06)] backdrop-blur-md">
                <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase mb-3">
                  Biokonversi Alami
                </span>
                <h3 className="text-2xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-3">
                  Teknologi untuk Kesehatan Bumi
                </h3>
                <p className="text-(--hx-ink-2) text-sm font-light leading-relaxed mb-6">
                  Setiap kilogram sampah organik yang disetorkan akan langsung
                  diurai tuntas oleh pasukan maggot BSF. Proses alami ini
                  memangkas produksi gas metana berbahaya di TPA sekaligus
                  menghasilkan pupuk kasgot bernutrisi dan pakan ternak mandiri
                  berdaya saing tinggi.
                </p>
                <div className="rounded-lg bg-(--hx-canvas)/90 border border-(--hx-pastel)/50 px-4 py-2.5 text-xs text-(--hx-ink-2) font-medium inline-block">
                  Cakupan Wilayah: Wedomartani, Gejayan &amp; Sekitarnya
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            2. BAGIAN TENGAH (Event Slider): Komponen Galeri Helix Drift
           ══════════════════════════════════════════════════════════════ */}
        {/* <EventSlider events={sliderEvents} loggedIn={loggedIn} /> */}
        <Suspense fallback={<EventSliderKerangka/>} ><EventSliderServer /></Suspense>

        {/* ══════════════════════════════════════════════════════════════
            3. BAGIAN BAWAH: Layanan Utama Kami & Statistik
           ══════════════════════════════════════════════════════════════ */}
        <section
          id="layanan"
          className="relative py-16 md:py-24 border-t border-(--hx-pastel)/40"
        >
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Header Layanan */}
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                Solusi Terpadu
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
                Layanan Utama Kami
              </h2>
              <p className="mt-3 text-base text-(--hx-ink-2) leading-relaxed">
                Solusi terintegrasi dari Waste &amp; Wishes untuk menuntaskan
                krisis sampah organik dan menumbuhkan dampak ekonomi sirkular
                masyarakat.
              </p>
              <div className="mx-auto bg-(--hx-accent) h-0.5 w-16 rounded-full mt-4" />
            </div>

            {/* Grid Kartu Layanan */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* Card 1: Penjemputan Sampah Organik */}
              <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-7 md:p-8 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm transition hover:border-(--hx-accent)/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase">
                      01 / Penjemputan
                    </span>
                    <span className="rounded-full bg-white/90 border border-(--hx-pastel) px-3 py-0.5 text-[10px] font-semibold tracking-widest uppercase text-(--hx-accent)">
                      Paling Diminati
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-3">
                    Penjemputan Sampah Organik
                  </h3>
                  <p className="text-sm leading-relaxed text-(--hx-ink-2) font-light mb-6">
                    Layanan penjemputan terjadwal langsung dari depan pintu
                    rumah tangga, cafe, restoran, dan UMKM. Cukup pilah sampah
                    dapur Anda, armada kami akan menjemputnya secara berkala
                    dengan wadah bersih berstandar sanitasi.
                  </p>

                  {/* Fitur Layanan Tanpa Ikon */}
                  <ul className="space-y-2 mb-8 text-xs text-(--hx-ink-2) border-t border-(--hx-pastel)/30 pt-4">
                    <li>
                      — Wadah ember khusus terstandar kedap bau &amp; anti bocor
                    </li>
                    <li>
                      — Jadwal penjemputan teratur &amp; terintegrasi sistem
                      digital
                    </li>
                    <li>
                      — Laporan berkala volume sampah terkelola &amp; reduksi
                      emisi
                    </li>
                  </ul>
                </div>

                <div>
                  <a
                    href="/langganan"
                    className="inline-flex w-full items-center justify-center rounded-full bg-(--hx-accent) px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-(--hx-accent-dark) transition-colors sm:w-auto"
                  >
                    Cek Paket Langganan
                  </a>
                </div>
              </div>

              {/* Card 2: Edukasi & Pendampingan */}
              <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-7 md:p-8 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm transition hover:border-(--hx-accent)/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase">
                      02 / Edukasi
                    </span>
                    <span className="rounded-full bg-white/90 border border-(--hx-pastel) px-3 py-0.5 text-[10px] font-semibold tracking-widest uppercase text-(--hx-ink-2)">
                      Program Kolaborasi
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-3">
                    Edukasi &amp; Pendampingan
                  </h3>
                  <p className="text-sm leading-relaxed text-(--hx-ink-2) font-light mb-6">
                    Program pelatihan intensif mengenai teknik budidaya maggot
                    BSF, pembuatan pupuk organik padat dan cair, serta gerakan
                    gaya hidup minim sampah. Cocok bagi komunitas warga,
                    sekolah, institusi, maupun kelompok tani binaan.
                  </p>

                  {/* Fitur Layanan Tanpa Ikon */}
                  <ul className="space-y-2 mb-8 text-xs text-(--hx-ink-2) border-t border-(--hx-pastel)/30 pt-4">
                    <li>
                      — Bimbingan teknis budidaya maggot dari telur sampai panen
                    </li>
                    <li>
                      — Panduan praktis pemilahan sampah organik langsung dari
                      sumber
                    </li>
                    <li>
                      — Fasilitasi starter kit edukasi &amp; e-sertifikat
                      kegiatan resmi
                    </li>
                  </ul>
                </div>

                <div>
                  <a
                    href="/event"
                    className="inline-flex w-full items-center justify-center rounded-full border border-(--hx-pastel) bg-white/80 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-(--hx-ink-2) backdrop-blur-sm hover:border-(--hx-accent) hover:text-(--hx-accent) hover:bg-white transition-colors sm:w-auto"
                  >
                    Lihat Jadwal Terdekat
                  </a>
                </div>
              </div>
            </div>

            {/* ── Komponen Statistik (Facts Grid Khas Helix Drift seperti di app/event/page) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-(--hx-pastel)/40 rounded-2xl overflow-hidden border border-(--hx-pastel)/40 shadow-sm">
              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-6 sm:p-8 text-center">
                <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                  Limbah Organik Terolah
                </span>
                <AnimatedCounter value={18} suffix="+ Ton" />
                <span className="text-xs text-(--hx-ink-2) mt-1 block">
                  Tereduksi dari beban TPA Piyungan
                </span>
              </div>
              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-6 sm:p-8 text-center">
                <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                  Mitra Rumah Tangga &amp; UMKM
                </span>
                <AnimatedCounter value={250} suffix="+" />
                <span className="text-xs text-(--hx-ink-2) mt-1 block">
                  Warga &amp; pelaku usaha aktif
                </span>
              </div>
              <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-6 sm:p-8 text-center">
                <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                  Event Edukasi Terlaksana
                </span>
                <AnimatedCounter value={45} suffix="+" />
                <span className="text-xs text-(--hx-ink-2) mt-1 block">
                  Workshop, sosialisasi &amp; aksi bersih
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
