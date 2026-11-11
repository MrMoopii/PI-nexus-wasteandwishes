import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireLogin } from "@/lib/require-login";
import { getDb } from "@/lib/db";
import { dataLangganan, users } from "@/lib/db/schema";
import { formatTanggal } from "@/lib/format-tanggal";
import PaymentButton from "./payment-button";

export default function LanggananPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-(--hx-canvas) text-sm text-[#5B6879]">
          Memuat data langganan...
        </main>
      }
    >
      <LanggananContent />
    </Suspense>
  );
}

async function LanggananContent() {
  await connection();
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");

  const [user] = await getDb()
    .select({
      namaPelanggan: users.namaPelanggan,
      username: users.username,
      nomorTelp: users.nomorTelp,
      alamat: users.alamat,
    })
    .from(users)
    .where(eq(users.idUser, cek.idUser))
    .limit(1);

  if (!user) redirect("/auth/login");

  const [langganan] = await getDb()
    .select({
      status: dataLangganan.statusLangganan,
      mulai: dataLangganan.tanggalMulaiLangganan,
      akhir: dataLangganan.tanggalAkhirLangganan,
    })
    .from(dataLangganan)
    .where(
      and(
        eq(dataLangganan.userId, cek.idUser),
        eq(dataLangganan.statusLangganan, "aktif"),
      ),
    )
    .limit(1);

  const hariIni = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
  const aktif = Boolean(langganan?.akhir && langganan.akhir >= hariIni);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-(--hx-canvas) font-(family-name:--font-plus-jakarta-sans)">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0"
        style={{
          height: "100vh",
          background:
            "radial-gradient(120vw 90vh at 8% -10%, rgba(185, 205, 229, 0.55), transparent 62%), radial-gradient(110vw 80vh at 98% 108%, rgba(221, 231, 242, 0.85), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 opacity-50 mix-blend-overlay"
        style={{
          height: "100vh",
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
        <header className="mb-10 text-center">
          <span className="mb-2 block text-[0.68rem] uppercase tracking-[0.2em] text-[#93A0B2]">
            Dashboard
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1B2233] sm:text-4xl">
            Langganan Saya
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#5B6879]">
            Kelola langganan pengambilan sampah organik Anda.
          </p>
        </header>

        <section className="rounded-2xl border border-white/70 bg-white/85 p-6 shadow-[0_16px_40px_rgba(27,34,51,0.06)] sm:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-[#93A0B2]">
            Status langganan
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#1B2233]">
            {aktif ? "Aktif" : "Belum berlangganan"}
          </h2>
          {aktif && langganan?.akhir ? (
            <dl className="mt-6 grid gap-4 border-t border-[#B9CDE5]/50 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#93A0B2]">
                  Mulai
                </dt>
                <dd className="mt-1 font-medium text-[#1B2233]">
                  {langganan.mulai ? formatTanggal(langganan.mulai) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#93A0B2]">
                  Berakhir
                </dt>
                <dd className="mt-1 font-medium text-[#1B2233]">
                  {formatTanggal(langganan.akhir)}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="mt-5 border-t border-[#B9CDE5]/50 pt-5">
              <p className="text-sm leading-relaxed text-[#5B6879]">
                Aktifkan langganan untuk menggunakan layanan pengambilan sampah
                organik. Pembayaran berlaku selama 30 hari.
              </p>
              <p className="my-4 text-2xl font-semibold text-[#17AFB0]">
                Rp30.000 <span className="text-sm font-normal text-[#5B6879]">/ 30 hari</span>
              </p>
              <PaymentButton />
            </div>
          )}
          {aktif && (
            <div className="mt-6 border-t border-[#B9CDE5]/50 pt-5">
              <p className="mb-3 text-sm text-[#5B6879]">
                Atur dua hari dan waktu pengambilan rutin Anda.
              </p>
              <Link
                href="/langganan/jadwal"
                className="mb-4 inline-flex rounded-full bg-[#17AFB0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#12999A]"
              >
                Atur Jadwal Rutin
              </Link>
              <p className="mb-4 text-sm text-[#5B6879]">
                Perpanjangan dibayar manual. Pembayaran berhasil menambahkan 30
                hari setelah masa aktif saat ini.
              </p>
              <PaymentButton />
            </div>
          )}
          <dl className="mt-6 grid gap-4 border-t border-[#B9CDE5]/50 pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#93A0B2]">
                Nama pelanggan
              </dt>
              <dd className="mt-1 font-medium text-[#1B2233]">
                {user.namaPelanggan || user.username || "Pelanggan"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#93A0B2]">
                Nomor telepon
              </dt>
              <dd className="mt-1 font-medium text-[#1B2233]">
                {user.nomorTelp || "Belum diisi"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-[#93A0B2]">
                Alamat penjemputan
              </dt>
              <dd className="mt-1 font-medium text-[#1B2233]">
                {user.alamat || "Belum diisi"}
              </dd>
            </div>
          </dl>
        </section>

        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-full border border-[#B9CDE5] bg-white px-6 text-xs font-semibold uppercase tracking-[0.12em] text-[#5B6879] hover:border-[#17AFB0] hover:text-[#17AFB0]"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/profil/edit"
            className="flex h-11 items-center justify-center rounded-full bg-[#17AFB0]/10 px-6 text-xs font-semibold uppercase tracking-[0.12em] text-[#17AFB0] hover:bg-[#17AFB0] hover:text-white"
          >
            Ubah Data Profil
          </Link>
        </div>
      </div>
    </main>
  );
}
