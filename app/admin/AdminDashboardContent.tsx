"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalEvents: number;
  wasteThisMonth: number;
}

interface RecentUser {
  id: number;
  nama: string;
  email: string;
  peran: string;
  createdAt: string;
}

export default function AdminDashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalEvents: 0,
    wasteThisMonth: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/recent-users"),
      ]);
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      setStats(statsData);
      setRecentUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Pengguna</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-teal-600 font-medium">Pengguna Terdaftar</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Langganan Aktif</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeSubscriptions}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">Berlangganan</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Event</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-600 font-medium">Event Tersedia</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Sampah Terbulan Ini</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.wasteThisMonth.toFixed(1)} kg</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-2xl">♻️</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-amber-600 font-medium">Bulan Ini</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Pengguna Terbaru</h2>
          <Link href="/admin/users" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
            Lihat Semua →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peran</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bergabung</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-medium text-sm">
                        {user.nama?.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{user.nama}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.peran === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {user.peran}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) : "-"}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada pengguna terdaftar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/users" className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center text-xl group-hover:bg-teal-200 transition-colors">👤</div>
            <div>
              <h3 className="font-semibold text-gray-900">Kelola Pengguna</h3>
              <p className="text-sm text-gray-500">Tambah, edit, atau hapus pengguna</p>
            </div>
          </div>
        </Link>

        <Link href="/admin/schedules" className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-xl group-hover:bg-blue-200 transition-colors">📅</div>
            <div>
              <h3 className="font-semibold text-gray-900">Kelola Jadwal</h3>
              <p className="text-sm text-gray-500">Atur jadwal pengambilan</p>
            </div>
          </div>
        </Link>

        <div className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center text-xl group-hover:bg-amber-200 transition-colors">📊</div>
            <div>
              <h3 className="font-semibold text-gray-900">Lihat Laporan</h3>
              <p className="text-sm text-gray-500">Statistik dan laporan lengkap</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}