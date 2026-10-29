"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    try {
      window.localStorage.removeItem("waste-wishes:last-activity");
      await signOut({ redirectTo: "/" });
    } catch {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          Keluar dari Dashboard Admin
        </h1>
        <p className="mb-8 text-gray-600">
          Apakah Anda yakin ingin keluar?
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Ya, Keluar"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin")}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-400 bg-gray-100 px-4 py-3 font-semibold text-gray-900 transition hover:bg-white disabled:opacity-50"
          >
            Batal
          </button>
        </div>
      </div>
    </section>
  );
}
