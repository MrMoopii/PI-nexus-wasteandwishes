"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  namaPelanggan: string;
  username: string;
  email: string;
  peran: string;
  nomorTelp: string;
  alamat: string | null;
  tanggalLahir: string | null;
  statusLangganan: string;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  total: number;
  adminCount: number;
  subscribedCount: number;
}

export default function UsersManagementContent() {
  const [userList, setUserList] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    adminCount: 0,
    subscribedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [menuUserId, setMenuUserId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (role) params.set("role", role);

      const [usersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/users?${params}`, { signal: controller.signal }),
        fetch("/api/admin/users/stats", { signal: controller.signal }),
      ]);
      if (!usersRes.ok || !statsRes.ok) throw new Error("Data pengguna gagal dimuat");
      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      setUserList(usersData.users || []);
      setStats(statsData);
    } catch (error) {
      if (!controller.signal.aborted) console.error("Error fetching data:", error);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

    fetchData();
    return () => controller.abort();
  }, [search, role]);

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    setActionError("");
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: editingUser.nama,
          username: editingUser.username,
          email: editingUser.email,
          peran: editingUser.peran,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Gagal menyimpan perubahan.");
      setUserList((current) => current.map((user) => user.id === editingUser.id ? editingUser : user));
      setEditingUser(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user: User) {
    if (!window.confirm(`Hapus pengguna ${user.nama}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setActionError("");
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error || "Gagal menghapus pengguna.");
      setUserList((current) => current.filter((item) => item.id !== user.id));
      const statsResponse = await fetch("/api/admin/users/stats");
      if (statsResponse.ok) setStats(await statsResponse.json());
      setMenuUserId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Gagal menghapus pengguna.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Pengguna</h1>
        <p className="text-gray-600 mt-1">Kelola semua pengguna aplikasi</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
          >
            <option value="">Semua Peran</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {actionError && <p role="alert" className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{actionError}</p>}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">ID</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">Nama</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">Email</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">Telepon</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">Alamat</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">Tanggal Lahir</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">Peran</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">Langganan</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">Bergabung</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">Diperbarui</th>
                <th className="px-5 py-4 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em]">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {userList.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">#{user.id}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="text-sm font-semibold text-gray-900">{user.nama}</p>
                    <p className="mt-0.5 text-xs text-gray-500">@{user.username}</p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{user.nomorTelp || "-"}</td>
                  <td className="px-5 py-4 min-w-52 max-w-72 text-sm text-gray-600">{user.alamat || "-"}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">{user.tanggalLahir ? new Date(`${user.tanggalLahir}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.peran === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {user.peran}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.statusLangganan === "aktif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {user.statusLangganan === "aktif" ? "Aktif" : "Tidak"}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) : "-"}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="relative inline-block text-left">
                      <button type="button" aria-label={`Aksi untuk ${user.nama}`} aria-expanded={menuUserId === user.id} onClick={() => setMenuUserId(menuUserId === user.id ? null : user.id)} className="user-action-trigger rounded px-2 py-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-semibold tracking-widest">•••</button>
                      {menuUserId === user.id && (
                        <div className="user-action-menu absolute right-0 z-20 mt-2 w-32 rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg">
                          <button type="button" onClick={() => { setEditingUser({ ...user }); setMenuUserId(null); }} className="user-action-edit block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                          <button type="button" onClick={() => void deleteUser(user)} className="user-action-delete block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Hapus</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {userList.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <p className="font-medium text-gray-700">Belum ada pengguna</p>
                      <p className="mt-1 text-sm">Ubah kata kunci atau filter untuk melihat hasil lain.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingUser(null); }}>
          <form onSubmit={saveUser} className="w-full max-w-lg space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Pengguna</h2>
              <p className="mt-1 text-sm text-gray-500">Perbarui informasi akun pengguna.</p>
            </div>
            {([ ["nama", "Nama"], ["username", "Username"], ["email", "Email"] ] as const).map(([field, label]) => (
              <label key={field} className="block text-sm font-medium text-gray-700">{label}
                <input required type={field === "email" ? "email" : "text"} value={editingUser[field] || ""} onChange={(event) => setEditingUser({ ...editingUser, [field]: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
              </label>
            ))}
            <label className="block text-sm font-medium text-gray-700">Peran
              <select value={editingUser.peran} onChange={(event) => setEditingUser({ ...editingUser, peran: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal">
                <option value="user">User</option><option value="admin">Admin</option>
              </select>
            </label>
            {actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setEditingUser(null); setActionError(""); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">Batal</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Total Pengguna</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="mt-1 text-xs text-gray-500">Seluruh akun yang terdaftar</p>
            </div>
            <span className="rounded-md bg-teal-50 px-3 py-2 text-xs font-medium text-teal-800">Akun</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Admin</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{stats.adminCount}</p>
              <p className="mt-1 text-xs text-gray-500">Akun dengan akses administrator</p>
            </div>
            <span className="rounded-md bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">Peran</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Berlangganan</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{stats.subscribedCount}</p>
              <p className="mt-1 text-xs text-gray-500">Pengguna dengan layanan aktif</p>
            </div>
            <span className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">Aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
}
