import "server-only";

import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { dataLangganan, pengajuanLangganan, users } from "@/lib/db/schema";
import { keadaanLangganan, type KeadaanLangganan } from "@/lib/langganan";
import { requireLogin } from "@/lib/require-login";
import { isProfilLengkap } from "@/lib/validasi-profil";
import { bolehBayar } from "../aturan";
import {
  isJenisInstansi,
  isJenisPelanggan,
  isStatusPengajuan,
  type DetailPengajuan,
} from "../types";

type AkunLanggananSaya = {
  /** Alasan akun belum boleh mengajukan langganan; null berarti boleh. */
  halangan: "bukan_pelanggan" | "profil_belum_lengkap" | null;
  /** Isian awal form pengajuan, diambil dari profil. */
  profil: {
    namaPelanggan: string | null;
    nomorTelp: string | null;
    alamat: string | null;
  };
  /** Langganan yang sudah dibayar (data_langganan), keadaannya dihitung lib/langganan.ts. */
  langganan: {
    keadaan: KeadaanLangganan;
    tanggalMulai: string | null;
    tanggalAkhir: string | null;
  };
};

/**
 * Akun pelanggan yang login untuk halaman /langganan: boleh mengajukan atau tidak,
 * isian awal dari profil, dan keadaan langganan yang sudah dibayar.
 * Juga dipakai kirimPengajuan() supaya syarat mengajukan hanya ditulis di sini.
 * Belum login dialihkan ke halaman login.
 */
export async function getAkunLanggananSaya(): Promise<AkunLanggananSaya> {
  // 1. Pastikan login. idUser diambil dari sesi, bukan dari URL (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");

  // 2. Profil dan baris langganan (boleh belum ada) dalam satu query.
  //    Hanya kolom yang dipakai, tanpa password (CONTRIBUTING 7.2 no. 7).
  const [baris] = await getDb()
    .select({
      peran: users.peran,
      username: users.username,
      namaPelanggan: users.namaPelanggan,
      nomorTelp: users.nomorTelp,
      alamat: users.alamat,
      tanggalLahir: users.tanggalLahir,
      statusLangganan: dataLangganan.statusLangganan,
      tanggalMulai: dataLangganan.tanggalMulaiLangganan,
      tanggalAkhir: dataLangganan.tanggalAkhirLangganan,
    })
    .from(users)
    .leftJoin(dataLangganan, eq(dataLangganan.userId, users.idUser))
    .where(eq(users.idUser, cek.idUser))
    .limit(1);

  // Akun di sesi sudah tidak ada di database: perlakukan seperti belum login.
  if (!baris) redirect("/auth/login");

  // 3. Hanya akun user dengan profil lengkap yang boleh mengajukan (CONTRIBUTING 7.2 no. 9).
  //    Peran dibaca dari database karena peran di token bisa usang (CONTRIBUTING 7.3).
  let halangan: AkunLanggananSaya["halangan"] = null;
  if (baris.peran !== "user") {
    halangan = "bukan_pelanggan";
  } else if (!isProfilLengkap(baris)) {
    halangan = "profil_belum_lengkap";
  }

  return {
    halangan,
    profil: {
      namaPelanggan: baris.namaPelanggan,
      nomorTelp: baris.nomorTelp,
      alamat: baris.alamat,
    },
    langganan: {
      keadaan: keadaanLangganan({
        status: baris.statusLangganan,
        tanggalAkhir: baris.tanggalAkhir,
      }),
      tanggalMulai: baris.tanggalMulai,
      tanggalAkhir: baris.tanggalAkhir,
    },
  };
}

/**
 * Pengajuan langganan terbaru milik pelanggan yang login, tanpa id_user.
 * Karena hanya ada satu pengajuan berjalan per akun, yang terbaru adalah yang berjalan
 * atau hasil terakhir (ditolak/dibatalkan). Null jika belum pernah mengajukan.
 * Belum login dialihkan ke halaman login.
 */
export async function getPengajuanSaya(): Promise<DetailPengajuan | null> {
  // 1. Pastikan login. idUser diambil dari sesi (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");

  // 2. Ambil pengajuan terbaru milik akun ini saja.
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
    })
    .from(pengajuanLangganan)
    .where(eq(pengajuanLangganan.idUser, cek.idUser))
    .orderBy(
      desc(pengajuanLangganan.dibuatPada),
      desc(pengajuanLangganan.idPengajuan),
    )
    .limit(1);

  if (!baris) return null;

  // 3. Sempitkan kolom pilihan ke tipenya. Nilai asing berarti data rusak,
  //    jadi dilempar ke error.tsx, bukan ditebak (CONTRIBUTING 8 no. 4).
  const { status, jenisInstansi, jenisPelanggan } = baris;
  if (!isStatusPengajuan(status)) {
    throw new Error(`Status pengajuan tidak dikenal: ${status}`);
  }
  if (!isJenisInstansi(jenisInstansi)) {
    throw new Error(`Jenis instansi tidak dikenal: ${jenisInstansi}`);
  }
  if (jenisPelanggan !== null && !isJenisPelanggan(jenisPelanggan)) {
    throw new Error(`Jenis pelanggan tidak dikenal: ${jenisPelanggan}`);
  }
  // harga_final diisi saat harga disepakati. Kosong di status yang boleh dibayar berarti
  // data rusak; tanpa ini tombol bayar hilang diam-diam (sama dengan getPengajuanSiapBayar()).
  if (bolehBayar(status) && baris.hargaFinal === null) {
    throw new Error(
      `Pengajuan ${baris.idPengajuan} berstatus siap_bayar tanpa harga_final.`,
    );
  }

  return {
    ...baris,
    status,
    jenisInstansi,
    jenisPelanggan,
    // Kolom numeric dikembalikan sebagai string (CONTRIBUTING 9.2).
    hargaFinal: baris.hargaFinal === null ? null : Number(baris.hargaFinal),
  };
}
