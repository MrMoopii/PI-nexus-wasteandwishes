import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import ProfileDropdown from "@/components/ProfileDropdown";

export default async function Header() {
  const session = await auth();
  const loggedIn = !!session?.user && !session.user.isIdle;
  const username = session?.user?.name ?? "Pengguna";

  return (
    <header className="bg-gray-900 text-white shadow">
      <nav className="mx-auto flex w-full max-w-285 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:gap-6 lg:py-5">
        <Link
          href="/"
          className="flex items-center gap-3 text-[1.95rem] font-extrabold tracking-[.5px] font-(family-name:--font-plus-jakarta-sans)"
        >
          <Image
            src="/icon/waste-and-wishes-logo.png"
            alt="Waste and Wishes logo"
            width={30}
            height={30}
            className="h-auto w-auto"
          />
          Waste <span className="text-teal-400">&</span> Wishes
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base font-semibold text-gray-400 md:text-xl font-(family-name:--font-plus-jakarta-sans)">
          <Link
            className="whitespace-nowrap rounded-md px-2 py-2 transition-colors hover:text-waste sm:px-3"
            href="/"
          >
            Beranda
          </Link>
          <Link
            className="whitespace-nowrap rounded-md px-2 py-2 transition-colors hover:text-waste sm:px-3"
            href="/about"
          >
            Tentang Kami
          </Link>
          {loggedIn && (
            <>
              <Link
                className="whitespace-nowrap rounded-md px-2 py-2 transition-colors hover:text-waste sm:px-3"
                href="/langganan"
              >
                Langganan
              </Link>
              <Link
                className="whitespace-nowrap rounded-md px-2 py-2 transition-colors hover:text-waste sm:px-3"
                href="/buat-jadwal-janjian"
              >
                Jadwal Janjian
              </Link>
              <Link
                className="whitespace-nowrap rounded-md px-2 py-2 transition-colors hover:text-waste sm:px-3"
                href="/event"
              >
                Daftar Event
              </Link>
            </>
          )}
          {!loggedIn ? (
            <>
              <Link
                href="/auth/login"
                className="whitespace-nowrap rounded-lg border border-white/60 px-3 py-2 text-sm font-semibold text-white transition hover:border-waste hover:text-waste sm:px-5 sm:text-base"
              >
                Masuk
              </Link>
              <Link
                href="/auth/register"
                className="whitespace-nowrap rounded-lg bg-waste px-3 py-2 text-sm font-semibold text-white transition hover:bg-waste-dark sm:px-5 sm:text-base"
              >
                Daftar
              </Link>
            </>
          ) : (
            <ProfileDropdown username={username} />
          )}
        </div>
      </nav>
    </header>
  );
}
