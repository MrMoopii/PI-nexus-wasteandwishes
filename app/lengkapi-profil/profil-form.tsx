"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { lengkapiProfil } from "./actions";

export default function ProfilForm({ email }: { email: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [namaPelanggan, setNamaPelanggan] = useState("");
  const [nomorTelp, setNomorTelp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await lengkapiProfil({
        username,
        namaPelanggan,
        nomorTelp,
        alamat,
        tanggalLahir,
      });

      if (result?.error) {
        setError(result.error);
        return;
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan, Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profil Lengkap</h1>
            <p className="text-gray-600 mt-2">Lengkapi profil Anda</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                className=" bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username Akun
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="namaPelanggan"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nama Lengkap
              </label>
              <input
                id="namaPelanggan"
                type="text"
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="nomorTelp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nomor Telepon
              </label>
              <input
                id="nomorTelp"
                type="text"
                value={nomorTelp}
                onChange={(e) => setNomorTelp(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="alamat"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Alamat
              </label>
              <input
                id="alamat"
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="tanggalLahir"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tanggal Lahir
              </label>
              <input
                id="tanggalLahir"
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Memuat..." : "Simpan Profil"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
