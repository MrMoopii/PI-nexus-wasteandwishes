"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileDropdown from "@/components/ProfileDropdown";

export default function Header() {
  const pathname = usePathname();
  const [session, setSession] = useState<{
    loggedIn: boolean;
    username: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setSession({
          loggedIn: data.loggedIn || false,
          username: data.username || "Pengguna",
        });
      })
      .catch(() => {
        setSession({ loggedIn: false, username: "Pengguna" });
      });
  }, []);

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const loggedIn = session?.loggedIn || false;
  const username = session?.username || "Pengguna";

  return (
    <header className="bg-gray-900 text-white shadow">
      <nav className="mx-auto flex w-full max-w-285 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:gap-6 lg:py-5">
        <Link
          href="/"
          className="flex items-center gap-3 text-xl font-extrabold tracking-[.5px] font-(family-name:--font-plus-jakarta-sans)"
        >
          <Image
            src="/icon/waste-and-wishes-logo.png"
            alt="Waste and Wishes logo"
            width={28}
            height={28}
            className="h-auto w-auto"
          />
          Waste <span className="text-teal-400">&</span> Wishes
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-gray-400 md:text-base font-(family-name:--font-plus-jakarta-sans)">
          <Link
            className={`whitespace-nowrap rounded-md px-2 py-2 transition-all duration-200 ease-in-out hover:scale-105 hover:text-waste sm:px-3 ${isActive("/") ? "text-waste border-b-2 border-waste scale-105" : ""}`}
            href="/"
          >
            Beranda
          </Link>
          <Link
            className={`whitespace-nowrap rounded-md px-2 py-2 transition-all duration-200 ease-in-out hover:scale-105 hover:text-waste sm:px-3 ${isActive("/about") ? "text-waste border-b-2 border-waste scale-105" : ""}`}
            href="/about"
          >
            Tentang Kami
          </Link>
          {loggedIn && (
            <>
              <Link
                className={`whitespace-nowrap rounded-md px-2 py-2 transition-all duration-200 ease-in-out hover:scale-105 hover:text-waste sm:px-3 ${isActive("/langganan") ? "text-waste border-b-2 border-waste scale-105" : ""}`}
                href="/langganan"
              >
                Langganan
              </Link>
              <Link
                className={`whitespace-nowrap rounded-md px-2 py-2 transition-all duration-200 ease-in-out hover:scale-105 hover:text-waste sm:px-3 ${isActive("/buat-jadwal-janjian") ? "text-waste border-b-2 border-waste scale-105" : ""}`}
                href="/buat-jadwal-janjian"
              >
                Jadwal Janjian
              </Link>
              <Link
                className={`whitespace-nowrap rounded-md px-2 py-2 transition-all duration-200 ease-in-out hover:scale-105 hover:text-waste sm:px-3 ${isActive("/event") ? "text-waste border-b-2 border-waste scale-105" : ""}`}
                href="/event"
              >
                Daftar Event
              </Link>
              {/* Tambahan tombol Toko */}
              <Link
                className={`whitespace-nowrap rounded-md px-2 py-2 transition-all duration-200 ease-in-out hover:scale-105 hover:text-waste sm:px-3 ${isActive("/Store") ? "text-waste border-b-2 border-waste scale-105" : ""}`}
                href="/Store"
              >
                Toko
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