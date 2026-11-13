import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { eq, desc, count, sum } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { pendaftaranEvent } from "@/lib/db/schema";
import { transaksi, detailTransaksi, produk } from "@/lib/db/schema";
import { jadwal, dataLangganan, riwayatPengambilan } from "@/lib/db/schema";
import { events } from "@/lib/db/schema";
import { formatTanggal } from "@/lib/format-tanggal";
import Link from "next/link";
import { redirect } from "next/navigation";
import ProfilKerangka from "./ProfilKerangka";

async function ProfilStats() {
  const session = await auth();
  const idUser = Number(session?.user?.idUser);

  if (!idUser) {
    redirect("/auth/login");
  }

  const db = getDb();

  // Get user data
  const [user] = await db
    .select({
      username: users.username,
      namaPelanggan: users.namaPelanggan,
      peran: users.peran,
      email: users.email,
      nomorTelp: users.nomorTelp,
      tanggalLahir: users.tanggalLahir,
      createdAt: users.createdAt,
      alamat: users.alamat,
    })
    .from(users)
    .where(eq(users.idUser, idUser))
    .limit(1);

  if (!user) {
    redirect("/auth/login");
  }

  // Get stats in parallel
  const [
    produkDibeliResult,
    eventDiikutiResult,
    sampahDiambilResult,
    langgananResult,
    recentEventsResult,
    recentPurchasesResult,
  ] = await Promise.all([
    // Total products purchased
    db
      .select({ total: count(detailTransaksi.idDetailTransaksi) })
      .from(detailTransaksi)
      .innerJoin(transaksi, eq(detailTransaksi.transaksiId, transaksi.idTransaksi))
      .where(eq(transaksi.userId, idUser)),

    // Total events followed
    db
      .select({ total: count(pendaftaranEvent.idPendaftaran) })
      .from(pendaftaranEvent)
      .where(eq(pendaftaranEvent.userId, idUser)),

    // Total waste picked up (sum of bobot_sampah)
    db
      .select({ total: sum(riwayatPengambilan.bobotSampah) })
      .from(riwayatPengambilan)
      .innerJoin(jadwal, eq(riwayatPengambilan.jadwalId, jadwal.idJadwal))
      .innerJoin(dataLangganan, eq(jadwal.langgananId, dataLangganan.idLangganan))
      .where(eq(dataLangganan.userId, idUser)),

    // Subscription status
    db
      .select({
        statusLangganan: dataLangganan.statusLangganan,
        tanggalMulai: dataLangganan.tanggalMulaiLangganan,
        tanggalAkhir: dataLangganan.tanggalAkhirLangganan,
      })
      .from(dataLangganan)
      .where(eq(dataLangganan.userId, idUser))
      .limit(1),

    // Recent events joined (last 5)
    db
      .select({
        namaEvent: events.namaEvent,
        tanggalPelaksanaan: events.tanggalPelaksanaan,
        tanggalDaftar: pendaftaranEvent.tanggalDaftar,
        statusEvent: events.statusEvent,
      })
      .from(pendaftaranEvent)
      .innerJoin(events, eq(pendaftaranEvent.eventId, events.idEvent))
      .where(eq(pendaftaranEvent.userId, idUser))
      .orderBy(desc(pendaftaranEvent.tanggalDaftar))
      .limit(5),

    // Recent purchases (last 5)
    db
      .select({
        namaProduk: produk.namaProduk,
        jumlahProduk: detailTransaksi.jumlahProduk,
        tanggalTransaksi: transaksi.tanggalTransaksi,
        hargaProduk: produk.hargaProduk,
      })
      .from(detailTransaksi)
      .innerJoin(transaksi, eq(detailTransaksi.transaksiId, transaksi.idTransaksi))
      .innerJoin(produk, eq(detailTransaksi.produkId, produk.idProduk))
      .where(eq(transaksi.userId, idUser))
      .orderBy(desc(transaksi.tanggalTransaksi))
      .limit(5),
  ]);

  const totalProdukDibeli = Number(produkDibeliResult[0]?.total || 0);
  const totalEventDiikuti = Number(eventDiikutiResult[0]?.total || 0);
  const totalSampahDiambil = Number(sampahDiambilResult[0]?.total || 0);
  const langganan = langgananResult[0];
  const recentEvents = recentEventsResult;
  const recentPurchases = recentPurchasesResult;

  // Determine subscription status
  let statusLabel = "Belum Berlangganan";
  let statusClass = "text-[#93A0B2]";
  let statusBg = "bg-[#E8EDF2]";

  if (langganan) {
    const now = new Date();
    const mulai = langganan.tanggalMulai ? new Date(langganan.tanggalMulai) : null;
    const akhir = langganan.tanggalAkhir ? new Date(langganan.tanggalAkhir) : null;

    if (mulai && akhir && mulai <= now && akhir >= now) {
      statusLabel = "Aktif";
      statusClass = "text-[#2D7D46]";
      statusBg = "bg-[#E8F5E9]";
    } else {
      statusLabel = "Tidak Aktif";
      statusClass = "text-[#C62828]";
      statusBg = "bg-[#FDEAE8]";
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-(--hx-canvas)">
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

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Left column: avatar + info */}
          <aside className="space-y-6">
            <section className="rounded-sm border border-[rgba(150,177,208,0.35)] bg-white p-6 text-center">
              <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#96B1D0]/40 bg-white text-5xl font-light text-[#4A6E96] shadow-[0_6px_18px_-6px_rgba(27,34,51,0.3)]">
                {user.username?.slice(0, 1).toUpperCase() || "P"}
              </div>
              <h1 className="font-(family-name:--font-plus-jakarta-sans) text-3xl font-light tracking-tight text-[#1B2233]">
                {user.namaPelanggan || user.username || "Pengguna"}
              </h1>
              <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[#93A0B2]">
                {user.peran === "admin" ? "Administrator" : "Pengguna"}
              </p>
              <Link
                href="/profil/edit"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-sm border border-[#B9CDE5] bg-white px-6 text-[0.78rem] font-light uppercase tracking-[0.15em] text-[#4A6E96] shadow-[0_6px_18px_-6px_rgba(27,34,51,0.3)] backdrop-blur-[10px] transition-colors hover:border-[#4A6E96]"
              >
                Edit Profil
              </Link>
            </section>

            <section className="rounded-sm border border-[rgba(150,177,208,0.35)] bg-white p-6">
              <h3 className="mb-4 font-(family-name:--font-plus-jakarta-sans) text-lg font-medium text-[#1B2233]">
                Informasi Profil
              </h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <ProfileInfoItem label="Username" value={user.username || "-"} />
                <ProfileInfoItem
                  label="Nama Lengkap"
                  value={user.namaPelanggan || "-"}
                />
                <ProfileInfoItem label="Email" value={user.email} />
                <ProfileInfoItem
                  label="Nomor Telepon"
                  value={user.nomorTelp || "-"}
                />
                <ProfileInfoItem
                  label="Tanggal Lahir"
                  value={
                    user.tanggalLahir ? formatTanggal(user.tanggalLahir) : "-"
                  }
                />
                <ProfileInfoItem
                  label="Bergabung"
                  value={user.createdAt.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "Asia/Jakarta",
                  })}
                />
              </dl>
              <div className="mt-6 border-t border-[rgba(150,177,208,0.35)] pt-5">
                <h4 className="mb-2 text-[0.66rem] font-medium uppercase tracking-[0.16em] text-[#93A0B2]">
                  Alamat
                </h4>
                <p className="text-sm leading-relaxed text-[#5B6879]">
                  {user.alamat || "-"}
                </p>
              </div>
            </section>
          </aside>

          {/* Right column: stats + status + history */}
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Produk Dibeli"
                value={totalProdukDibeli.toLocaleString("id-ID")}
                icon="📦"
                iconBg="bg-[#E8F0F8]"
                iconColor="text-[#4A6E96]"
              />
              <StatCard
                label="Event Diikuti"
                value={totalEventDiikuti.toLocaleString("id-ID")}
                icon="📅"
                iconBg="bg-[#E8F5E9]"
                iconColor="text-[#2D7D46]"
              />
              <StatCard
                label="Sampah Diambil"
                value={`${totalSampahDiambil.toLocaleString("id-ID")} kg`}
                icon="♻️"
                iconBg="bg-[#FFF3E0]"
                iconColor="text-[#E67E22]"
              />
            </section>

            <section className="rounded-sm border border-[rgba(150,177,208,0.35)] bg-white p-6">
              <h3 className="mb-4 font-(family-name:--font-plus-jakarta-sans) text-lg font-medium text-[#1B2233]">
                Status Langganan
              </h3>
              <div className="space-y-4">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${statusBg} ${statusClass}`}
                >
                  {statusLabel}
                </div>
                {langganan && (
                  <div className="space-y-2 text-sm text-[#5B6879]">
                    {langganan.tanggalMulai && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#93A0B2]">Mulai</span>
                        <span>
                          {formatTanggal(langganan.tanggalMulai as string)}
                        </span>
                      </div>
                    )}
                    {langganan.tanggalAkhir && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#93A0B2]">Berakhir</span>
                        <span>
                          {formatTanggal(langganan.tanggalAkhir as string)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <Link
                  href="/langganan"
                  className="block w-full text-center text-sm text-[#4A6E96] transition-colors hover:text-[#2D5A7A]"
                >
                  Kelola Langganan
                </Link>
              </div>
            </section>

            <section className="rounded-sm border border-[rgba(150,177,208,0.35)] bg-white">
              <div className="border-b border-[rgba(150,177,208,0.35)] px-6 py-4">
                <h3 className="font-(family-name:--font-plus-jakarta-sans) text-lg font-medium text-[#1B2233]">
                  Riwayat Aktivitas
                </h3>
              </div>
              <div className="divide-y divide-[rgba(150,177,208,0.35)]">
                {recentEvents.length > 0 && (
                  <ActivitySection title="Event yang Diikuti" icon="📅">
                    {recentEvents.map((event, idx) => (
                      <ActivityItem
                        key={`${event.namaEvent}-${event.tanggalDaftar}-${idx}`}
                        title={event.namaEvent}
                        date={
                          event.tanggalPelaksanaan
                            ? formatTanggal(event.tanggalPelaksanaan)
                            : "Tanggal belum ditentukan"
                        }
                        time={new Date(event.tanggalDaftar).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            timeZone: "Asia/Jakarta",
                          },
                        )}
                        status={
                          event.statusEvent === "aktif"
                            ? {
                                label: "Akan Datang",
                                className: "bg-[#E8F5E9] text-[#2D7D46]",
                              }
                            : event.statusEvent === "selesai"
                              ? {
                                  label: "Selesai",
                                  className: "bg-[#E8EDF2] text-[#4A6E96]",
                                }
                              : {
                                  label: "Draft",
                                  className: "bg-[#FFF3E0] text-[#E67E22]",
                                }
                        }
                      />
                    ))}
                  </ActivitySection>
                )}
                {recentPurchases.length > 0 && (
                  <ActivitySection title="Pembelian Produk" icon="📦">
                    {recentPurchases.map((purchase, idx) => (
                      <ActivityItem
                        key={`${purchase.namaProduk}-${purchase.tanggalTransaksi}-${idx}`}
                        title={purchase.namaProduk}
                        date={`${purchase.jumlahProduk} item · ${Number(purchase.hargaProduk).toLocaleString("id-ID")} IDR`}
                        time={new Date(
                          purchase.tanggalTransaksi,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          timeZone: "Asia/Jakarta",
                        })}
                      />
                    ))}
                  </ActivitySection>
                )}
                {recentEvents.length === 0 && recentPurchases.length === 0 && (
                  <div className="px-6 py-12 text-center text-[#93A0B2]">
                    Belum ada aktivitas tercatat
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-sm border border-[rgba(150,177,208,0.35)] bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBg} ${iconColor} text-xl`}>
          {icon}
        </div>
        <div>
          <p className="text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
            {label}
          </p>
          <p className="font-(family-name:--font-plus-jakarta-sans) text-2xl font-light text-[#1B2233]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 text-[0.66rem] uppercase tracking-[0.16em] text-[#93A0B2]">
        {label}
      </dt>
      <dd className="font-(family-name:--font-plus-jakarta-sans) text-base font-light text-[#1B2233]">
        {value}
      </dd>
    </div>
  );
}

function ActivitySection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-4 bg-[rgba(150,177,208,0.05)]">
      <h4 className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.1em] text-[#4A6E96]">
        <span>{icon}</span>
        {title}
      </h4>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ActivityItem({
  title,
  date,
  time,
  status,
}: {
  title: string;
  date: string;
  time: string;
  status?: { label: string; className: string };
}) {
  return (
    <div className="px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <p className="font-medium text-[#1B2233]">{title}</p>
        <p className="text-sm text-[#5B6879]">{date}</p>
      </div>
      <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-sm text-[#93A0B2]">{time}</span>
        {status && (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[0.6rem] font-medium ${status.className}`}>
            {status.label}
          </span>
        )}
      </div>
    </div>
  );
}

export default async function ProfilContent() {
  return (
    <Suspense fallback={<ProfilKerangka />}>
      <ProfilStats />
    </Suspense>
  );
}