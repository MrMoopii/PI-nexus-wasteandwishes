import "server-only";

import { redirect } from "next/navigation";
import { asc, count, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pengajuanLangganan, pesanNegosiasi, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { STATUS_MENUNGGU_ADMIN } from "../aturan";
import {
  isJenisInstansi,
  isJenisPelanggan,
  isPengirimPesan,
  isStatusPengajuan,
  type DetailPengajuan,
  type JenisInstansi,
  type PesanNegosiasiTampilan,
  type StatusPengajuan,
} from "../types";

type BarisPengajuan = typeof pengajuanLangganan.$inferSelect;

/** Satu baris daftar pengajuan admin. Hanya kolom yang dipakai tabel. */
export type RingkasanPengajuanAdmin = Pick<
  BarisPengajuan,
  "idPengajuan" | "namaInstansi" | "estimasiEmber" | "dibuatPada"
> & {
  jenisInstansi: JenisInstansi;
  status: StatusPengajuan;
  namaPelanggan: string | null;
  email: string;
};

/** Detail pengajuan beserta data akun pelanggan yang mengajukan. */
export type DetailPengajuanAdmin = DetailPengajuan & {
  namaPelanggan: string | null;
  email: string;
  nomorTelp: string | null;
  alamat: string | null;
};

/** Hasil halaman daftar: baris sesuai filter dan jumlah yang menunggu admin. */
export type HalamanDaftarPengajuan = {
  daftar: RingkasanPengajuanAdmin[];
  jumlahMenunggu: number;
};

/**
 * Memastikan pemanggil admin sebelum query membaca data.
 * Pengguna belum login dialihkan ke halaman login, bukan admin ke beranda.
 */
async function pastikanAdmin(): Promise<void> {
  const cek = await requireAdmin();
  if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");
}

/**
 * Data halaman daftar pengajuan langganan untuk admin: baris sesuai filter
 * dan jumlah pengajuan yang menunggu tindakan admin.
 * Hanya admin; gagal jika status atau jenis instansi di database tidak dikenal.
 */
export async function getHalamanDaftarPengajuan(
  status?: StatusPengajuan,
): Promise<HalamanDaftarPengajuan> {
  // 1. Cek admin sebelum membaca data apa pun (CONTRIBUTING 7.2).
  await pastikanAdmin();

  // 2. Daftar pengajuan; filter hanya dipasang jika ada, karena kosong berarti semua (9.3).
  const daftar = await getDb()
    .select({
      idPengajuan: pengajuanLangganan.idPengajuan,
      namaInstansi: pengajuanLangganan.namaInstansi,
      jenisInstansi: pengajuanLangganan.jenisInstansi,
      estimasiEmber: pengajuanLangganan.estimasiEmber,
      status: pengajuanLangganan.status,
      dibuatPada: pengajuanLangganan.dibuatPada,
      namaPelanggan: users.namaPelanggan,
      email: users.email,
    })
    .from(pengajuanLangganan)
    .innerJoin(users, eq(users.idUser, pengajuanLangganan.idUser))
    .where(
      status === undefined
        ? undefined
        : eq(pengajuanLangganan.status, status),
    )
    .orderBy(
      desc(pengajuanLangganan.dibuatPada),
      desc(pengajuanLangganan.idPengajuan),
    );

  // 3. Jumlah menunggu admin memakai daftar status dari aturan.ts (kode tugas 0.2).
  const [hitung] = await getDb()
    .select({ jumlah: count() })
    .from(pengajuanLangganan)
    .where(inArray(pengajuanLangganan.status, [...STATUS_MENUNGGU_ADMIN]));
  if (!hitung) {
    throw new Error("Gagal menghitung pengajuan yang menunggu admin.");
  }

  // 4. Status dan jenis instansi diubah ke tipe sempit; nilai asing berarti data rusak.
  return {
    daftar: daftar.map((baris) => {
      if (!isStatusPengajuan(baris.status)) {
        throw new Error(`Status pengajuan tidak dikenal: ${baris.status}`);
      }
      if (!isJenisInstansi(baris.jenisInstansi)) {
        throw new Error(`Jenis instansi tidak dikenal: ${baris.jenisInstansi}`);
      }
      return {
        ...baris,
        status: baris.status,
        jenisInstansi: baris.jenisInstansi,
      };
    }),
    jumlahMenunggu: Number(hitung.jumlah),
  };
}

/**
 * Satu pengajuan langganan beserta data akun pelanggan, untuk halaman review admin.
 * Hanya admin; null jika pengajuan tidak ada. Gagal jika isi kolom tidak dikenal.
 */
export async function getDetailPengajuan(
  idPengajuan: number,
): Promise<DetailPengajuanAdmin | null> {
  // 1. Cek admin sebelum membaca data pengajuan (CONTRIBUTING 7.2).
  await pastikanAdmin();

  // 2. Ambil hanya kolom yang dipakai halaman detail.
  const [baris] = await getDb()
    .select({
      idPengajuan: pengajuanLangganan.idPengajuan,
      namaInstansi: pengajuanLangganan.namaInstansi,
      jenisInstansi: pengajuanLangganan.jenisInstansi,
      jenisInstansiLain: pengajuanLangganan.jenisInstansiLain,
      alamatPengambilan: pengajuanLangganan.alamatPengambilan,
      namaPic: pengajuanLangganan.namaPic,
      telpPic: pengajuanLangganan.telpPic,
      jenisLimbah: pengajuanLangganan.jenisLimbah,
      estimasiEmber: pengajuanLangganan.estimasiEmber,
      catatanPelanggan: pengajuanLangganan.catatanPelanggan,
      jenisPelanggan: pengajuanLangganan.jenisPelanggan,
      hariPengambilan: pengajuanLangganan.hariPengambilan,
      jamMulai: pengajuanLangganan.jamMulai,
      jamSelesai: pengajuanLangganan.jamSelesai,
      jumlahEmber: pengajuanLangganan.jumlahEmber,
      hargaFinal: pengajuanLangganan.hargaFinal,
      alasanDitolak: pengajuanLangganan.alasanDitolak,
      status: pengajuanLangganan.status,
      dibuatPada: pengajuanLangganan.dibuatPada,
      diperbaruiPada: pengajuanLangganan.diperbaruiPada,
      namaPelanggan: users.namaPelanggan,
      email: users.email,
      nomorTelp: users.nomorTelp,
      alamat: users.alamat,
    })
    .from(pengajuanLangganan)
    .innerJoin(users, eq(users.idUser, pengajuanLangganan.idUser))
    .where(eq(pengajuanLangganan.idPengajuan, idPengajuan))
    .limit(1);

  if (!baris) return null;

  // 3. Nilai pilihan dan numeric diubah ke bentuk tampilan; data rusak dilempar.
  if (!isStatusPengajuan(baris.status)) {
    throw new Error(`Status pengajuan tidak dikenal: ${baris.status}`);
  }
  if (!isJenisInstansi(baris.jenisInstansi)) {
    throw new Error(`Jenis instansi tidak dikenal: ${baris.jenisInstansi}`);
  }
  if (
    baris.jenisPelanggan !== null &&
    !isJenisPelanggan(baris.jenisPelanggan)
  ) {
    throw new Error(`Jenis pelanggan tidak dikenal: ${baris.jenisPelanggan}`);
  }

  return {
    ...baris,
    status: baris.status,
    jenisInstansi: baris.jenisInstansi,
    jenisPelanggan: baris.jenisPelanggan,
    // Kolom numeric dikembalikan sebagai string (CONTRIBUTING 9.2).
    hargaFinal: baris.hargaFinal === null ? null : Number(baris.hargaFinal),
  };
}

/**
 * Riwayat pesan negosiasi satu pengajuan, urut dari yang terlama (kode tugas 1.5).
 * Bentuknya PesanNegosiasiTampilan, sama dengan props komponen riwayat 1.2.
 * Hanya admin; daftar kosong jika belum ada pesan. Gagal jika pengirim tidak dikenal.
 */
export async function getPesanNegosiasi(
  idPengajuan: number,
): Promise<PesanNegosiasiTampilan[]> {
  // 1. Cek admin sebelum membaca pesan (CONTRIBUTING 7.2).
  await pastikanAdmin();

  // 2. Urutan waktu, lalu id untuk pesan yang dibuat di detik yang sama.
  //    Aksi terimaTawaran() memakai urutan yang sama untuk "tawaran terakhir".
  const daftar = await getDb()
    .select({
      idPesan: pesanNegosiasi.idPesan,
      pengirim: pesanNegosiasi.pengirim,
      hargaUsulan: pesanNegosiasi.hargaUsulan,
      pesan: pesanNegosiasi.pesan,
      dibuatPada: pesanNegosiasi.dibuatPada,
    })
    .from(pesanNegosiasi)
    .where(eq(pesanNegosiasi.pengajuanId, idPengajuan))
    .orderBy(asc(pesanNegosiasi.dibuatPada), asc(pesanNegosiasi.idPesan));

  // 3. Pengirim ke tipe sempit, harga numeric ke number (CONTRIBUTING 9.2).
  return daftar.map((baris) => {
    if (!isPengirimPesan(baris.pengirim)) {
      throw new Error(`Pengirim pesan tidak dikenal: ${baris.pengirim}`);
    }
    return {
      ...baris,
      pengirim: baris.pengirim,
      hargaUsulan:
        baris.hargaUsulan === null ? null : Number(baris.hargaUsulan),
    };
  });
}
