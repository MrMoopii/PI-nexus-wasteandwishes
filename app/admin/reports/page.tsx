"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface PilihanJadwal {
  idJadwal: number;
  jenisJadwal: string;
  hariPengambilan: string;
  jamPengambilan: string;
  tanggalJanjian: string | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  idUser: number;
  namaPelanggan: string;
  email: string;
}

interface Laporan {
  idRiwayat: number;
  idJadwal: number;
  jenisJadwal: string;
  hariPengambilan: string;
  jamJadwal: string;
  tanggalJanjian: string | null;
  namaPelanggan: string;
  email: string;
  tanggalPengambilan: string;
  bobotSampah: string;
  fotoBuktiPengambilan: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPilihan(value: unknown): value is PilihanJadwal {
  if (!isRecord(value)) return false;
  return typeof value.idJadwal === "number" && typeof value.jenisJadwal === "string" &&
    typeof value.hariPengambilan === "string" && typeof value.jamPengambilan === "string" &&
    (value.tanggalJanjian === null || typeof value.tanggalJanjian === "string") &&
    (value.tanggalMulai === null || typeof value.tanggalMulai === "string") &&
    (value.tanggalSelesai === null || typeof value.tanggalSelesai === "string") &&
    typeof value.idUser === "number" && typeof value.namaPelanggan === "string" && typeof value.email === "string";
}

function isLaporan(value: unknown): value is Laporan {
  if (!isRecord(value)) return false;
  return typeof value.idRiwayat === "number" && typeof value.idJadwal === "number" &&
    typeof value.jenisJadwal === "string" && typeof value.hariPengambilan === "string" &&
    typeof value.jamJadwal === "string" &&
    (value.tanggalJanjian === null || typeof value.tanggalJanjian === "string") &&
    typeof value.namaPelanggan === "string" && typeof value.email === "string" &&
    typeof value.tanggalPengambilan === "string" && typeof value.bobotSampah === "string" &&
    (value.fotoBuktiPengambilan === null || typeof value.fotoBuktiPengambilan === "string");
}

function formatTanggalWaktu(value: string): string {
  const waktu = new Date(value);
  const tanggal = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(waktu);
  const jam = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(waktu);
  return `${tanggal}T${jam}`;
}

export default function ReportsPage() {
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [cari, setCari] = useState("");
  const [hasilCari, setHasilCari] = useState<PilihanJadwal[]>([]);
  const [idUserDipilih, setIdUserDipilih] = useState<number | null>(null);
  const [jadwalDipilih, setJadwalDipilih] = useState<PilihanJadwal | null>(null);
  const [dialog, setDialog] = useState<"buat" | "edit" | null>(null);
  const [idEdit, setIdEdit] = useState<number | null>(null);
  const [jenis, setJenis] = useState("");
  const [tanggalJam, setTanggalJam] = useState("");
  const [bobot, setBobot] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoLama, setFotoLama] = useState<string | null>(null);
  const [fotoDilihat, setFotoDilihat] = useState<string | null>(null);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);

  const muatLaporan = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/reports");
      if (!response.ok) throw new Error("Daftar laporan belum dapat dimuat.");
      const data: unknown = await response.json();
      if (!Array.isArray(data) || !data.every(isLaporan)) throw new Error("Format data laporan tidak valid.");
      setLaporan(data);
    } catch (error) {
      console.error("Gagal memuat laporan:", error);
      setPesan(error instanceof Error ? error.message : "Daftar laporan belum dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void muatLaporan(); }, 0);
    return () => window.clearTimeout(timer);
  }, [muatLaporan]);

  useEffect(() => {
    if (dialog !== "buat" || cari.trim().length < 2) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/admin/reports/users?search=${encodeURIComponent(cari.trim())}`);
          const data: unknown = await response.json();
          if (!response.ok) throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Pencarian pengguna gagal.");
          if (!Array.isArray(data) || !data.every(isPilihan)) throw new Error("Format data pencarian tidak valid.");
          setHasilCari(data);
        } catch (error) {
          console.error("Gagal mencari pengguna:", error);
          setPesan(error instanceof Error ? error.message : "Pencarian pengguna gagal.");
        }
      })();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [cari, dialog]);

  const bukaBuat = () => {
    setJadwalDipilih(null);
    setIdUserDipilih(null);
    setJenis("");
    setCari("");
    setTanggalJam("");
    setBobot("");
    setFoto(null);
    setFotoLama(null);
    setIdEdit(null);
    setPesan("");
    setDialog("buat");
  };

  const pilihJadwal = (item: PilihanJadwal) => {
    setJadwalDipilih(item);
    const hariIni = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
    const tanggal = item.jenisJadwal === "janjian" ? item.tanggalJanjian ?? hariIni : hariIni;
    setTanggalJam(`${tanggal}T${item.jamPengambilan.slice(0, 5)}`);
  };

  const bukaEdit = (item: Laporan) => {
    const pilihan: PilihanJadwal = {
      idJadwal: item.idJadwal,
      jenisJadwal: item.jenisJadwal,
      hariPengambilan: item.hariPengambilan,
      jamPengambilan: item.jamJadwal,
      tanggalJanjian: item.tanggalJanjian,
      tanggalMulai: null,
      tanggalSelesai: null,
      idUser: 0,
      namaPelanggan: item.namaPelanggan,
      email: item.email,
    };
    setIdEdit(item.idRiwayat);
    setJadwalDipilih(pilihan);
    setJenis(item.jenisJadwal);
    setCari(`${item.namaPelanggan} (${item.email})`);
    setTanggalJam(formatTanggalWaktu(item.tanggalPengambilan));
    setBobot(item.bobotSampah);
    setFoto(null);
    setFotoLama(item.fotoBuktiPengambilan);
    setPesan("");
    setDialog("edit");
  };

  const simpan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jadwalDipilih || !jenis || !tanggalJam || !bobot || (!foto && !fotoLama)) {
      setPesan("Pilih jadwal, isi tanggal/jam dan bobot, serta unggah foto bukti.");
      return;
    }
    if (foto && (!foto.type.startsWith("image/") || foto.size > 5 * 1024 * 1024)) {
      setPesan("Foto harus berupa gambar dan berukuran maksimal 5 MB.");
      return;
    }
    const formData = new FormData();
    formData.set("jadwalId", String(jadwalDipilih.idJadwal));
    formData.set("tanggalPengambilan", tanggalJam);
    formData.set("bobotSampah", bobot);
    if (foto) formData.set("fotoBuktiPengambilan", foto);
    setMenyimpan(true);
    try {
      const url = dialog === "edit" && idEdit !== null
        ? `/api/admin/reports/${idEdit}`
        : `/api/admin/schedules/${jadwalDipilih.idJadwal}/collection`;
      const response = await fetch(url, { method: dialog === "edit" ? "PATCH" : "POST", body: formData });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Laporan gagal disimpan.");
      setDialog(null);
      setPesan("Laporan berhasil disimpan.");
      await muatLaporan();
    } catch (error) {
      console.error("Gagal menyimpan laporan:", error);
      setPesan(error instanceof Error ? error.message : "Laporan gagal disimpan.");
    } finally {
      setMenyimpan(false);
    }
  };

  const hapus = async (id: number) => {
    if (!window.confirm("Hapus laporan ini?")) return;
    try {
      const response = await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(isRecord(data) && typeof data.error === "string" ? data.error : "Laporan gagal dihapus.");
      setPesan("Laporan berhasil dihapus.");
      await muatLaporan();
    } catch (error) {
      console.error("Gagal menghapus laporan:", error);
      setPesan(error instanceof Error ? error.message : "Laporan gagal dihapus.");
    }
  };

  return (
    <main className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-gray-900">Laporan Pengambilan</h1><p className="mt-1 text-gray-600">Buat dan kelola laporan pengambilan sampah.</p></div>
        <button type="button" onClick={bukaBuat} className="rounded-lg bg-teal-700 px-5 py-2.5 font-semibold text-white hover:bg-teal-800">Buat</button>
      </div>
      {pesan && <p role="status" className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-900">{pesan}</p>}
      {loading ? <p className="mt-6">Memuat laporan...</p> : laporan.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed p-8 text-center text-gray-600">Belum ada laporan yang dibuat.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="p-4">No.</th><th className="p-4">Pengguna</th><th className="p-4">Jenis</th><th className="p-4">Tanggal dan jam</th><th className="p-4">Bobot</th><th className="p-4">Foto bukti</th><th className="p-4">Aksi</th></tr></thead>
            <tbody className="divide-y">
              {laporan.map((item, index) => (
                <tr key={item.idRiwayat}>
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4"><p className="font-medium">{item.namaPelanggan}</p><p className="text-xs text-gray-500">{item.email}</p></td>
                  <td className="p-4">{item.jenisJadwal === "rutin" ? "Rutin" : "Janjian"}</td>
                  <td className="p-4">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(item.tanggalPengambilan))}</td>
                  <td className="p-4">{item.bobotSampah} kg</td>
                  <td className="p-4">
                    {item.fotoBuktiPengambilan ? (
                      <button type="button" onClick={() => setFotoDilihat(item.fotoBuktiPengambilan)} aria-label={`Perbesar foto bukti laporan ${index + 1}`}>
                        <Image
                          src={item.fotoBuktiPengambilan}
                          alt={`Foto bukti pengambilan laporan ${index + 1}`}
                          width={64}
                          height={64}
                          unoptimized
                          className="h-16 w-16 rounded object-cover"
                        />
                      </button>
                    ) : "Belum ada foto"}
                  </td>
                  <td className="p-4 whitespace-nowrap"><button type="button" onClick={() => bukaEdit(item)} className="mr-3 font-medium text-teal-700">Edit</button><button type="button" onClick={() => void hapus(item.idRiwayat)} className="font-medium text-red-700">Hapus</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={(event) => void simpan(event)} className="my-8 w-full max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold">{dialog === "buat" ? "Buat Laporan Pengambilan" : "Edit Laporan Pengambilan"}</h2>
            {dialog === "buat" && <>
              <label className="block text-sm font-medium">Cari nama pengguna berlangganan aktif
              <input value={cari} onChange={(event) => { setCari(event.target.value); setHasilCari([]); setIdUserDipilih(null); setJenis(""); setJadwalDipilih(null); }} minLength={2} className="mt-1 w-full rounded border p-2" placeholder="Ketik minimal 2 karakter nama" />
              </label>
              {hasilCari.length > 0 && <label className="block text-sm font-medium">Pilih pengguna
                <select required value={idUserDipilih ?? ""} onChange={(event) => { setIdUserDipilih(Number(event.target.value)); setJenis(""); setJadwalDipilih(null); setTanggalJam(""); }} className="mt-1 w-full rounded border p-2">
                  <option value="" disabled>Pilih pengguna</option>
                  {Array.from(new Map(hasilCari.map((item) => [item.idUser, item])).values()).map((item) => <option key={item.idUser} value={item.idUser}>{item.namaPelanggan} ({item.email})</option>)}
                </select>
              </label>}
              {idUserDipilih !== null && <label className="block text-sm font-medium">Jenis pengambilan
                <select required value={jenis} onChange={(event) => { setJenis(event.target.value); setJadwalDipilih(null); setTanggalJam(""); }} className="mt-1 w-full rounded border p-2">
                  <option value="" disabled>Pilih jenis pengambilan</option><option value="rutin">Rutin</option><option value="janjian">Janjian</option>
                </select>
              </label>}
              {idUserDipilih !== null && jenis && <label className="block text-sm font-medium">Pilih jadwal {jenis}
                <select required value={jadwalDipilih?.idJadwal ?? ""} onChange={(event) => { const item = hasilCari.find((hasil) => hasil.idJadwal === Number(event.target.value)); if (item) pilihJadwal(item); }} className="mt-1 w-full rounded border p-2">
                  <option value="" disabled>Pilih jadwal rutin atau janjian</option>
                  {hasilCari.filter((item) => item.idUser === idUserDipilih && item.jenisJadwal === jenis).map((item) => <option key={item.idJadwal} value={item.idJadwal}>{item.jenisJadwal === "rutin" ? item.hariPengambilan : item.tanggalJanjian ?? "Tanggal belum diatur"} pukul {item.jamPengambilan.slice(0, 5)}</option>)}
                </select>
              </label>}
              {cari.trim().length >= 2 && hasilCari.length === 0 && <p className="text-sm text-gray-500">Tidak ditemukan jadwal untuk pengguna dengan langganan aktif.</p>}
            </>}
            {jadwalDipilih && <>
              <p className="text-sm text-gray-600">Jadwal terpilih: {jadwalDipilih.namaPelanggan} · {jadwalDipilih.jenisJadwal === "rutin" ? jadwalDipilih.hariPengambilan : jadwalDipilih.tanggalJanjian ?? "Tanggal belum diatur"} · {jadwalDipilih.jamPengambilan.slice(0, 5)}</p>
              <label className="block text-sm font-medium">Tanggal dan jam pengambilan
                <input type="datetime-local" required value={tanggalJam} onChange={(event) => setTanggalJam(event.target.value)} className="mt-1 w-full rounded border p-2" />
              </label>
              <label className="block text-sm font-medium">Bobot sampah (kg)
                <input type="number" required min="0" step="0.01" value={bobot} onChange={(event) => setBobot(event.target.value)} className="mt-1 w-full rounded border p-2" />
              </label>
              <label className="block text-sm font-medium">Foto bukti pengambilan (gambar, maks. 5 MB)
                <input type="file" accept="image/*" required={dialog === "buat" && !fotoLama} onChange={(event) => setFoto(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded border p-2" />
              </label>
              {fotoLama && !foto && <p className="text-xs text-gray-500">Foto lama tersimpan. Pilih file baru jika ingin menggantinya.</p>}
            </>}
            {pesan && <p role="alert" className="text-sm text-red-700">{pesan}</p>}
            <div className="flex justify-end gap-3"><button type="button" onClick={() => setDialog(null)} className="rounded border px-4 py-2">Batal</button><button type="submit" disabled={!jadwalDipilih || menyimpan} className="rounded bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{menyimpan ? "Menyimpan..." : "Simpan"}</button></div>
          </form>
        </div>
      )}
      {fotoDilihat && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          role="presentation"
          onClick={() => setFotoDilihat(null)}
        >
          <button
            type="button"
            aria-label="Tutup foto"
            onClick={() => setFotoDilihat(null)}
            className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 font-semibold text-gray-900"
          >
            Tutup
          </button>
          <Image
            src={fotoDilihat}
            alt="Foto bukti pengambilan"
            width={1600}
            height={1200}
            unoptimized
            className="max-h-[90vh] max-w-[95vw] object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
