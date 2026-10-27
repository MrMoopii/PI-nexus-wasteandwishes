"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav, { NavLinks } from "./AdminNav";

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
  const [darkMode, setDarkMode] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem("admin-theme") === "dark",
  );

  function toggleTheme() {
    setDarkMode((current) => {
      const next = !current;
      window.localStorage.setItem("admin-theme", next ? "dark" : "light");
      return next;
    });
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        if (data.user?.peran !== "admin") router.push("/auth/login");
        else setUser(data.user);
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7]">
        <div className="h-10 w-10 animate-pulse rounded-full border-2 border-blue-600/30 border-t-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className={`admin-shell flex h-screen overflow-hidden transition-colors ${darkMode ? "admin-theme-dark" : "bg-[#f4f5f7]"}`}
      data-theme={darkMode ? "dark" : "light"}
    >
      {/* Sidebar (Dark Theme) */}
      <aside className="admin-sidebar flex w-64 shrink-0 flex-col bg-[#273142] text-slate-300 transition-all">
        <div className="flex h-18 items-center gap-3 px-6">
          <Image
            src="/icon/waste-and-wishes-logo.png"
            alt="Waste and Wishes"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
            priority
          />
          <span className="admin-brand text-lg font-semibold text-white">
            Waste & Wishes
          </span>
        </div>

        <Suspense fallback={<NavLinks activeHref={null} />}>
          <AdminNav />
        </Suspense>

        {/* User Profile at Bottom */}
        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 cursor-pointer">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {(user.name || user.email || "A").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user.name || user.email}
              </p>
              <p className="text-xs text-slate-400 capitalize">{user.peran}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header
          className={`admin-header flex h-18 shrink-0 items-center justify-end gap-5 border-b px-6 shadow-sm z-10 transition-colors ${darkMode ? "border-slate-700 bg-gray-900" : "border-slate-100 bg-white"}`}
        >
          <div className="flex items-center gap-5 text-slate-500">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                darkMode ? "Aktifkan tema terang" : "Aktifkan tema gelap"
              }
              aria-pressed={darkMode}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white ml-2">
              {(user.name || user.email || "A").slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 transition-colors ${darkMode ? "bg-gray-900" : "bg-[#f4f5f7]"}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
