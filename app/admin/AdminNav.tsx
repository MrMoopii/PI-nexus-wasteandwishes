"use client";

import { usePathname } from "next/dist/client/components/navigation";
import Link from "next/dist/client/link";

const adminNavigation = [
  { name: "Dashboard", href: "/admin", category: "NAVIGATION" },
  { name: "Data Pengguna", href: "/admin/users", category: "NAVIGATION" },
  {
    name: "Jadwal Pengambilan",
    href: "/admin/schedules",
    category: "NAVIGATION",
  },
  { name: "Data Event", href: "/admin/events", category: "APPLICATION" },
  { name: "Produk", href: "/admin/products", category: "APPLICATION" },
  { name: "Laporan", href: "/admin/reports", category: "APPLICATION" },
];

// 1) Hanya tampilan, TANPA hook. Menerima href yang aktif (atau null).
export function NavLinks({ activeHref }: { activeHref: string | null }) {
  return (
    <nav className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
      <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Navigation
      </div>
      <ul className="space-y-1 mb-6">
        {adminNavigation
          .filter((item) => item.category === "NAVIGATION")
          .map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeHref === item.href
                    ? "bg-white/10 text-white border-l-2 border-blue-500 rounded-l-none"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
      </ul>

      <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Application
      </div>
      <ul className="space-y-1">
        {adminNavigation
          .filter((item) => item.category === "APPLICATION")
          .map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeHref === item.href
                    ? "bg-white/10 text-white border-l-2 border-blue-500 rounded-l-none"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
}

// 2) Membaca URL, lalu meneruskannya ke NavLinks.
export default function AdminNav() {
  const pathname = usePathname();
  return <NavLinks activeHref={pathname} />;
}
