"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const adminNavigation = [
  { name: "Dashboard", href: "/admin", category: "NAVIGATION" },
  { name: "Data Pengguna", href: "/admin/users", category: "NAVIGATION" },
  { name: "Langganan", href: "/admin/langganan", category: "NAVIGATION" },
  {
    name: "Buat Kunjungan",
    href: "/admin/buat-kunjungan",
    category: "NAVIGATION",
  },
  { name: "Hari Libur", href: "/admin/hari-libur", category: "NAVIGATION" },
  {
    name: "Pencatatan Kunjungan",
    href: "/admin/kunjungan",
    category: "NAVIGATION",
  },
  { name: "Laporan Kendala", href: "/admin/kendala", category: "NAVIGATION" },
  {
    name: "Laporan Bulanan",
    href: "/admin/laporan-bulanan",
    category: "NAVIGATION",
  },
  { name: "Data Event", href: "/admin/events", category: "APPLICATION" },
  {
    name: "Peserta Event",
    href: "/admin/peserta-event",
    category: "APPLICATION",
  },
  { name: "Produk", href: "/admin/produk", category: "APPLICATION" },
  { name: "Laporan", href: "/admin/reports", category: "APPLICATION" },
];

/**
 * Daftar menu sidebar admin dengan penanda menu aktif. activeHref null (dipakai
 * sebagai fallback Suspense) berarti belum ada menu yang ditandai aktif.
 */
export function NavLinks({ activeHref }: { activeHref: string | null }) {
  const isLinkActive = (href: string) => {
    if (!activeHref) return false;
    if (href === "/admin") {
      return activeHref === "/admin";
    }
    return activeHref === href || activeHref.startsWith(`${href}/`);
  };

  return (
    <nav className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
      <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Navigation
      </div>
      <ul className="space-y-1 mb-6">
        {adminNavigation
          .filter((item) => item.category === "NAVIGATION")
          .map((item) => {
            const aktif = isLinkActive(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    aktif
                      ? "bg-white/10 text-white border-l-2 border-(--hx-accent) rounded-l-none"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
      </ul>

      <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Application
      </div>
      <ul className="space-y-1">
        {adminNavigation
          .filter((item) => item.category === "APPLICATION")
          .map((item) => {
            const aktif = isLinkActive(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    aktif
                      ? "bg-white/10 text-white border-l-2 border-(--hx-accent) rounded-l-none"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}

/**
 * Sidebar admin yang membaca path sekarang dengan usePathname(), jadi dipasang
 * di bawah <Suspense> di AdminLayoutClient (CONTRIBUTING 8 no. 1).
 */
export default function AdminNav() {
  const pathname = usePathname();
  return <NavLinks activeHref={pathname} />;
}