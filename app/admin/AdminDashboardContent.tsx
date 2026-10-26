"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalEvents: number;
  wasteThisMonth: number;
}

interface RecentUser {
  id: number;
  namaPelanggan: string;
  email: string;
  peran: string;
  createdAt: string;
}

const initialStats: DashboardStats = {
  totalUsers: 0,
  activeSubscriptions: 0,
  totalEvents: 0,
  wasteThisMonth: 0,
};

const numberFormat = new Intl.NumberFormat("id-ID");

function SparklineCard({ label, value, trend, trendLabel, colorClass, sparklineColor }: { label: string; value: string; trend: string; trendLabel: string; colorClass: string; sparklineColor: string }) {
  return (
    <article className="admin-metric-card relative flex flex-col overflow-hidden rounded-xl bg-white border border-slate-100 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-medium text-slate-500">{label}</h2>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 ${colorClass}`}>
          ✦
        </div>
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">{trend}</span>
          <span className="text-slate-400">{trendLabel}</span>
        </div>
      </div>
      {/* Decorative Sparkline */}
      <div className="absolute bottom-0 left-0 right-0 h-10 w-full opacity-40">
        <svg viewBox="0 0 100 25" preserveAspectRatio="none" className={`h-full w-full ${sparklineColor} stroke-current fill-none stroke-2`}>
          <path d="M0,25 C10,15 20,25 30,10 C40,5 50,15 60,5 C70,10 80,0 100,15" />
        </svg>
      </div>
    </article>
  );
}

export default function AdminDashboardContent() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats", { signal: controller.signal }),
          fetch("/api/admin/recent-users", { signal: controller.signal }),
        ]);
        const [statsData, usersData] = await Promise.all([
          statsRes.ok ? statsRes.json() : Promise.resolve(null),
          usersRes.ok ? usersRes.json() : Promise.resolve(null),
        ]);
        if (statsData && typeof statsData === "object" && !("error" in statsData)) {
          setStats({ ...initialStats, ...statsData });
        }
        setRecentUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Dashboard error:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => controller.abort();
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header & Breadcrumbs */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/admin" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/admin" className="hover:text-blue-600 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-700">Ringkasan</span>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SparklineCard label="Sampah Organik" value={loading ? "..." : `${Number(stats.wasteThisMonth).toFixed(1)} kg`} trend="+12%" trendLabel="bulan ini" colorClass="text-blue-500" sparklineColor="text-blue-500" />
        <SparklineCard label="Total Pengguna" value={loading ? "..." : numberFormat.format(stats.totalUsers)} trend="+5" trendLabel="pengguna baru" colorClass="text-teal-500" sparklineColor="text-teal-400" />
        <SparklineCard label="Langganan Aktif" value={loading ? "..." : numberFormat.format(stats.activeSubscriptions)} trend="+2.3%" trendLabel="vs bulan lalu" colorClass="text-emerald-500" sparklineColor="text-emerald-400" />
        <SparklineCard label="Total Event" value={loading ? "..." : numberFormat.format(stats.totalEvents)} trend="+1" trendLabel="event tertunda" colorClass="text-orange-500" sparklineColor="text-orange-400" />
      </section>

      {/* Content Areas */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl bg-white border border-slate-100 shadow-sm">
          <div className="border-b border-slate-100 p-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Pengguna Terbaru</h2>
            <Link href="/admin/users" className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">Lihat Semua</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Peran</th>
                  <th className="px-5 py-3 font-medium">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr><td colSpan={4} className="p-5 text-center text-slate-400">Memuat data...</td></tr>
                ) : recentUsers.length ? (
                  recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 font-medium">{user.namaPelanggan}</td>
                      <td className="px-5 py-4 text-slate-500">{user.email}</td>
                      <td className="px-5 py-4 capitalize">{user.peran}</td>
                      <td className="px-5 py-4 text-slate-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="p-5 text-center text-slate-500">Belum ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl bg-white border border-slate-100 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            <Link href="/admin/schedules" className="block rounded-lg border border-slate-100 p-3 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
              <p className="font-medium text-slate-800 text-sm">Kelola Jadwal Pengambilan</p>
              <p className="text-xs text-slate-500 mt-0.5">Atur rute dan jadwal kurir</p>
            </Link>
            <Link href="/admin/events" className="block rounded-lg border border-slate-100 p-3 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
              <p className="font-medium text-slate-800 text-sm">Tinjau Event Baru</p>
              <p className="text-xs text-slate-500 mt-0.5">Verifikasi pengajuan komunitas</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
