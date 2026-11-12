"use client";

import { useState, useEffect } from "react";

interface Schedule {
  id: number;
  hariPengambilan: string;
  jamPengambilan: string;
  tanggalJanjian?: string | null;
  jenisJadwal: string;
  user?: {
    namaPelanggan: string;
    email: string;
  };
  janjian?: {
    status: string;
  };
  jumlahPengambilan?: number;
}

interface Stats {
  totalJadwal: number;
  rutinCount: number;
  janjianCount: number;
  totalWaste: number;
}

export default function SchedulesManagementContent() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalJadwal: 0,
    rutinCount: 0,
    janjianCount: 0,
    totalWaste: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [deleteSchedule, setDeleteSchedule] = useState<Schedule | null>(null);
  const [editFields, setEditFields] = useState({ hari: "", jam: "", tanggal: "", status: "menunggu" });
  const [actionError, setActionError] = useState("");

  const simpanEdit = async () => {
    if (!editSchedule) return;
    setActionError("");
    const response = await fetch(`/api/admin/jadwal-pengambilan/${editSchedule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editSchedule.jenisJadwal === "rutin"
        ? { hariPengambilan: editFields.hari, jamPengambilan: editFields.jam }
        : { tanggalJanjian: editFields.tanggal, jamPengambilan: editFields.jam, statusKonfirmasi: editFields.status }),
    });
    const result: unknown = await response.json();
    if (!response.ok) {
      setActionError(typeof result === "object" && result !== null && "error" in result && typeof result.error === "string" ? result.error : "Jadwal gagal diperbarui.");
      return;
    }
    setSchedules((current) => current.map((schedule) => {
      if (schedule.id !== editSchedule.id) return schedule;
      return {
        ...schedule,
        hariPengambilan: editSchedule.jenisJadwal === "rutin" ? editFields.hari : schedule.hariPengambilan,
        jamPengambilan: `${editFields.jam}:00`,
        tanggalJanjian: editSchedule.jenisJadwal === "janjian" ? editFields.tanggal : schedule.tanggalJanjian,
        janjian: editSchedule.jenisJadwal === "janjian" && schedule.janjian
          ? { ...schedule.janjian, status: editFields.status }
          : schedule.janjian,
      };
    }));
    setEditSchedule(null);
  };

  const hapusJadwal = async () => {
    if (!deleteSchedule) return;
    setActionError("");
    const response = await fetch(`/api/admin/jadwal-pengambilan/${deleteSchedule.id}`, { method: "DELETE" });
    const result: unknown = await response.json();
    if (!response.ok) {
      setActionError(typeof result === "object" && result !== null && "error" in result && typeof result.error === "string" ? result.error : "Jadwal gagal dihapus.");
      return;
    }
    setDeleteSchedule(null);
    window.location.reload();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (type) params.set("type", type);

        const [schedulesRes, statsRes] = await Promise.all([
          fetch(`/api/admin/jadwal-pengambilan?${params}`),
          fetch("/api/admin/jadwal-pengambilan/stats"),
        ]);
        const schedulesData = await schedulesRes.json();
        const statsData = await statsRes.json();
        setSchedules(schedulesData);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [search, type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="font-(family-name:--font-plus-jakarta-sans)">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Jadwal Pengambilan</h1>
        <p className="text-gray-600 mt-1">Kelola jadwal pengambilan sampah</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Jadwal</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalJadwal}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Seluruh jadwal pengambilan
              </p>
            </div>
            <span className="rounded-md bg-teal-50 px-3 py-2 text-xs font-medium text-teal-800">
              Semua
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Jadwal Rutin</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.rutinCount}
              </p>
              <p className="mt-1 text-xs text-gray-500">Pengambilan berkala</p>
            </div>
            <span className="rounded-md bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
              Berkala
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Jadwal Janjian
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.janjianCount}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Pengambilan sesuai permintaan
              </p>
            </div>
            <span className="rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Sesuai permintaan
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Sampah Terbulan
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalWaste.toFixed(1)} kg
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Akumulasi sampah terkelola
              </p>
            </div>
            <span className="rounded-md bg-green-50 px-3 py-2 text-xs font-medium text-green-800">
              Terkelola
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari berdasarkan nama pengguna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-colors"
          >
            <option value="">Semua Jenis</option>
            <option value="rutin">Jadwal Rutin</option>
            <option value="janjian">Jadwal Janjian</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis Jadwal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jadwal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{schedule.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-medium">
                        {schedule.user?.namaPelanggan
                          ?.slice(0, 1)
                          .toUpperCase() || "?"}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {schedule.user?.namaPelanggan || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {schedule.user?.email || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        schedule.jenisJadwal === "rutin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {schedule.jenisJadwal === "rutin" ? "Rutin" : "Janjian"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div>
                          <p className="font-medium">{schedule.jenisJadwal === "rutin" ? schedule.hariPengambilan : schedule.tanggalJanjian ?? "Tanggal belum diatur"}</p>
                      <p className="text-gray-500">{schedule.jamPengambilan}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {schedule.janjian && (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          schedule.janjian.status === "dikonfirmasi"
                            ? "bg-green-100 text-green-700"
                            : schedule.janjian.status === "ditolak"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {schedule.janjian.status === "dikonfirmasi"
                          ? "Dikonfirmasi"
                          : schedule.janjian.status === "ditolak"
                            ? "Ditolak"
                            : "Menunggu"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="text-teal-600 hover:text-teal-700 font-medium text-sm mr-3"
                      onClick={() => {
                        setEditFields({
                          hari: schedule.hariPengambilan,
                          jam: schedule.jamPengambilan.slice(0, 5),
                          tanggal: schedule.tanggalJanjian ?? "",
                          status: schedule.janjian?.status ?? "menunggu",
                        });
                        setActionError("");
                        setEditSchedule(schedule);
                      }}
                    >Edit</button>
                    <button
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                      onClick={() => { setActionError(""); setDeleteSchedule(schedule); }}
                    >Hapus</button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <p className="font-medium text-gray-700">
                        Belum ada jadwal
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Ubah kata kunci atau jenis jadwal untuk melihat hasil
                        lain.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Keterangan Jenis
        </h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-500"></span>
            <span className="text-sm text-gray-600">
              Jadwal Rutin (Pengambilan berkala)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500"></span>
            <span className="text-sm text-gray-600">
              Jadwal Janjian (Pengambilan sesuai request)
            </span>
          </div>
        </div>
      </div>
      {(editSchedule || deleteSchedule) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="schedule-dialog-title" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 id="schedule-dialog-title" className="text-xl font-semibold text-gray-900">{editSchedule ? "Edit Jadwal" : "Hapus Jadwal"}</h2>
            {actionError && <p role="alert" className="mt-3 rounded bg-red-50 p-3 text-sm text-red-800">{actionError}</p>}
            {editSchedule ? (
              <div className="mt-5 space-y-4">
                {editSchedule.jenisJadwal === "rutin" ? (
                  <label className="block text-sm">Hari
                    <select value={editFields.hari} onChange={(event) => setEditFields({ ...editFields, hari: event.target.value })} className="mt-1 block w-full rounded border p-2">
                      {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((hari) => <option key={hari}>{hari}</option>)}
                    </select>
                  </label>
                ) : (
                  <label className="block text-sm">Tanggal
                    <input type="date" required value={editFields.tanggal} onChange={(event) => setEditFields({ ...editFields, tanggal: event.target.value })} className="mt-1 block w-full rounded border p-2" />
                  </label>
                )}
                <label className="block text-sm">Jam
                  <input type="time" required value={editFields.jam} onChange={(event) => setEditFields({ ...editFields, jam: event.target.value })} className="mt-1 block w-full rounded border p-2" />
                </label>
                {editSchedule.jenisJadwal === "janjian" && (
                  <label className="block text-sm">Konfirmasi janjian
                    <select value={editFields.status} onChange={(event) => setEditFields({ ...editFields, status: event.target.value })} className="mt-1 block w-full rounded border p-2">
                      <option value="menunggu">Menunggu</option><option value="dikonfirmasi">Dikonfirmasi</option><option value="ditolak">Ditolak</option>
                    </select>
                  </label>
                )}
                <div className="flex justify-end gap-3"><button onClick={() => setEditSchedule(null)} className="rounded border px-4 py-2">Batal</button><button onClick={() => void simpanEdit()} className="rounded bg-teal-700 px-4 py-2 font-semibold text-white">Simpan</button></div>
              </div>
            ) : (
              <div className="mt-5 space-y-4"><p className="text-sm text-gray-600">Jadwal yang sudah memiliki riwayat pengambilan tidak dapat dihapus.</p><div className="flex justify-end gap-3"><button onClick={() => setDeleteSchedule(null)} className="rounded border px-4 py-2">Batal</button><button onClick={() => void hapusJadwal()} className="rounded bg-red-600 px-4 py-2 font-semibold text-white">Hapus</button></div></div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
