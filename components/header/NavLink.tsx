"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navKelas } from "@/components/header/nav-kelas";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const aktif = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      className={`${navKelas} border-b-2 ${
        aktif
          ? "text-waste border-waste scale-105"
          : "border-transparent hover:border-waste/50"
      }`}
      href={href}
    >
      {children}
    </Link>
  );
}
