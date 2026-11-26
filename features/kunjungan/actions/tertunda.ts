"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { kunjunganPengambilan } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import {
  skemaBatalkanTertunda,
  skemaTandaiTertunda,
  skemaUbahTertunda,
} from "../validasi/pencatatan";
import type { HasilPencatatan } from "./pencatatan";

// Aksi admin "tandai tertunda" (kode tugas 2.3), dipisah dari pencatatan.ts
// supaya kedua file tetap di bawah 300 baris (CONTRIBUTING 4.2 no. 9).

/**
 * Admin menandai satu atau banyak kunjungan sebagai tertunda, dengan alasan dan
 * tanggal paling lambat. Hanya dari status dijadwalkan. Sebagian baris bisa
 * dilewati jika statusnya sudah berubah atau tanggal paling lambatnya tidak
 * setelah tanggal kunjungan; jumlahnya dilaporkan supaya tidak tampak seperti
 * sukses semua. Hanya admin; gagal jika isian salah.
 */
export async function tandaiTertunda(
  _sebelumnya: HasilPencatatan | null,
  formData: FormData,
): Promise<HasilPencatatan> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian form dengan skema (CONTRIBUTING 9.8).
  const hasil = skemaTandaiTertunda.safeParse({
    idKunjungan: formData.getAll("idKunjungan"),
    alasan: formData.get("alasan"),
    tanggalPalingLambat: formData.get("tanggalPalingLambat"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: "Periksa kembali isian yang ditandai.",
      galat: z.flattenError(hasil.error).fieldErrors,
    };
  }
  const { idKunjungan, alasan, tanggalPalingLambat } = hasil.data;

  // 3. Satu UPDATE bersyarat untuk semua ID terpilih. Syarat tanggal paling lambat
  //    ikut di WHERE: harus SETELAH tanggal kunjungan (permintaan bos). Ini juga
  //    mencegah CHECK kunjungan_pengambilan_tanggal_paling_lambat_valid menolak
  //    seluruh perintah karena satu baris.
  const diubah = await getDb()
    .update(kunjunganPengambilan)
    .set({
      status: "tertunda",
      alasanKendala: alasan,
      tanggalPalingLambat,
      dicatatOleh: cek.idUser,
    })
    .where(
      and(
        inArray(kunjunganPengambilan.idKunjungan, idKunjungan),
        eq(kunjunganPengambilan.status, "dijadwalkan"),
        lt(kunjunganPengambilan.tanggal, tanggalPalingLambat),
      ),
    )
    .returning({ idKunjungan: kunjunganPengambilan.idKunjungan });

  // 4. Laporkan hasil apa adanya, termasuk baris yang dilewati.
  if (diubah.length === 0) {
    return {
      ok: false,
      pesan:
        "Tidak ada kunjungan yang bisa ditandai tertunda. Status mungkin sudah berubah, atau tanggal paling lambatnya harus setelah tanggal kunjungan.",
    };
  }

  // 5. Segarkan halaman pencatatan.
  revalidatePath("/admin/kunjungan");
  if (diubah.length < idKunjungan.length) {
    return {
      ok: true,
      pesan: `${diubah.length} dari ${idKunjungan.length} kunjungan ditandai tertunda. Sisanya dilewati karena statusnya sudah berubah atau tanggal paling lambatnya harus setelah tanggal kunjungan.`,
    };
  }
  return {
    ok: true,
    pesan: `${diubah.length} kunjungan ditandai tertunda.`,
  };
}

/**
 * Admin mengubah alasan dan tanggal paling lambat satu kunjungan yang sudah
 * tertunda. Hanya dari status tertunda, supaya kunjungan yang sudah diambil atau
 * ditimbang tidak kembali menjadi tertunda. Hanya admin; gagal jika isian salah,
 * status sudah berubah, atau tanggal paling lambatnya tidak setelah tanggal kunjungan.
 */
export async function ubahTertunda(
  _sebelumnya: HasilPencatatan | null,
  formData: FormData,
): Promise<HasilPencatatan> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian form dengan skema (CONTRIBUTING 9.8).
  const hasil = skemaUbahTertunda.safeParse({
    idKunjungan: formData.get("idKunjungan"),
    alasan: formData.get("alasan"),
    tanggalPalingLambat: formData.get("tanggalPalingLambat"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: "Periksa kembali isian yang ditandai.",
      galat: z.flattenError(hasil.error).fieldErrors,
    };
  }
  const { idKunjungan, alasan, tanggalPalingLambat } = hasil.data;

  // 3. Satu UPDATE bersyarat dari status tertunda. Syarat tanggal ikut di WHERE:
  //    tanggal paling lambat harus setelah tanggal kunjungan (CONTRIBUTING 6.2).
  const [diubah] = await getDb()
    .update(kunjunganPengambilan)
    .set({ alasanKendala: alasan, tanggalPalingLambat, dicatatOleh: cek.idUser })
    .where(
      and(
        eq(kunjunganPengambilan.idKunjungan, idKunjungan),
        eq(kunjunganPengambilan.status, "tertunda"),
        lt(kunjunganPengambilan.tanggal, tanggalPalingLambat),
      ),
    )
    .returning({ idKunjungan: kunjunganPengambilan.idKunjungan });

  // 4. Bedakan penyebab gagal supaya pesannya jujur.
  if (!diubah) {
    const [sekarang] = await getDb()
      .select({ status: kunjunganPengambilan.status })
      .from(kunjunganPengambilan)
      .where(eq(kunjunganPengambilan.idKunjungan, idKunjungan))
      .limit(1);
    if (!sekarang) {
      return { ok: false, pesan: "Kunjungan ini sudah tidak ada. Muat ulang halaman." };
    }
    if (sekarang.status !== "tertunda") {
      return {
        ok: false,
        pesan: "Status kunjungan sudah berubah. Muat ulang halaman lalu coba lagi.",
      };
    }
    return {
      ok: false,
      pesan: "Tanggal paling lambat harus setelah tanggal kunjungan.",
    };
  }

  // 5. Segarkan halaman pencatatan.
  revalidatePath("/admin/kunjungan");
  return { ok: true, pesan: "Penundaan diperbarui." };
}

/**
 * Admin membatalkan penundaan satu kunjungan, sehingga statusnya kembali ke
 * dijadwalkan dan alasan serta tanggal paling lambatnya dikosongkan. Hanya dari
 * status tertunda. Hanya admin; gagal jika ID salah atau status sudah berubah.
 */
export async function batalkanTertunda(
  _sebelumnya: HasilPencatatan | null,
  formData: FormData,
): Promise<HasilPencatatan> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi ID (CONTRIBUTING 9.8).
  const hasil = skemaBatalkanTertunda.safeParse({
    idKunjungan: formData.get("idKunjungan"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
    };
  }

  // 3. Satu UPDATE bersyarat dari status tertunda; kolom alasan dan tanggal
  //    dikosongkan karena kunjungan ini kembali dijadwalkan (CONTRIBUTING 6.2).
  const [diubah] = await getDb()
    .update(kunjunganPengambilan)
    .set({
      status: "dijadwalkan",
      alasanKendala: null,
      tanggalPalingLambat: null,
      dicatatOleh: cek.idUser,
    })
    .where(
      and(
        eq(kunjunganPengambilan.idKunjungan, hasil.data.idKunjungan),
        eq(kunjunganPengambilan.status, "tertunda"),
      ),
    )
    .returning({ idKunjungan: kunjunganPengambilan.idKunjungan });

  if (!diubah) {
    return {
      ok: false,
      pesan: "Status kunjungan sudah berubah. Muat ulang halaman lalu coba lagi.",
    };
  }

  // 4. Segarkan halaman pencatatan.
  revalidatePath("/admin/kunjungan");
  return { ok: true, pesan: "Penundaan dibatalkan. Kunjungan kembali dijadwalkan." };
}
