"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfil } from "./actions";
import Link from "next/link";

export default function EditProfilForm({
  email,
  username: initialUsername,
  namaPelanggan: initialNamaPelanggan,
  nomorTelp: initialNomorTelp,
  alamat: initialAlamat,
  tanggalLahir: initialTanggalLahir,
}: {
  email: string;
  username: string;
  namaPelanggan: string;
  nomorTelp: string;
  alamat: string;
  tanggalLahir: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [namaPelanggan, setNamaPelanggan] = useState(initialNamaPelanggan);
  const [nomorTelp, setNomorTelp] = useState(initialNomorTelp);
  const [alamat, setAlamat] = useState(initialAlamat);
  const [tanggalLahir, setTanggalLahir] = useState(initialTanggalLahir);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await updateProfil({
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
        router.push("/profil");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan, Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F4F7FA]">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120vw 90vh at 8% -10%, rgba(185, 205, 229, 0.55), transparent 62%), radial-gradient(110vw 80vh at 98% 108%, rgba(221, 231, 242, 0.85), transparent 60%)",
        }}
      />

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50 mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(150, 177, 208, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(150, 177, 208, 0.3) 1px, transparent 1px)",
          backgroundSize: "72px 72px, 72px 72px",
          maskImage:
            "radial-gradient(80vw 80vh at 50% 42%, #000 20%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(80vw 80vh at 50% 42%, #000 20%, transparent 82%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[620px] px-5 py-12 sm:py-20">
        <div className="mb-8 text-center">
          <h1 className="font-(family-name:--font-plus-jakarta-sans) text-4xl font-light tracking-tight text-[#1B2233]">
            Edit Profil
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[#5B6879]">
            Perbarui informasi profil Anda
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-sm border border-red-300 bg-red-50 p-4 text-[0.95rem] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="h-12 w-full rounded-sm border border-[#DDE7F2] bg-[#DDE7F2] px-4 text-[0.95rem] text-[#5B6879] outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="h-12 w-full rounded-sm border border-[#B9CDE5] bg-white px-4 text-[0.95rem] text-[#1B2233] outline-none transition-colors focus:border-[#4A6E96] focus:ring-2 focus:ring-[#4A6E96]/20"
            />
          </div>

          <div>
            <label
              htmlFor="namaPelanggan"
              className="mb-2 block text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]"
            >
              Nama Lengkap
            </label>
            <input
              id="namaPelanggan"
              type="text"
              value={namaPelanggan}
              onChange={(e) => setNamaPelanggan(e.target.value)}
              required
              className="h-12 w-full rounded-sm border border-[#B9CDE5] bg-white px-4 text-[0.95rem] text-[#1B2233] outline-none transition-colors focus:border-[#4A6E96] focus:ring-2 focus:ring-[#4A6E96]/20"
            />
          </div>

          <div>
            <label
              htmlFor="nomorTelp"
              className="mb-2 block text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]"
            >
              Nomor Telepon
            </label>
            <input
              id="nomorTelp"
              type="text"
              value={nomorTelp}
              onChange={(e) => setNomorTelp(e.target.value)}
              required
              className="h-12 w-full rounded-sm border border-[#B9CDE5] bg-white px-4 text-[0.95rem] text-[#1B2233] outline-none transition-colors focus:border-[#4A6E96] focus:ring-2 focus:ring-[#4A6E96]/20"
            />
          </div>

          <div>
            <label
              htmlFor="alamat"
              className="mb-2 block text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]"
            >
              Alamat
            </label>
            <textarea
              id="alamat"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              required
              rows={3}
              className="w-full rounded-sm border border-[#B9CDE5] bg-white px-4 py-3 text-[0.95rem] text-[#1B2233] outline-none transition-colors focus:border-[#4A6E96] focus:ring-2 focus:ring-[#4A6E96]/20"
            />
          </div>

          <div>
            <label
              htmlFor="tanggalLahir"
              className="mb-2 block text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]"
            >
              Tanggal Lahir
            </label>
            <input
              id="tanggalLahir"
              type="date"
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
              required
              className="h-12 w-full rounded-sm border border-[#B9CDE5] bg-white px-4 text-[0.95rem] text-[#1B2233] outline-none transition-colors focus:border-[#4A6E96] focus:ring-2 focus:ring-[#4A6E96]/20"
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 flex-1 items-center justify-center rounded-sm border border-[#B9CDE5] bg-white px-6 text-[0.78rem] font-light uppercase tracking-[0.15em] text-[#4A6E96] shadow-[0_6px_18px_-6px_rgba(27,34,51,0.3)] backdrop-blur-[10px] transition-colors hover:border-[#4A6E96] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <Link
              href="/profil"
              className="flex h-11 items-center justify-center rounded-sm border border-[rgba(150,177,208,0.5)] bg-transparent px-6 text-[0.78rem] font-light uppercase tracking-[0.15em] text-[#5B6879] transition-colors hover:border-[#4A6E96] hover:text-[#4A6E96]"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
