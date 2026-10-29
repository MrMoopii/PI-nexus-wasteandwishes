"use client";

import { signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const LAST_ACTIVITY_KEY = "waste-wishes:last-activity";

const pesanError: Record<string, string> = {
  EmailSudahTerdaftar:
    "Email ini sudah terdaftar dengan password. Silakan masuk dengan email dan password.",
  AccessDenied:
    "Akses ditolak. Pastikan email Google Anda sudah terverifikasi.",
  CredentialsSignin: "Email atau password salah.",
};

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const idleExpired = searchParams.get("reason") === "idle";

  useEffect(() => {
    if (!idleExpired) return;
    void signOut({ redirect: false }).then(() => {
      window.localStorage.removeItem(LAST_ACTIVITY_KEY);
      router.refresh();
    });
  }, [idleExpired, router]);

  const pesan =
    error ||
    (idleExpired ? "Sesi Anda berakhir setelah 30 menit tidak aktif. Silakan masuk kembali." : "") ||
    (urlError
      ? (pesanError[urlError] ?? "Terjadi kesalahan. Silakan coba lagi.")
      : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(pesanError[result.error] ?? "Email atau password salah.");
      } else {
        window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = response.ok ? await response.json() : null;
        router.push(data?.user?.peran === "admin" ? "/admin" : "/");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    await signIn("google", { redirectTo: "/lengkapi-profil" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Masuk</h1>
          <p className="text-gray-600 mt-2">Selamat datang kembali</p>
        </div>

        {pesan && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {pesan}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          Lanjutkan dengan Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">atau</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Memuat..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Belum punya akun?{" "}
          <Link
            href="/auth/register"
            className="text-teal-600 font-semibold hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
