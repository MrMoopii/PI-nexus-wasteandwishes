import Link from "next/link";
import HeaderBingkai from "@/components/header/HeaderBingkai";
import NavLink from "@/components/header/NavLink";
import ProfileDropdown from "@/components/header/ProfileDropdown";
import { auth } from "@/lib/auth";
import { connection } from "next/server";

export default async function Header() {
  await connection();
  const session = await auth();
  const loggedIn = !!session?.user && !session?.user.isIdle;
  const username = session?.user?.name ?? "Pengguna";

  return (
    <HeaderBingkai>
      <NavLink href="/">Beranda</NavLink>
      <NavLink href="/about">Tentang Kami</NavLink>
      {loggedIn && (
        <>
          <NavLink href="/langganan">Langganan</NavLink>
          <NavLink href="/buat-jadwal-janjian">Jadwal Janjian</NavLink>
          <NavLink href="/event">Daftar Event</NavLink>
          <NavLink href="/store">Toko</NavLink>
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
    </HeaderBingkai>
  );
}
