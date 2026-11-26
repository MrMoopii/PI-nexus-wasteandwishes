"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { kunjunganPengambilan } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { skemaTandaiTertunda } from "../validasi/pencatatan";
import type { HasilPencatatan } from "./pencatatan";

// Aksi admin "tandai tertunda" (kode tugas 2.3), dipisah dari pencatatan.ts
// supaya kedua file tetap di bawah 300 baris (CONTRIBUTING 4.2 no. 9).

/**
 * Admin menandai satu atau banyak kunjungan sebagai tertunda, dengan alasan dan
 * tanggal paling lambat. Hanya dari status dijadwalkan. Sebagian baris bisa
 * dilewati jika statusnya sudah berubah atau tanggal paling lambatnya sebelum
 * tanggal kunjungan; jumlahnya dilaporkan supaya tidak tampak seperti sukses semua.
 * Hanya admin; gagal jika isian salah.
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
  //    ikut di WHERE supaya CHECK kunjungan_pengambilan_tanggal_paling_lambat_valid
  //    tidak menolak seluruh perintah karena satu baris.
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
        lte(kunjunganPengambilan.tanggal, tanggalPalingLambat),
      ),
    )
    .returning({ idKunjungan: kunjunganPengambilan.idKunjungan });

  // 4. Laporkan hasil apa adanya, termasuk baris yang dilewati.
  if (diubah.length === 0) {
    return {
      ok: false,
      pesan:
        "Tidak ada kunjungan yang bisa ditandai tertunda. Status mungkin sudah berubah, atau tanggal paling lambatnya sebelum tanggal kunjungan.",
    };
  }

  // 5. Segarkan halaman pencatatan.
  revalidatePath("/admin/kunjungan");
  if (diubah.length < idKunjungan.length) {
    return {
      ok: true,
      pesan: `${diubah.length} dari ${idKunjungan.length} kunjungan ditandai tertunda. Sisanya dilewati karena statusnya sudah berubah atau tanggal paling lambatnya sebelum tanggal kunjungan.`,
    };
  }
  return {
    ok: true,
    pesan: `${diubah.length} kunjungan ditandai tertunda.`,
  };
}
