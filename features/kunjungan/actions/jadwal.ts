"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  dataLangganan,
  hariLibur,
  kunjunganPengambilan,
  pengajuanLangganan,
} from "@/lib/db/schema";
import { kondisiLanggananAktif } from "@/lib/langganan";
import { requireAdmin } from "@/lib/require-admin";
import { tanggalKunjungan, type PetaHariLibur } from "../jadwal";
import { isAturanHariLibur, type AturanHariLibur } from "../types";
import {
  skemaRentangKunjungan,
  teksIsian,
  type GalatIsian,
  type IsianRentangKunjungan,
  type NilaiIsian,
} from "../validasi/jadwal";

// Aksi admin "Buat kunjungan" (kode tugas 2.2), dipanggil lewat useActionState dari
// halaman /admin/buat-kunjungan. Aksi hari libur ada di actions/hari-libur.ts.

/** Hasil buatKunjungan(): jumlah kunjungan baru dan yang sudah ada, atau pesan gagal. */
export type HasilBuatKunjungan =
  | {
      ok: true;
      mulai: string;
      selesai: string;
      dibuat: number;
      sudahAda: number;
      jumlahPelanggan: number;
      tanpaPola: number;
    }
  | {
      ok: false;
      pesan: string;
      galat?: GalatIsian<IsianRentangKunjungan>;
      nilai?: NilaiIsian<IsianRentangKunjungan>;
    };

// Baris per INSERT, jauh di bawah batas 65.535 parameter Postgres.
const BARIS_PER_INSERT = 500;

/**
 * Pelanggan dengan langganan aktif (lib/langganan.ts, CONTRIBUTING 9.7) beserta
 * pengajuan siap_bayar-nya, yaitu kesepakatan pola yang berlaku. Pengajuan kosong
 * berarti pelanggan aktif tanpa kesepakatan, misalnya dari alur langganan lama.
 * Status ditulis langsung karena fitur tidak saling impor (CONTRIBUTING 4.2 no. 6).
 */
async function bacaPelangganAktif() {
  return getDb()
    .select({
      idUser: dataLangganan.userId,
      tanggalAkhir: dataLangganan.tanggalAkhirLangganan,
      idPengajuan: pengajuanLangganan.idPengajuan,
      hariPengambilan: pengajuanLangganan.hariPengambilan,
      jamMulai: pengajuanLangganan.jamMulai,
      jamSelesai: pengajuanLangganan.jamSelesai,
    })
    .from(dataLangganan)
    .leftJoin(
      pengajuanLangganan,
      and(
        eq(pengajuanLangganan.idUser, dataLangganan.userId),
        eq(pengajuanLangganan.status, "siap_bayar"),
      ),
    )
    .where(kondisiLanggananAktif());
}

/**
 * Hari libur mulai tanggal `mulai`. Libur setelah akhir rentang ikut dibaca,
 * karena hasil geser boleh jatuh setelah rentang. Aturan asing berarti data rusak.
 */
async function bacaPetaHariLibur(mulai: string): Promise<PetaHariLibur> {
  const daftar = await getDb()
    .select({ tanggal: hariLibur.tanggal, aturan: hariLibur.aturan })
    .from(hariLibur)
    .where(gte(hariLibur.tanggal, mulai));

  const peta = new Map<string, AturanHariLibur>();
  for (const { tanggal, aturan } of daftar) {
    if (!isAturanHariLibur(aturan)) {
      throw new Error(`Aturan hari libur tidak dikenal: ${aturan}`);
    }
    peta.set(tanggal, aturan);
  }
  return peta;
}

/**
 * Admin membuat kunjungan untuk satu rentang tanggal dari pola hari setiap
 * pelanggan aktif, setelah aturan hari libur diterapkan. Aman dijalankan ulang:
 * tanggal yang sudah punya kunjungan dilewati, apa pun statusnya.
 * Hanya admin; gagal jika rentang tidak valid.
 */
export async function buatKunjungan(
  _sebelumnya: HasilBuatKunjungan | null,
  formData: FormData,
): Promise<HasilBuatKunjungan> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi rentang (CONTRIBUTING 9.8); teks yang diketik ikut dikembalikan.
  const nilai = teksIsian<IsianRentangKunjungan>(formData, ["mulai", "selesai"]);
  const hasil = skemaRentangKunjungan.safeParse(nilai);
  if (!hasil.success) {
    return {
      ok: false,
      pesan: "Periksa kembali rentang tanggal.",
      galat: z.flattenError(hasil.error).fieldErrors,
      nilai,
    };
  }
  const { mulai, selesai } = hasil.data;

  // 3. Baca pelanggan aktif dan hari libur yang bisa memengaruhi rentang ini.
  const [daftarPelanggan, libur] = await Promise.all([
    bacaPelangganAktif(),
    bacaPetaHariLibur(mulai),
  ]);

  // 4. Hitung tanggal setiap pelanggan dari polanya (jadwal.ts). Jam diambil dari
  //    pengajuan, jadi rentang jam MOU ikut berlaku di hari pengganti. Kunjungan hanya
  //    sampai tanggal akhir langganan; setelah diperpanjang, admin menjalankan aksi ini lagi.
  let tanpaPola = 0;
  const rencana: (typeof kunjunganPengambilan.$inferInsert)[] = [];
  for (const pelanggan of daftarPelanggan) {
    const { idUser, idPengajuan, hariPengambilan, tanggalAkhir } = pelanggan;
    if (
      idPengajuan === null ||
      hariPengambilan === null ||
      hariPengambilan.length === 0
    ) {
      tanpaPola++;
      continue;
    }
    const daftarTanggal = tanggalKunjungan({
      hariPengambilan,
      mulai,
      selesai,
      hariLibur: libur,
    });
    for (const tanggal of daftarTanggal) {
      // Tanpa tanggal akhir berarti tidak ada masa aktif, jadi tidak ada kunjungan.
      if (tanggalAkhir === null || tanggal > tanggalAkhir) continue;
      rencana.push({
        idUser,
        pengajuanId: idPengajuan,
        tanggal,
        jamMulai: pelanggan.jamMulai,
        jamSelesai: pelanggan.jamSelesai,
      });
    }
  }

  // 5. Sisipkan per kelompok. Unique (id_user, tanggal) membuat tanggal yang sudah punya
  //    kunjungan dilewati, jadi aksi aman diulang, juga jika sempat gagal di tengah.
  //    Baris yang sudah ada tidak diubah (keputusan 2.2, lihat README fitur).
  const db = getDb();
  let dibuat = 0;
  for (let awal = 0; awal < rencana.length; awal += BARIS_PER_INSERT) {
    const baru = await db
      .insert(kunjunganPengambilan)
      .values(rencana.slice(awal, awal + BARIS_PER_INSERT))
      .onConflictDoNothing({
        target: [kunjunganPengambilan.idUser, kunjunganPengambilan.tanggal],
      })
      .returning({ idKunjungan: kunjunganPengambilan.idKunjungan });
    dibuat += baru.length;
  }

  // 6. Segarkan halaman supaya hasilnya tampil bersama data terbaru.
  revalidatePath("/admin/buat-kunjungan");
  return {
    ok: true,
    mulai,
    selesai,
    dibuat,
    sudahAda: rencana.length - dibuat,
    jumlahPelanggan: daftarPelanggan.length - tanpaPola,
    tanpaPola,
  };
}
