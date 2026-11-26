"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { kunjunganPengambilan } from "@/lib/db/schema";
import { deleteImageKitFile } from "@/lib/imagekit";
import { requireAdmin } from "@/lib/require-admin";
import {
  skemaCatatBerat,
  skemaCatatEmber,
  skemaUbahPencatatan,
} from "../validasi/pencatatan";

// Aksi admin pencatatan kunjungan (kode tugas 2.3), dipanggil lewat useActionState
// dari halaman /admin/kunjungan. Setiap perubahan status memakai satu UPDATE …
// WHERE status IN (…) RETURNING (CONTRIBUTING 6.2), bukan baca-hitung-tulis.
// Aksi "tandai tertunda" ada di actions/tertunda.ts agar kedua file di bawah 300 baris.

/** Hasil aksi pencatatan: pesan sukses, atau pesan gagal beserta galat per isian. */
export type HasilPencatatan =
  | { ok: true; pesan: string }
  | {
      ok: false;
      pesan: string;
      galat?: Partial<Record<string, string[]>>;
    };

const STATUS_BERUBAH =
  "Status kunjungan sudah berubah. Muat ulang halaman lalu coba lagi.";

/** Halaman pencatatan disegarkan supaya baris langsung menampilkan status baru. */
function segarkanHalaman(): void {
  revalidatePath("/admin/kunjungan");
}

/**
 * Admin mencatat langkah 1: jumlah ember dan foto bukti, lalu status menjadi
 * diambil. Boleh dari dijadwalkan atau tertunda (tertunda berarti kunjungan
 * disusulkan dan akhirnya diambil). Hanya admin; gagal jika isian salah atau
 * status kunjungan sudah berubah.
 */
export async function catatEmber(
  _sebelumnya: HasilPencatatan | null,
  formData: FormData,
): Promise<HasilPencatatan> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian form dengan skema (CONTRIBUTING 9.8).
  const hasil = skemaCatatEmber.safeParse({
    idKunjungan: formData.get("idKunjungan"),
    jumlahEmber: formData.get("jumlahEmber"),
    fotoBukti: formData.get("fotoBukti"),
    fotoBuktiFileId: formData.get("fotoBuktiFileId"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: "Periksa kembali isian yang ditandai.",
      galat: z.flattenError(hasil.error).fieldErrors,
    };
  }
  const { idKunjungan, jumlahEmber, fotoBukti, fotoBuktiFileId } = hasil.data;

  // 3. Satu UPDATE bersyarat: hanya kunjungan yang masih dijadwalkan atau tertunda.
  //    Alasan tertunda dikosongkan karena kunjungan ini sudah diambil. Kunjungan
  //    dari kedua status itu belum punya foto, jadi tidak ada file ImageKit lama.
  const [diubah] = await getDb()
    .update(kunjunganPengambilan)
    .set({
      status: "diambil",
      jumlahEmber,
      fotoBukti,
      fotoBuktiFileId,
      alasanKendala: null,
      tanggalPalingLambat: null,
      dicatatOleh: cek.idUser,
    })
    .where(
      and(
        eq(kunjunganPengambilan.idKunjungan, idKunjungan),
        inArray(kunjunganPengambilan.status, ["dijadwalkan", "tertunda"]),
      ),
    )
    .returning({ idKunjungan: kunjunganPengambilan.idKunjungan });

  // Tidak ada baris berarti status sudah diubah di tab lain: jangan menimpa.
  if (!diubah) return { ok: false, pesan: STATUS_BERUBAH };

  // 4. Segarkan halaman pencatatan.
  segarkanHalaman();
  return { ok: true, pesan: "Jumlah ember dan foto bukti disimpan." };
}

/**
 * Admin mencatat langkah 2: berat setelah ditimbang, lalu status menjadi
 * ditimbang. Hanya dari status diambil, karena jumlah ember harus sudah tercatat.
 * Hanya admin; gagal jika isian salah atau status kunjungan sudah berubah.
 */
export async function catatBerat(
  _sebelumnya: HasilPencatatan | null,
  formData: FormData,
): Promise<HasilPencatatan> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian form dengan skema (CONTRIBUTING 9.8).
  const hasil = skemaCatatBerat.safeParse({
    idKunjungan: formData.get("idKunjungan"),
    beratKg: formData.get("beratKg"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: "Periksa kembali isian yang ditandai.",
      galat: z.flattenError(hasil.error).fieldErrors,
    };
  }
  const { idKunjungan, beratKg } = hasil.data;

  // 3. Satu UPDATE bersyarat dari status diambil. Kolom numeric ditulis sebagai
  //    string (CONTRIBUTING 9.2), dan ditimbang_pada diisi waktu database.
  const [diubah] = await getDb()
    .update(kunjunganPengambilan)
    .set({
      status: "ditimbang",
      beratKg: String(beratKg),
      ditimbangPada: sql`now()`,
      dicatatOleh: cek.idUser,
    })
    .where(
      and(
        eq(kunjunganPengambilan.idKunjungan, idKunjungan),
        eq(kunjunganPengambilan.status, "diambil"),
      ),
    )
    .returning({ idKunjungan: kunjunganPengambilan.idKunjungan });

  if (!diubah) return { ok: false, pesan: STATUS_BERUBAH };

  // 4. Segarkan halaman pencatatan.
  segarkanHalaman();
  return { ok: true, pesan: `Berat ${beratKg} kg disimpan.` };
}

/**
 * Admin mengubah pencatatan yang sudah tersimpan. Jumlah ember dan foto boleh
 * diubah setelah kunjungan diambil; berat hanya boleh diubah setelah kunjungan
 * ditimbang. Foto baru yang menggantikan foto lama dihapus dari ImageKit.
 * Hanya admin; gagal jika isian salah atau status kunjungan sudah berubah.
 */
export async function ubahPencatatan(
  _sebelumnya: HasilPencatatan | null,
  formData: FormData,
): Promise<HasilPencatatan> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian form dengan skema (CONTRIBUTING 9.8). Isian foto kosong
  //    berarti foto lama dipertahankan; berat kosong berarti berat lama dipertahankan.
  const hasil = skemaUbahPencatatan.safeParse({
    idKunjungan: formData.get("idKunjungan"),
    jumlahEmber: formData.get("jumlahEmber"),
    fotoBukti: formData.get("fotoBukti"),
    fotoBuktiFileId: formData.get("fotoBuktiFileId"),
    beratKg: formData.get("beratKg"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: "Periksa kembali isian yang ditandai.",
      galat: z.flattenError(hasil.error).fieldErrors,
    };
  }
  const { idKunjungan, jumlahEmber, beratKg } = hasil.data;
  const fotoBaru = hasil.data.fotoBukti === "" ? null : hasil.data.fotoBukti;
  const fileIdBaru =
    hasil.data.fotoBuktiFileId === "" ? null : hasil.data.fotoBuktiFileId;

  // 3. Satu UPDATE bersyarat; CTE `lama` menyimpan fileId foto lama untuk dihapus
  //    dari ImageKit setelah foto benar-benar terganti. Berat hanya boleh diubah
  //    jika statusnya sudah ditimbang (syarat di WHERE, CONTRIBUTING 6.2).
  //    ditimbang_pada sengaja tidak diubah: itu waktu penimbangan asli, bukan
  //    waktu koreksi.
  const hasilUbah = await getDb().execute<{ file_id: string | null }>(sql`
    WITH lama AS (
      SELECT foto_bukti_file_id AS file_id
      FROM kunjungan_pengambilan
      WHERE id_kunjungan = ${idKunjungan}
    ), ubah AS (
      UPDATE kunjungan_pengambilan
      SET jumlah_ember = ${jumlahEmber},
          foto_bukti = COALESCE(${fotoBaru}::text, foto_bukti),
          foto_bukti_file_id = COALESCE(${fileIdBaru}::text, foto_bukti_file_id),
          berat_kg = CASE WHEN ${beratKg}::numeric IS NULL THEN berat_kg ELSE ${beratKg}::numeric END,
          dicatat_oleh = ${cek.idUser}
      WHERE id_kunjungan = ${idKunjungan}
        AND status IN ('diambil', 'ditimbang')
        AND (${beratKg}::numeric IS NULL OR status = 'ditimbang')
      RETURNING id_kunjungan
    )
    SELECT lama.file_id FROM lama WHERE EXISTS (SELECT 1 FROM ubah)
  `);

  // Tidak ada baris berarti ada syarat yang tidak terpenuhi. Bedakan penyebabnya
  // supaya pesannya jujur, bukan selalu "status berubah".
  if (hasilUbah.rows.length === 0) {
    const [sekarang] = await getDb()
      .select({ status: kunjunganPengambilan.status })
      .from(kunjunganPengambilan)
      .where(eq(kunjunganPengambilan.idKunjungan, idKunjungan))
      .limit(1);
    if (!sekarang) {
      return { ok: false, pesan: "Kunjungan ini sudah tidak ada. Muat ulang halaman." };
    }
    if (sekarang.status !== "diambil" && sekarang.status !== "ditimbang") {
      return { ok: false, pesan: STATUS_BERUBAH };
    }
    // Status masih diambil tetapi berat ikut dikirim: berat baru boleh diubah
    // setelah kunjungan ditimbang.
    return {
      ok: false,
      pesan: "Berat hanya bisa diubah setelah kunjungan ditimbang. Muat ulang halaman.",
    };
  }

  // 4. Hapus foto lama dari ImageKit jika diganti dengan foto baru.
  const fileIdLama = hasilUbah.rows[0]?.file_id ?? null;
  if (fileIdBaru !== null && fileIdLama !== null && fileIdLama !== fileIdBaru) {
    await deleteImageKitFile(fileIdLama);
  }

  // 5. Segarkan halaman pencatatan.
  segarkanHalaman();
  return { ok: true, pesan: "Perubahan pencatatan disimpan." };
}
