"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pengajuanLangganan, pesanNegosiasi } from "@/lib/db/schema";
import { requireLogin } from "@/lib/require-login";
import { AKSI_PENGAJUAN, statusAsal } from "../aturan";
import { getRiwayatPesanNegosiasi } from "../queries/negosiasi";
import type { PesanNegosiasiTampilan } from "../types";
import {
  skemaIdPengajuan,
  skemaKirimPesan,
  skemaTawarHarga,
} from "../validasi/pelanggan";

/**
 * Hasil Server Action negosiasi untuk useActionState di komponen klien.
 * daftarPesan dipakai form untuk menampilkan riwayat tanpa memuat ulang halaman.
 */
export type HasilNegosiasi =
  | { ok: true; daftarPesan: PesanNegosiasiTampilan[] }
  | { ok: false; pesan: string };

/** Pesan penolakan status sudah berubah; disamakan agar tidak membocorkan
    pengajuan akun lain (pola batalkanPengajuan). */
const PESAN_STATUS_BERUBAH =
  "Status pengajuan sudah berubah. Muat ulang halaman.";

/** Riwayat pesan terbaru untuk pengajuan ini; kosong jika belum ada pesan. */
async function daftarTerbaru(
  idPengajuan: number,
): Promise<PesanNegosiasiTampilan[]> {
  return (await getRiwayatPesanNegosiasi(idPengajuan)) ?? [];
}

// ── Setujui penawaran (1.3) ─────────────────────────────────────

/**
 * Pelanggan menyetujui penawaran terakhir: status ditawarkan → disetujui_pelanggan
 * dan harga_final diambil dari harga usulan admin terakhir dalam satu perintah SQL
 * (CONTRIBUTING 6.2, 9.7). Gagal jika status sudah berubah atau bukan milik akun ini.
 */
export async function setujuiPenawaran(
  _sebelumnya: HasilNegosiasi | null,
  formData: FormData,
): Promise<HasilNegosiasi> {
  // 1. Cek sesi; idUser hanya dari sesi (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi ID pengajuan (CONTRIBUTING 9.8).
  const hasil = skemaIdPengajuan.safeParse({
    idPengajuan: formData.get("idPengajuan"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
    };
  }

  // 3. UPDATE bersyarat dalam satu perintah SQL: hanya pengajuan milik akun ini
  //    yang masih berstatus ditawarkan. Harga final diambil dari usulan admin
  //    terakhir (bagian 9.7). Jika ada lebih dari satu tawaran, yang terakhir dipakai.
  const [hasilUpdate] = await getDb()
    .update(pengajuanLangganan)
    .set({
      status: AKSI_PENGAJUAN.setujuiHarga.ke,
      hargaFinal: sql`COALESCE(
        (SELECT harga_usulan FROM pesan_negosiasi
         WHERE pengajuan_id = ${hasil.data.idPengajuan}
           AND pengirim = 'admin'
         ORDER BY id_pesan DESC
         LIMIT 1),
        harga_final
      )`,
      diperbaruiPada: sql`now()`,
    })
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, hasil.data.idPengajuan),
        eq(pengajuanLangganan.idUser, cek.idUser),
        inArray(pengajuanLangganan.status, statusAsal("setujuiHarga")),
      ),
    )
    .returning({ idPengajuan: pengajuanLangganan.idPengajuan });

  // 4. RETURNING kosong: status sudah berubah atau bukan milik akun ini.
  if (!hasilUpdate) {
    return { ok: false, pesan: PESAN_STATUS_BERUBAH };
  }

  // 5. Kembalikan daftar pesan terbaru dan segarkan halaman.
  const daftarPesan = await daftarTerbaru(hasil.data.idPengajuan);
  revalidatePath("/langganan");
  return { ok: true, daftarPesan };
}

// ── Tawar harga (1.3) ─────────────────────────────────────────────

/**
 * Pelanggan mengusulkan harga lain: status ditawarkan → negosiasi, dan pesan
 * negosiasi berisi harga_usulan disimpan dalam satu perintah SQL
 * (CONTRIBUTING 6.2: WITH … UPDATE … RETURNING lalu INSERT … SELECT).
 * Gagal jika status sudah berubah, harga tidak valid, atau bukan milik akun ini.
 */
export async function tawarHarga(
  _sebelumnya: HasilNegosiasi | null,
  formData: FormData,
): Promise<HasilNegosiasi> {
  // 1. Cek sesi.
  const cek = await requireLogin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian form (CONTRIBUTING 9.8).
  const hasil = skemaTawarHarga.safeParse({
    idPengajuan: formData.get("idPengajuan"),
    hargaUsulan: formData.get("hargaUsulan"),
    catatan: formData.get("catatan"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
    };
  }

  // 3. UPDATE status + INSERT pesan dalam satu perintah SQL (bagian 6.2).
  //    Harga tawaran disimpan di pesan_negosiasi, bukan di harga_final (bagian 9.7).
  //    Jika UPDATE tidak mengubah apa pun (status sudah berubah atau bukan milik
  //    akun ini), CTE-nya kosong sehingga INSERT juga kosong dan baris hasilnya nol.
  const hasilSql = await getDb().execute(
    sql`
      WITH ubah_status AS (
        UPDATE pengajuan_langganan
        SET status = 'negosiasi',
            diperbarui_pada = now()
        WHERE id_pengajuan = ${hasil.data.idPengajuan}
          AND id_user = ${cek.idUser}
          AND status = 'ditawarkan'
        RETURNING id_pengajuan
      ),
      simpan_pesan AS (
        INSERT INTO pesan_negosiasi
          (pengajuan_id, pengirim, id_pengirim, harga_usulan, pesan)
        SELECT
          ubah.id_pengajuan,
          'pelanggan',
          ${cek.idUser},
          ${hasil.data.hargaUsulan},
          ${hasil.data.catatan}
        FROM ubah_status ubah
        RETURNING 1
      )
      SELECT COUNT(*) FROM (
        SELECT 1 FROM ubah_status
        UNION ALL
        SELECT 1 FROM simpan_pesan
      ) hasil
    `,
  );

  // 4. Cek apakah UPDATE mengubah setidaknya satu baris.
  const [jumlah] = hasilSql.rows as unknown as [{ count: number }];
  const total = Number(jumlah?.count ?? 0);
  if (total === 0) {
    return { ok: false, pesan: PESAN_STATUS_BERUBAH };
  }

  // 5. Kembalikan daftar pesan terbaru dan segarkan halaman.
  const daftarPesan = await daftarTerbaru(hasil.data.idPengajuan);
  revalidatePath("/langganan");
  return { ok: true, daftarPesan };
}

// ── Kirim pesan tanpa harga (1.3) ─────────────────────────────────

/**
 * Pelanggan mengirim pesan tanpa harga saat status masih mengizinkan
 * (menunggu_review, ditawarkan, negosiasi). Status tidak berubah (aturan.ts).
 * Gagal jika pesan tidak valid, status tidak mengizinkan, atau bukan milik akun ini.
 */
export async function kirimPesan(
  _sebelumnya: HasilNegosiasi | null,
  formData: FormData,
): Promise<HasilNegosiasi> {
  // 1. Cek sesi.
  const cek = await requireLogin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian form (CONTRIBUTING 9.8).
  const hasil = skemaKirimPesan.safeParse({
    idPengajuan: formData.get("idPengajuan"),
    pesan: formData.get("pesan"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
    };
  }

  // 3. Pastikan pengajuan milik akun ini dan status masih mengizinkan (bagian 7.2 no. 9).
  const [ada] = await getDb()
    .select({ idPengajuan: pengajuanLangganan.idPengajuan })
    .from(pengajuanLangganan)
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, hasil.data.idPengajuan),
        eq(pengajuanLangganan.idUser, cek.idUser),
        inArray(pengajuanLangganan.status, statusAsal("kirimPesan")),
      ),
    )
    .limit(1);

  if (!ada) {
    return { ok: false, pesan: PESAN_STATUS_BERUBAH };
  }

  // 4. Simpan pesan tanpa harga (bagian 9.7).
  await getDb()
    .insert(pesanNegosiasi)
    .values({
      pengajuanId: hasil.data.idPengajuan,
      pengirim: "pelanggan",
      idPengirim: cek.idUser,
      hargaUsulan: null,
      pesan: hasil.data.pesan,
    });

  const daftarPesan = await daftarTerbaru(hasil.data.idPengajuan);
  revalidatePath("/langganan");
  return { ok: true, daftarPesan };
}
