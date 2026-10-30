import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Data dummy — untuk data jadwal dan riwayat
const DUMMY_LANGGANAN = {
  status: "Aktif",
  mulai: "1 Oktober 2026",
  selesai: "31 Desember 2026",
};

const DUMMY_JADWAL = [
  { hari: "Senin", jam: "08:00", jenis: "Rutin" },
  { hari: "Kamis", jam: "08:00", jenis: "Rutin" },
];

const DUMMY_RIWAYAT = [
  {
    tanggal: "27 Oktober 2026",
    bobot: "3,2 kg",
    status: "Selesai",
  },
  {
    tanggal: "24 Oktober 2026",
    bobot: "2,8 kg",
    status: "Selesai",
  },
  {
    tanggal: "20 Oktober 2026",
    bobot: "4,1 kg",
    status: "Selesai",
  },
  {
    tanggal: "17 Oktober 2026",
    bobot: "2,5 kg",
    status: "Selesai",
  },
  {
    tanggal: "13 Oktober 2026",
    bobot: "3,7 kg",
    status: "Selesai",
  },
];

export default function LanggananPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F7FA] text-sm text-[#5B6879]">
          Memuat data langganan...
        </div>
      }
    >
      <LanggananContent />
    </Suspense>
  );
}

async function LanggananContent() {
  const session = await auth();
  const idUser = Number(session?.user?.idUser);

  if (!idUser) {
    redirect("/auth/login");
  }

  // Mengambil data nama_pelanggan, nomor_telp, dan alamat dari database
  const [user] = await getDb()
    .select({
      namaPelanggan: users.namaPelanggan,
      username: users.username,
      nomorTelp: users.nomorTelp,
      alamat: users.alamat,
    })
    .from(users)
    .where(eq(users.idUser, idUser))
    .limit(1);

  if (!user) {
    redirect("/auth/login");
  }

  const namaDisplay = user.namaPelanggan || user.username || "Pelanggan";
  const nomorTelpDisplay = user.nomorTelp || "-";
  const alamatDisplay = user.alamat || "-";

  const totalBobot = "16,3 kg";
  const totalPengambilan = DUMMY_RIWAYAT.length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F4F7FA]">
      {/* ── Ambient Background (konsisten dengan halaman Profil & Beranda) ── */}
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

      {/* ── Konten Utama ── */}
      <div className="relative z-10 mx-auto max-w-[820px] px-5 py-12 sm:py-20">
        {/* Header Halaman */}
        <div className="mb-10 text-center">
          <span className="mb-2 block text-[0.68rem] uppercase tracking-[0.2em] text-[#93A0B2]">
            Dashboard
          </span>
          <h1 className="font-(family-name:--font-plus-jakarta-sans) text-3xl font-semibold tracking-tight text-[#1B2233] sm:text-4xl">
            Langganan Saya
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#5B6879]">
            Kelola jadwal penjemputan sampah organik dan pantau riwayat
            pengambilan Anda.
          </p>
          <div className="mx-auto mt-4 h-0.5 w-16 rounded-full bg-[#17AFB0]" />
        </div>

        {/* ── Kartu Status Langganan & Data Pelanggan ── */}
        <section className="mb-8">
          <span className="mb-4 block text-[0.68rem] uppercase tracking-[0.2em] text-[#93A0B2]">
            Status Langganan &amp; Pelanggan
          </span>

          <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-[0_16px_40px_rgba(27,34,51,0.06)] backdrop-blur-md sm:p-8">
            {/* Badge Status */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#17AFB0] shadow-[0_0_6px_rgba(23,175,176,0.5)]" />
                <span className="font-(family-name:--font-plus-jakarta-sans) text-lg font-semibold text-[#1B2233]">
                  {DUMMY_LANGGANAN.status}
                </span>
              </div>
              <span className="rounded-full border border-[#17AFB0]/30 bg-[#17AFB0]/10 px-3 py-0.5 text-[0.66rem] font-semibold uppercase tracking-widest text-[#17AFB0]">
                Berlangganan
              </span>
            </div>

            {/* Detail Grid: Data Pelanggan (DB) + Info Periode */}
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-[rgba(150,177,208,0.35)] bg-[rgba(150,177,208,0.35)] sm:grid-cols-2 md:grid-cols-3">
              <div className="bg-[#F4F7FA] p-4">
                <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                  Nama Pelanggan
                </dt>
                <dd className="font-(family-name:--font-plus-jakarta-sans) text-base font-medium text-[#1B2233]">
                  {namaDisplay}
                </dd>
              </div>

              <div className="bg-[#F4F7FA] p-4">
                <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                  Nomor Telepon
                </dt>
                <dd className="font-(family-name:--font-plus-jakarta-sans) text-base font-medium text-[#1B2233]">
                  {nomorTelpDisplay}
                </dd>
              </div>

              <div className="bg-[#F4F7FA] p-4">
                <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                  Status Paket
                </dt>
                <dd className="font-(family-name:--font-plus-jakarta-sans) text-base font-medium text-[#17AFB0]">
                  {DUMMY_LANGGANAN.status}
                </dd>
              </div>

              <div className="bg-[#F4F7FA] p-4">
                <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                  Periode Mulai
                </dt>
                <dd className="font-(family-name:--font-plus-jakarta-sans) text-base font-medium text-[#1B2233]">
                  {DUMMY_LANGGANAN.mulai}
                </dd>
              </div>

              <div className="bg-[#F4F7FA] p-4">
                <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                  Periode Berakhir
                </dt>
                <dd className="font-(family-name:--font-plus-jakarta-sans) text-base font-medium text-[#1B2233]">
                  {DUMMY_LANGGANAN.selesai}
                </dd>
              </div>

              <div className="bg-[#F4F7FA] p-4">
                <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                  Alamat Penjemputan
                </dt>
                <dd className="font-(family-name:--font-plus-jakarta-sans) text-base font-medium text-[#1B2233]">
                  {alamatDisplay}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ── Statistik Ringkas ── */}
        <section className="mb-8">
          <span className="mb-4 block text-[0.68rem] uppercase tracking-[0.2em] text-[#93A0B2]">
            Ringkasan
          </span>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/70 bg-white/80 p-5 text-center shadow-[0_8px_30px_rgba(27,34,51,0.04)] backdrop-blur-sm">
              <p className="mb-1 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                Total Pengambilan
              </p>
              <p className="font-(family-name:--font-plus-jakarta-sans) text-2xl font-semibold text-[#17AFB0]">
                {totalPengambilan}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-5 text-center shadow-[0_8px_30px_rgba(27,34,51,0.04)] backdrop-blur-sm">
              <p className="mb-1 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                Total Sampah
              </p>
              <p className="font-(family-name:--font-plus-jakarta-sans) text-2xl font-semibold text-[#17AFB0]">
                {totalBobot}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-white/70 bg-white/80 p-5 text-center shadow-[0_8px_30px_rgba(27,34,51,0.04)] backdrop-blur-sm sm:col-span-1">
              <p className="mb-1 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                Jadwal per Minggu
              </p>
              <p className="font-(family-name:--font-plus-jakarta-sans) text-2xl font-semibold text-[#17AFB0]">
                {DUMMY_JADWAL.length}×
              </p>
            </div>
          </div>
        </section>

        {/* ── Jadwal Penjemputan ── */}
        <section className="mb-8">
          <span className="mb-4 block text-[0.68rem] uppercase tracking-[0.2em] text-[#93A0B2]">
            Jadwal Penjemputan
          </span>

          <div className="rounded-2xl border border-white/70 bg-white/80 shadow-[0_16px_40px_rgba(27,34,51,0.06)] backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(150,177,208,0.35)]">
                    <th className="px-6 py-4 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#93A0B2]">
                      Hari
                    </th>
                    <th className="px-6 py-4 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#93A0B2]">
                      Jam
                    </th>
                    <th className="px-6 py-4 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#93A0B2]">
                      Jenis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DUMMY_JADWAL.map((j, i) => (
                    <tr
                      key={i}
                      className="border-b border-[rgba(150,177,208,0.2)] last:border-b-0"
                    >
                      <td className="px-6 py-4 font-(family-name:--font-plus-jakarta-sans) font-medium text-[#1B2233]">
                        {j.hari}
                      </td>
                      <td className="px-6 py-4 text-[#5B6879]">{j.jam}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-[#17AFB0]/30 bg-[#17AFB0]/10 px-2.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-widest text-[#17AFB0]">
                          {j.jenis}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Riwayat Pengambilan ── */}
        <section className="mb-8">
          <span className="mb-4 block text-[0.68rem] uppercase tracking-[0.2em] text-[#93A0B2]">
            Riwayat Pengambilan
          </span>

          <div className="rounded-2xl border border-white/70 bg-white/80 shadow-[0_16px_40px_rgba(27,34,51,0.06)] backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(150,177,208,0.35)]">
                    <th className="px-6 py-4 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#93A0B2]">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#93A0B2]">
                      Bobot
                    </th>
                    <th className="px-6 py-4 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#93A0B2]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DUMMY_RIWAYAT.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-[rgba(150,177,208,0.2)] last:border-b-0"
                    >
                      <td className="px-6 py-4 font-(family-name:--font-plus-jakarta-sans) font-medium text-[#1B2233]">
                        {r.tanggal}
                      </td>
                      <td className="px-6 py-4 text-[#5B6879]">{r.bobot}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-widest text-emerald-600">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Tombol Navigasi ── */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-full border border-[#B9CDE5] bg-white px-6 text-[0.78rem] font-semibold uppercase tracking-[0.15em] text-[#5B6879] shadow-[0_6px_18px_-6px_rgba(27,34,51,0.15)] backdrop-blur-[10px] transition-colors hover:border-[#17AFB0] hover:text-[#17AFB0]"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/profil/edit"
            className="flex h-11 items-center justify-center rounded-full border border-transparent bg-[#17AFB0]/10 px-6 text-[0.78rem] font-semibold uppercase tracking-[0.15em] text-[#17AFB0] transition-colors hover:bg-[#17AFB0] hover:text-white"
          >
            Ubah Data Profil
          </Link>
        </div>
      </div>
    </div>
  );
}
