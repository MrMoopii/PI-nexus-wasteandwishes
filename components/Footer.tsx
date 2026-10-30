import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-5 border-t-4 border-teal-500 bg-gray-900 pb-4 pt-12 text-white font-(family-name:--font-plus-jakarta-sans)">
      <div className="mx-auto grid w-full max-w-285 gap-8 px-3 text-center md:grid-cols-3 md:text-left">
        <section>
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-waste">
            Waste &amp; Wishes
          </h2>
          <p className="text-base leading-7 text-white/60">
            Platform pengelolaan limbah organik modern untuk mendukung budidaya
            maggot BSF di wilayah Gejayan. Bersama Nexus, kita wujudkan masa
            depan bumi yang lebih sehat dan lestari.
          </p>
        </section>
        <section className="text-center md:justify-self-center">
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-waste">
            Navigasi
          </h2>
          <nav className="flex flex-col items-center gap-2">
            <Link
              className="text-base text-white/60 transition-colors hover:text-waste hover:[text-shadow:0_0_5px_rgb(23_175_176/30%)]"
              href="/"
            >
              Beranda
            </Link>
            <Link
              className="text-base text-white/60 transition-colors hover:text-waste hover:[text-shadow:0_0_5px_rgb(23_175_176/30%)]"
              href="/about"
            >
              Tentang Kami
            </Link>
            <Link
              className="text-base text-white/60 transition-colors hover:text-waste hover:[text-shadow:0_0_5px_rgb(23_175_176/30%)]"
              href="/#layanan"
            >
              Layanan Kami
            </Link>
          </nav>
        </section>
        <section>
          <h2 className="mb-4 text-lg font-bold uppercase tracking-wide text-waste">
            Hubungi Kami
          </h2>
          <p className="mb-3 text-base leading-6 text-white/60">
            <strong className="text-white">📍 Alamat:</strong> Nglarang no 37,
            Malangrejo, RT 5/RW 35, Wedomartani, Ngemplak, Sleman
          </p>
          <p className="mb-3 text-base text-white/60">
            <strong className="text-white">💬 WhatsApp:</strong>
            <br />
            <a
              className="transition-colors hover:text-waste hover:[text-shadow:0_0_5px_rgb(23_175_176/30%)]"
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noreferrer"
            >
              +62 812-3456-7890
            </a>
          </p>
          <p className="text-base text-white/60">
            <strong className="text-white">📸 Instagram:</strong>
            <br />
            <a
              className="transition-colors hover:text-waste hover:[text-shadow:0_0_5px_rgb(23_175_176/30%)]"
              href="https://www.instagram.com/waste.and.wishes?utm_source=ig_web_button_share_sheet&amp;igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noreferrer"
            >
              @wasteandwishes
            </a>
          </p>
        </section>
      </div>
      <div className="mx-auto mt-8 w-full max-w-285 border-t border-white/15 px-3 pt-5 text-center text-sm text-white/50">
        © 2026 <strong className="text-teal-400">Waste &amp; Wishes</strong> x
        Kelompok Nexus. All Rights Reserved.
      </div>
    </footer>
  );
}
