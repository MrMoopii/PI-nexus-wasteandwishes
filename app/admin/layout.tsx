"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const adminNavigation = [
  { name: "Dashboard", href: "/admin", icon: "📊" },
  { name: "Data Pengguna", href: "/admin/users", icon: "👥" },
  { name: "Jadwal Pengambilan", href: "/admin/schedules", icon: "📅" },
  { name: "Data Event", href: "/admin/events", icon: "🎉" },
  { name: "Produk", href: "/admin/products", icon: "📦" },
  { name: "Laporan", href: "/admin/reports", icon: "📈" },
];

interface User {
  name?: string | null;
  email?: string | null;
  peran?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        return res.json();
      })
      .then((data) => {
        if (data.user?.peran !== "admin") {
          router.push("/auth/login");
        } else {
          setUser(data.user);
        }
      })
      .catch(() => {
        router.push("/auth/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin  " className="flex items-center gap-3">
            <Image
              src="/icon/waste-and-wishes-logo.png"
              alt="Waste and Wishes logo"
              width={35}
              height={35}
              className="h-8.75 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold tracking-[.5px]">
                Waste <span className="text-teal-400">&</span> Wishes
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {adminNavigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}