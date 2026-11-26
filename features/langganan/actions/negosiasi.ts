"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pengajuanLangganan } from "@/lib/db/schema";
import { requireLogin } from "@/lib/require-login";
import { AKSI_PENGAJUAN, statusAsal } from "../aturan";
import {
  skemaIdPengajuan,
  skemaKirimPesan,
  skemaTawarHarga,
} from "../validasi/negosiasi";

/** Hasil Server Action negosiasi untuk useActionState di komponen klien. */
export type HasilNegosiasi = { ok: true } | { ok: false; pesan: string };

/** Pesan penolakan status sudah berubah; disamakan agar tidak membocorkan
    pengajuan akun lain (pola batalkanPengajuan). */
const PESAN_STATUS_BERUBAH =
  "Status pengajuan sudah berubah. Muat ulang halaman.";

// ── Setujui penawaran (1.3) ─────────────────────────────────────

/**
 * Pelanggan menyetujui penawaran terakhir: status ditawarkan → disetujui_pelanggan
 * dan harga_final diambil dari harga usulan admin terakhir yang berisi harga
 * (harga_usulan IS NOT NULL), dalam satu perintah SQL (CONTRIBUTING 6.2, 9.7).
 * Gagal jika status sudah berubah, bukan milik akun ini, atau belum ada usulan
 * admin berisi harga.
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
  //    yang masih berstatus ditawarkan DAN punya usulan admin berisi harga
  //    (WHERE EXISTS). Harga final diambil dari usulan admin terakhir yang
  //    harganya tidak null (bagian 9.7). Karena WHERE menjamin usulan itu ada,
  //    subquery pasti mengembalikan nilai, tanpa nilai cadangan (11.3 no. 6).
  const [hasilUpdate] = await getDb()
    .update(pengajuanLangganan)
    .set({
      status: AKSI_PENGAJUAN.setujuiHarga.ke,
      hargaFinal: sql`(
        SELECT harga_usulan FROM pesan_negosiasi
        WHERE pengajuan_id = ${hasil.data.idPengajuan}
          AND pengirim = 'admin'
          AND harga_usulan IS NOT NULL
        ORDER BY id_pesan DESC
        LIMIT 1
      )`,
      diperbaruiPada: sql`now()`,
    })
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, hasil.data.idPengajuan),
        eq(pengajuanLangganan.idUser, cek.idUser),
        inArray(pengajuanLangganan.status, statusAsal("setujuiHarga")),
        sql`EXISTS (
          SELECT 1 FROM pesan_negosiasi
          WHERE pengajuan_id = ${pengajuanLangganan.idPengajuan}
            AND pengirim = 'admin'
            AND harga_usulan IS NOT NULL
        )`,
      ),
    )
    .returning({ idPengajuan: pengajuanLangganan.idPengajuan });

  // 4. RETURNING kosong: status sudah berubah, bukan milik akun ini, atau
  //    belum ada usulan admin berisi harga.
  if (!hasilUpdate) {
    return { ok: false, pesan: PESAN_STATUS_BERUBAH };
  }

  // 5. Segarkan halaman; riwayat diperbarui lewat re-render server component.
  revalidatePath("/langganan");
  return { ok: true };
}

// ── Tawar harga (1.3) ─────────────────────────────────────────────

/**
 * Pelanggan mengusulkan harga lain: status ditawarkan → negosiasi, dan pesan
 * negosiasi berisi harga_usulan disimpan dalam satu perintah SQL
 * (CONTRIBUTING 6.2: WITH … UPDATE … RETURNING lalu INSERT … SELECT … RETURNING).
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
  //    INSERT … SELECT … RETURNING id_pesan: jika UPDATE tidak mengubah apa pun
  //    (status sudah berubah atau bukan milik akun ini), CTE ubah_status kosong,
  //    INSERT juga kosong, dan RETURNING tidak menghasilkan baris apa pun.
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
      )
      INSERT INTO pesan_negosiasi
        (pengajuan_id, pengirim, id_pengirim, harga_usulan, pesan)
      SELECT
        ubah.id_pengajuan,
        'pelanggan',
        ${cek.idUser},
        ${hasil.data.hargaUsulan},
        ${hasil.data.catatan}
      FROM ubah_status ubah
      RETURNING id_pesan
    `,
  );

  // 4. Jika INSERT tidak menghasilkan baris, berarti UPDATE tidak mengubah apa pun.
  if (hasilSql.rows.length === 0) {
    return { ok: false, pesan: PESAN_STATUS_BERUBAH };
  }

  // 5. Segarkan halaman.
  revalidatePath("/langganan");
  return { ok: true };
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

  // 3. INSERT … SELECT … RETURNING dalam satu perintah SQL (bagian 6.2).
  //    Kepemilikan dan status dicek di dalam SELECT, jadi jika pengajuan sudah
  //    ditolak/dibatalkan di antara waktu halaman dimuat dan form dikirim,
  //    INSERT tidak akan menghasilkan baris apa pun.
  const hasilSql = await getDb().execute(
    sql`
      INSERT INTO pesan_negosiasi
        (pengajuan_id, pengirim, id_pengirim, harga_usulan, pesan)
      SELECT
        pengajuan_langganan.id_pengajuan,
        'pelanggan',
        ${cek.idUser},
        NULL,
        ${hasil.data.pesan}
      FROM pengajuan_langganan
      WHERE pengajuan_langganan.id_pengajuan = ${hasil.data.idPengajuan}
        AND pengajuan_langganan.id_user = ${cek.idUser}
        AND pengajuan_langganan.status IN ('menunggu_review', 'ditawarkan', 'negosiasi')
      RETURNING id_pesan
    `,
  );

  // 4. Jika INSERT tidak menghasilkan baris, berarti status sudah berubah
  //    atau pengajuan bukan milik akun ini.
  if (hasilSql.rows.length === 0) {
    return { ok: false, pesan: PESAN_STATUS_BERUBAH };
  }

  // 5. Segarkan halaman.
  revalidatePath("/langganan");
  return { ok: true };
}
