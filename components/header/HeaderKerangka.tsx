import Link from "next/link";
import HeaderBingkai from "@/components/header/HeaderBingkai";
import { navKelas } from "@/components/header/nav-kelas";

export default function HeaderKerangka() {
  return (
    <HeaderBingkai>
      <Link className={navKelas} href="/">
        Beranda
      </Link>
      <Link className={navKelas} href="/about">
        Tentang Kami
      </Link>
    </HeaderBingkai>
  );
}
