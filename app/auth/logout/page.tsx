"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function LogoutPage() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await signOut({ redirectTo: "/" });
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Keluar dari Akun
        </h1>
        <p className="text-gray-600 mb-8">Apakah kamu yakin ingin keluar?</p>
        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Ya, Keluar"}
          </button>
          <Link
            href="/"
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition text-center"
          >
            Batal
          </Link>
        </div>
      </div>
    </div>
  );
}
