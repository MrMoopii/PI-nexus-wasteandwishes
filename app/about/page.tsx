"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Komponen Statistik Animasi Angka ─── */
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

function AnimatedCounter({
  value,
  suffix = "",
  duration = 1400,
  className = "text-2xl md:text-3xl font-light text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || hasAnimated.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start: number | null = null;
          const startValue = 0;

          const animate = (timestamp: number) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const nextValue = Math.round(startValue + (value - startValue) * eased);
            setCount(nextValue);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [duration, value]);

  return (
    <div ref={elementRef} className={className}>
      {count}
      {suffix}
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-(--hx-canvas) text-(--hx-ink) font-(family-name:--font-inter) selection:bg-(--hx-accent)/20 selection:text-(--hx-accent-dark) overflow-hidden">
      {/* Ambient gradient washes matching Helix Drift */}
      <div aria-hidden="true" className="hx-ambient-wash">
        <div className="hx-ambient-blob-1" />
        <div className="hx-ambient-blob-2" />
        <div className="hx-ambient-blob-3" />
      </div>

      <div className="relative z-10">
        {/* Hero Section - Helix Drift Style */}
        <section className="container mx-auto px-4 pt-20 pb-12 md:pt-28 md:pb-16 max-w-4xl text-center">
          <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-4">
            Tentang Kami
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-6 leading-tight">
            Waste &amp; Wishes
          </h1>
          <p className="text-base md:text-lg text-(--hx-ink-2) font-light leading-relaxed max-w-2xl mx-auto">
            Platform pengelolaan sampah organik terintegrasi yang mewujudkan lingkungan bersih dan ekonomi sirkular melalui biokonversi maggot BSF.
          </p>
          <div className="mx-auto bg-(--hx-accent) h-0.5 w-16 rounded-full mt-6" />
        </section>

        {/* Story Section with Image */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Image Column */}
            <div className="order-2 md:order-1">
              <div className="relative rounded-2xl overflow-hidden border border-(--hx-pastel)/60 shadow-[0_8px_30px_rgb(27,34,51,0.04)]">
                <img
                  src="/img/tentang-kami/team.jpg"
                  alt="Tim Waste & Wishes di lapangan"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
              </div>
            </div>

            {/* Content Column */}
            <div className="order-1 md:order-2 rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-8 md:p-10 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase mb-4">
                Cerita Kami
              </span>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-6 leading-snug">
                Mengubah sampah organik menjadi berkah nyata
              </h2>
              <div className="space-y-4 text-(--hx-ink-2) text-[15px] leading-relaxed font-light">
                <p>
                  Waste &amp; Wishes lahir dari keresahan melihat krisis pengelolaan sampah organik di wilayah Gejayan dan Wedomartani. Banyak rumah tangga dan UMKM masih bingung mengelola limbah dapur mereka, sementara sampah organik terus menumpuk di Tempat Pembuangan Akhir dan menghasilkan gas metana berbahaya.
                </p>
                <p>
                  Kami percaya bahwa sampah organik bukanlah akhir, melainkan awal dari rantai nilai baru. Melalui teknologi biokonversi maggot Black Soldier Fly (BSF), kami mengubah limbah dapur menjadi pakan ternak berprotein tinggi dan pupuk organik berkualitas. Setiap kilogram sampah yang terkelola adalah langkah kecil menuju bumi yang lebih lestari.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Three Pillars Section */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
              Tiga Pilar Kami
            </span>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
              Mengapa Waste &amp; Wishes?
            </h2>
            <div className="mx-auto bg-(--hx-accent) h-0.5 w-16 rounded-full mt-4" />
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Pillar 1: Permasalahan */}
            <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-7 md:p-8 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm transition hover:border-(--hx-accent)/60">
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase mb-3">
                01 / Permasalahan
              </span>
              <h3 className="text-xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-3">
                Krisis Pengelolaan
              </h3>
              <p className="text-sm leading-relaxed text-(--hx-ink-2) font-light">
                Masyarakat masih bingung mengelola sampah dapur dan organik. Kami hadir dengan teknologi informasi terintegrasi sebagai solusi pengelolaan yang efektif dan terukur.
              </p>
            </div>

            {/* Pillar 2: Peluang */}
            <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-7 md:p-8 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm transition hover:border-(--hx-accent)/60">
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase mb-3">
                02 / Peluang
              </span>
              <h3 className="text-xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-3">
                Ekonomi Sirkular
              </h3>
              <p className="text-sm leading-relaxed text-(--hx-ink-2) font-light">
                Peluang besar bagi penyedia layanan budidaya maggot BSF untuk membantu masyarakat sekaligus menciptakan nilai ekonomi dari limbah organik.
              </p>
            </div>

            {/* Pillar 3: Keharusan */}
            <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-7 md:p-8 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm transition hover:border-(--hx-accent)/60">
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase mb-3">
                03 / Keharusan
              </span>
              <h3 className="text-xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-3">
                Aksi Nyata
              </h3>
              <div className="text-sm leading-relaxed text-(--hx-ink-2) font-light space-y-2">
                <p className="border-l-2 border-(--hx-accent)/30 pl-3">
                  <span className="font-medium text-(--hx-ink)">Edukasi:</span> Mengubah pola pikir dari membuang menjadi menyediakan bahan baku.
                </p>
                <p className="border-l-2 border-(--hx-accent)/30 pl-3">
                  <span className="font-medium text-(--hx-ink)">Standar:</span> Panduan praktis memilah sampah dapur yang mudah diikuti.
                </p>
                <p className="border-l-2 border-(--hx-accent)/30 pl-3">
                  <span className="font-medium text-(--hx-ink)">Jaringan:</span> Menghubungkan rumah tangga dan penyedia secara <i>real-time</i>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Vision & Mission Section */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Visi */}
            <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-8 md:p-10 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase mb-4">
                Visi
              </span>
              <h3 className="text-2xl font-light tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-4 leading-snug">
                Pionir Pengelolaan Sampah Organik
              </h3>
              <p className="text-(--hx-ink-2) text-[15px] leading-relaxed font-light">
                Menjadi pionir platform pengelolaan sampah organik terintegrasi yang mewujudkan lingkungan bersih, sehat, dan mendukung ekonomi sirkular melalui maggot BSF di Indonesia.
              </p>
            </div>

            {/* Misi */}
            <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-8 md:p-10 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
              <span className="block text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase mb-4">
                Misi
              </span>
              <h3 className="text-2xl font-light tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-4 leading-snug">
                Langkah Konkret Kami
              </h3>
              <ul className="space-y-3 text-(--hx-ink-2) text-[15px] leading-relaxed font-light">
                <li className="flex items-start gap-3">
                  <span className="block w-1.5 h-1.5 rounded-full bg-(--hx-accent) mt-2 flex-shrink-0" />
                  <span>Mengedukasi masyarakat secara berkelanjutan tentang pengolahan limbah organik</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="block w-1.5 h-1.5 rounded-full bg-(--hx-accent) mt-2 flex-shrink-0" />
                  <span>Membangun jaringan <i>real-time</i> antara masyarakat dan penyedia layanan</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="block w-1.5 h-1.5 rounded-full bg-(--hx-accent) mt-2 flex-shrink-0" />
                  <span>Mengefisiensikan pendataan dan penjemputan sampah terjadwal berbasis teknologi</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Facts Grid - Helix Drift Style dengan Animasi */}
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-(--hx-pastel)/40 rounded-2xl overflow-hidden border border-(--hx-pastel)/40 shadow-sm">
            <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-6 text-center">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                Didirikan
              </div>
              <AnimatedCounter value={2024} />
            </div>
            <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-6 text-center">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                Wilayah
              </div>
              <AnimatedCounter value={2} suffix="+" />
            </div>
            <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-6 text-center">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                Mitra Aktif
              </div>
              <AnimatedCounter value={250} suffix="+" />
            </div>
            <div className="bg-(--hx-canvas)/90 backdrop-blur-sm p-6 text-center">
              <div className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase mb-2">
                Event
              </div>
              <AnimatedCounter value={45} suffix="+" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-20 max-w-4xl text-center">
          <div className="rounded-2xl border border-(--hx-pastel)/60 bg-white/80 p-10 md:p-14 shadow-[0_8px_30px_rgb(27,34,51,0.04)] backdrop-blur-sm">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans) mb-4 leading-snug">
              Mari Bergabung Bersama Kami
            </h2>
            <p className="text-base text-(--hx-ink-2) font-light leading-relaxed max-w-xl mx-auto mb-8">
              Jadilah bagian dari gerakan ekonomi sirkular dan bantu wujudkan lingkungan yang lebih bersih untuk generasi mendatang.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="/langganan"
                className="inline-flex items-center justify-center rounded-full bg-(--hx-accent) px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-(--hx-accent-dark) transition-colors shadow-xs"
              >
                Mulai Berlangganan
              </a>
              <a
                href="/event"
                className="inline-flex items-center justify-center rounded-full border border-(--hx-pastel) bg-white/80 backdrop-blur-sm px-8 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-(--hx-ink-2) hover:border-(--hx-accent) hover:text-(--hx-accent) hover:bg-white transition-colors"
              >
                Lihat Event Kami
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}