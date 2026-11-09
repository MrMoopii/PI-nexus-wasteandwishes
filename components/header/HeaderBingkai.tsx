import Link from "next/link";
import Image from "next/image";

export default function HeaderBingkai({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <header className="bg-gray-900 text-white shadow z-50 relative">
      <nav className="mx-auto flex w-full max-w-285 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:gap-6 lg:py-5">
        <Link
          href="/"
          className="flex items-center gap-3 text-xl font-extrabold tracking-[.5px] font-(family-name:--font-plus-jakarta-sans)"
        >
          <Image
            src="/icon/waste-and-wishes-logo.png"
            alt="Waste and Wishes logo"
            width={64}
            height={43}
            className="w-8 h-auto"
            loading="eager"
          />
          Waste <span className="text-teal-400">&</span> Wishes
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-gray-400 md:text-base font-(family-name:--font-plus-jakarta-sans)">
          {children}
        </div>
      </nav>
    </header>
  );
}
