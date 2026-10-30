import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";

export default async function Header() {
  const session = await auth();
  const loggedIn = !!session?.user && !session.user.isIdle;
  const username = session?.user?.name ?? "Pengguna";

  return (
    <header className="bg-gray-900 text-white shadow">
      <nav className="mx-auto flex w-full max-w-285 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:gap-6 lg:py-5">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap text-lg font-extrabold tracking-[.5px] sm:gap-2.5 sm:text-xl lg:text-[1.55rem]"
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
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-1 gap-y-1 text-sm font-semibold text-gray-400 sm:gap-x-2 sm:text-base lg:flex-nowrap lg:gap-x-3 lg:text-lg xl:text-xl">
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
            <details className="relative">
              <summary
                className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border-2 border-white bg-teal-600 text-lg font-bold"
                aria-label="Menu profil"
              >
                {username.slice(0, 1).toUpperCase()}
              </summary>
              <div className="absolute right-0 z-20 mt-3 w-56 rounded-xl bg-white p-4 text-center text-gray-900 shadow-xl">
                <p className="font-bold">{username}</p>
                <hr className="my-3 border-gray-200" />
                <Link className="block py-2 text-gray-600" href="/profil">
                  Profil Saya
                </Link>
                <Link
                  className="block py-2 font-bold text-red-600"
                  href="/auth/logout"
                >
                  Keluar
                </Link>
              </div>
            </details>
          )}
        </div>
      </nav>
    </header>
  );
}
