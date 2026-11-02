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
      className={`${navKelas} ${aktif ? "text-waste border-b-2 border-waste scale-105" : ""}`}
      href={href}
    >
      {children}
    </Link>
  );
}
