import "server-only";

import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { dataLangganan, pengajuanLangganan, users } from "@/lib/db/schema";
import { kondisiLanggananAktif } from "@/lib/langganan";
import { requireAdmin } from "@/lib/require-admin";

// Query halaman admin "Jadwal Pelanggan" (kode tugas 2.7): pelanggan aktif
// beserta pola jadwal tetap dari pengajuan siap_bayar-nya. Pola hanya bisa
// diubah admin, jadi seluruh berkas ini hanya untuk admin.

/** Jenis pelanggan yang dikenal, sama dengan CHECK pengajuan_langganan (2.1). */
export type JenisPelangganPola = "mou" | "reguler" | null;

/** Satu pelanggan aktif dengan pengajuan siap_bayar, untuk daftar dan form ubah pola. */
export type PelangganPolaAktif = {
  idPengajuan: number;
  namaInstansi: string;
  namaPelanggan: string | null;
  jenisPelanggan: JenisPelangganPola;
  /** Pola hari 1 = Senin sampai 5 = Jumat; kosong jika pengajuan belum punya pola. */
  hariPengambilan: number[];
  jamMulai: string | null;
  jamSelesai: string | null;
  tanggalAkhir: string | null;
};

/** Jenis pelanggan dari database ke tipe sempit; nilai asing berarti data rusak. */
function keJenisPelanggan(nilai: string | null): JenisPelangganPola {
  if (nilai === null) return null;
  if (nilai === "mou" || nilai === "reguler") return nilai;
  throw new Error(`Jenis pelanggan tidak dikenal: ${nilai}`);
}

/**
 * Pelanggan dengan langganan aktif (kondisiLanggananAktif(), CONTRIBUTING 9.7)
 * yang punya pengajuan siap_bayar, beserta pola jadwal tetapnya.
 * Hanya admin; belum login dialihkan ke login, bukan admin ke beranda.
 * Gagal (dilempar) jika jenis pelanggan di database tidak dikenal.
 */
export async function getPelangganPolaAktif(): Promise<PelangganPolaAktif[]> {
  // 1. Cek admin sebelum membaca data (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");

  // 2. Hanya kolom yang dipakai tampilan; pengajuan harus milik pelanggan yang sama.
  const daftar = await getDb()
    .select({
      idPengajuan: pengajuanLangganan.idPengajuan,
      namaInstansi: pengajuanLangganan.namaInstansi,
      namaPelanggan: users.namaPelanggan,
      jenisPelanggan: pengajuanLangganan.jenisPelanggan,
      hariPengambilan: pengajuanLangganan.hariPengambilan,
      jamMulai: pengajuanLangganan.jamMulai,
      jamSelesai: pengajuanLangganan.jamSelesai,
      tanggalAkhir: dataLangganan.tanggalAkhirLangganan,
    })
    .from(dataLangganan)
    .innerJoin(users, eq(users.idUser, dataLangganan.userId))
    .innerJoin(
      pengajuanLangganan,
      and(
        eq(pengajuanLangganan.idUser, dataLangganan.userId),
        eq(pengajuanLangganan.status, "siap_bayar"),
      ),
    )
    .where(kondisiLanggananAktif())
    .orderBy(asc(pengajuanLangganan.namaInstansi));

  // 3. Pola kosong tetap ditampilkan supaya admin bisa mengisinya; jam null berarti
  //    "menyesuaikan WW" dan hanya boleh untuk pelanggan reguler.
  return daftar.map((baris) => ({
    ...baris,
    jenisPelanggan: keJenisPelanggan(baris.jenisPelanggan),
    hariPengambilan: baris.hariPengambilan ?? [],
  }));
}
