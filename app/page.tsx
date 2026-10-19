"use client";

import { useEffect, useRef, useState } from "react";

function AnimatedCounter({
  value,
  suffix,
  duration = 1400,
}: {
  value: number;
  suffix: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const node = document.getElementById(`stat-${value}`);
    if (!node || hasAnimated.current) return;

    hasAnimated.current = true;

    let start: number | null = null;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const nextValue = Math.round(startValue + (value - startValue) * eased);
      setCount(nextValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [duration, value]);

  return (
    <h2
      id={`stat-${value}`}
      className="mb-2 text-4xl font-extrabold text-teal-600 md:text-5xl"
    >
      {count}
      {suffix}
    </h2>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
              Ubah Sampah Organik Menjadi{" "}
              <span className="text-teal-600">Berkah</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Waste & Wishes membantu mengelola limbah organik dari rumah tangga
              dan UMKM di wilayah Gejayan secara bertanggung jawab melalui
              budidaya maggot BSF demi mewujudkan bumi yang lebih sehat dan
              lestari.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/langganan"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white shadow-lg shadow-teal-600/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="relative z-10">Mulai Berlangganan</span>
                <span className="pointer-events-none absolute inset-x-3 bottom-1 h-2 rounded-full bg-white/20 blur-md transition-all duration-300 group-hover:bottom-2 group-hover:opacity-100 opacity-80" />
              </a>
              <a
                href="#layanan"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-gray-400 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-gray-500"
              >
                <span className="relative z-10">Pelajari Layanan</span>
                <span className="pointer-events-none absolute inset-x-3 bottom-1 h-2 rounded-full bg-gray-200 blur-md transition-all duration-300 group-hover:bottom-2 group-hover:opacity-100 opacity-80" />
              </a>
            </div>
          </div>

          {/* Right */}
          <div className="text-center md:text-left">
            <div className="p-8 rounded-xl shadow bg-white border-t-4 border-teal-500">
              <div className="mb-4">
                <span className="text-5xl">🌱</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-3">
                Teknologi untuk Kesehatan Bumi
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Setiap sampah organik yang Anda setorkan akan langsung diolah
                oleh maggot BSF, memangkas rantai penumpukan limbah sekaligus
                menghasilkan pakan ternak bernilai tinggi.
              </p>
              <div className="bg-teal-600 text-white px-4 py-2 rounded-full font-semibold inline-block">
                📍 Cakupan Wilayah: Wedomartani & Sekitarnya
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Layanan Section */}
      <section id="layanan" className="bg-gray-50 py-16">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Layanan Utama Kami
            </h2>
            <p className="text-gray-600 text-lg">
              Solusi terintegrasi dari Waste & Wishes untuk kelestarian
              lingkungan Gejayan
            </p>
            <div className="mx-auto bg-teal-600 h-1 w-20 rounded mt-4"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 justify-center">
            {/* Card Langganan */}
            <div className="group relative overflow-hidden rounded-[28px] border border-gray-200 bg-[#f5f5f5] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-3xl text-teal-600 shadow-inner transition-transform duration-300 group-hover:scale-105">
                  🚛
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl md:text-[2rem] font-bold leading-tight text-gray-900 mb-3">
                    Langganan Pengambilan Sampah
                  </h3>
                  <p className="text-base leading-relaxed text-gray-600">
                    Pilahlah sampah organik Anda dari rumah atau tempat usaha
                    UMKM, dan biarkan tim kami menjemputnya secara terjadwal
                    langsung di depan pintu rumah Anda.
                  </p>

                  <div className="mt-6">
                    <a
                      href="/langganan"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-6 py-4 text-base font-bold text-white shadow-md transition hover:bg-teal-700 md:w-auto"
                    >
                      Mulai Berlangganan
                    </a>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-teal-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600 opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
                Populer
              </div>
            </div>

            {/* Card Event */}
            <div className="group relative overflow-hidden rounded-[28px] border border-gray-200 bg-[#f5f5f5] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600 shadow-inner transition-transform duration-300 group-hover:scale-105">
                  📅
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl md:text-[2rem] font-bold leading-tight text-gray-900 mb-3">
                    Edukasi & Event Lingkungan
                  </h3>
                  <p className="text-base leading-relaxed text-gray-600">
                    Ikuti berbagai program pelatihan gratis, sosialisasi
                    budidaya maggot BSF, dan gerakan kerelawanan aksi hijau demi
                    meningkatkan kesadaran ekologis bersama komunitas.
                  </p>

                  <div className="mt-6">
                    <a
                      href="/event"
                      className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-4 text-base font-bold text-gray-700 transition hover:bg-gray-100 md:w-auto"
                    >
                      Lihat Jadwal Event
                    </a>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-green-200 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-green-600 opacity-0 shadow-sm transition-all duration-300 group-hover:opacity-100">
                Hijau
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistik Section */}
      <section className="container mx-auto py-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <AnimatedCounter value={10} suffix="+ Ton" />
            <p className="text-gray-600 font-semibold">
              Limbah Organik Terolah
            </p>
          </div>
          <div className="border-x border-gray-200 px-4">
            <AnimatedCounter value={250} suffix="+" />
            <p className="text-gray-600 font-semibold">
              Mitra Rumah Tangga & UMKM
            </p>
          </div>
          <div>
            <AnimatedCounter value={15} suffix="+" />
            <p className="text-gray-600 font-semibold">
              Event Edukasi Terlaksana
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
