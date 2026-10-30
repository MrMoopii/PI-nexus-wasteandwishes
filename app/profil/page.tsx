import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function ProfilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8">Memuat...</div>}>
      <ProfilContent />
    </Suspense>
  );
}

async function ProfilContent() {
  const session = await auth();
  const idUser = Number(session?.user?.idUser);

  if (!idUser) {
    redirect("/auth/login");
  }

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.idUser, idUser))
    .limit(1);

  if (!user) {
    redirect("/auth/login");
  }

  const formatTanggal = (tanggal: string | null) => {
    if (!tanggal) return "-";
    const date = new Date(tanggal);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#96B1D0]/40 bg-white text-5xl font-light text-[#4A6E96] shadow-[0_6px_18px_-6px_rgba(27,34,51,0.3)]">
            {user.username?.slice(0, 1).toUpperCase() || "P"}
          </div>
          <h1 className="font-(family-name:--font-plus-jakarta-sans) text-4xl font-light tracking-tight text-[#1B2233]">
            {user.namaPelanggan || user.username || "Pengguna"}
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[#93A0B2]">
            {user.peran === "admin" ? "Administrator" : "Pengguna"}
          </p>
        </div>

        <section className="mb-8">
          <span className="mb-4 block text-[0.68rem] uppercase tracking-[0.2em] text-[#93A0B2]">
            Informasi Profil
          </span>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-[rgba(150,177,208,0.35)] bg-[rgba(150,177,208,0.35)]">
            <div className="bg-[#F4F7FA] p-4">
              <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                Username
              </dt>
              <dd className="font-(family-name:--font-plus-jakarta-sans) text-lg font-light text-[#1B2233]">
                {user.username || "-"}
              </dd>
            </div>

            <div className="bg-[#F4F7FA] p-4">
              <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                Nama Lengkap
              </dt>
              <dd className="font-(family-name:--font-plus-jakarta-sans) text-lg font-light text-[#1B2233]">
                {user.namaPelanggan || "-"}
              </dd>
            </div>

            <div className="bg-[#F4F7FA] p-4">
              <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                Email
              </dt>
              <dd className="font-(family-name:--font-plus-jakarta-sans) text-lg font-light text-[#1B2233]">
                {user.email}
              </dd>
            </div>

            <div className="bg-[#F4F7FA] p-4">
              <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                Nomor Telepon
              </dt>
              <dd className="font-(family-name:--font-plus-jakarta-sans) text-lg font-light text-[#1B2233]">
                {user.nomorTelp || "-"}
              </dd>
            </div>

            <div className="bg-[#F4F7FA] p-4">
              <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                Tanggal Lahir
              </dt>
              <dd className="font-(family-name:--font-plus-jakarta-sans) text-lg font-light text-[#1B2233]">
                {formatTanggal(user.tanggalLahir)}
              </dd>
            </div>

            <div className="bg-[#F4F7FA] p-4">
              <dt className="mb-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                Bergabung
              </dt>
              <dd className="font-(family-name:--font-plus-jakarta-sans) text-lg font-light text-[#1B2233]">
                {formatTanggal(user.createdAt.toISOString())}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mb-8">
          <ul className="list-none border-t border-[rgba(150,177,208,0.35)]">
            <li className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-[rgba(150,177,208,0.35)] py-3">
              <span className="w-20 flex-none text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
                Alamat
              </span>
              <span className="text-[0.95rem] text-[#5B6879]">
                {user.alamat || "-"}
              </span>
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/profil/edit"
            className="flex h-11 items-center justify-center rounded-sm border border-[#B9CDE5] bg-white px-6 text-[0.78rem] font-light uppercase tracking-[0.15em] text-[#4A6E96] shadow-[0_6px_18px_-6px_rgba(27,34,51,0.3)] backdrop-blur-[10px] transition-colors hover:border-[#4A6E96]"
          >
            Edit Profil
          </Link>
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-sm border border-[rgba(150,177,208,0.5)] bg-transparent px-6 text-[0.78rem] font-light uppercase tracking-[0.15em] text-[#5B6879] transition-colors hover:border-[#4A6E96] hover:text-[#4A6E96]"
          >
            Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}
