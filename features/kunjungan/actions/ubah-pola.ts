"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  dataLangganan,
  hariLibur,
  pengajuanLangganan,
} from "@/lib/db/schema";
import { kondisiLanggananAktif } from "@/lib/langganan";
import { requireAdmin } from "@/lib/require-admin";
import { tanggalKunjungan, type PetaHariLibur } from "../jadwal";
import { isAturanHariLibur, type AturanHariLibur } from "../types";
import {
  skemaUbahPola,
  type GalatIsianUbahPola,
  type NilaiIsianUbahPola,
} from "../validasi/ubah-pola";

// Aksi admin mengubah pola jadwal tetap pelanggan (kode tugas 2.7), dipanggil lewat
// useActionState dari /admin/jadwal-pelanggan. Pola tetap hanya ditentukan WW, jadi
// pelanggan tidak bisa mengajukannya. Kunjungan yang sudah diambil, ditimbang,
// tertunda, atau dilewati tidak diubah (keputusan issue 2.7).

/** Hasil ubahPolaJadwal(): jumlah kunjungan yang dibatalkan dan dibuat ulang, atau pesan gagal. */
export type HasilUbahPola =
  | {
      ok: true;
      pesan: string;
      dibatalkan: number;
      dibuat: number;
    }
  | {
      ok: false;
      pesan: string;
      galat?: GalatIsianUbahPola;
      nilai?: NilaiIsianUbahPola;
    };

/** Teks isian form apa adanya, untuk divalidasi lalu dikembalikan ke form saat gagal. */
function nilaiIsian(formData: FormData): NilaiIsianUbahPola {
  const teks = (nama: string) => {
    const isian = formData.get(nama);
    return typeof isian === "string" ? isian : undefined;
  };
  return {
    idPengajuan: teks("idPengajuan"),
    hariPengambilan: formData
      .getAll("hariPengambilan")
      .filter((hari): hari is string => typeof hari === "string"),
    jamMulai: teks("jamMulai"),
    jamSelesai: teks("jamSelesai"),
    berlakuMulai: teks("berlakuMulai"),
    alasan: teks("alasan"),
  };
}

/**
 * Hari libur mulai tanggal `mulai`, untuk menghitung ulang kunjungan. Libur setelah
 * akhir rentang ikut dibaca karena hasil geser boleh jatuh setelahnya.
 * Aturan asing berarti data rusak, jadi dilempar ke error.tsx.
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

/** Dua pola hari dianggap sama jika isinya sama, tanpa peduli urutan. */
function polaHariSama(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const urutA = [...a].sort((x, y) => x - y);
  const urutB = [...b].sort((x, y) => x - y);
  return urutA.every((hari, i) => hari === urutB[i]);
}

/**
 * Admin mengubah pola jadwal tetap satu pelanggan aktif: mencatat perubahan,
 * memperbarui pola di pengajuan, membatalkan kunjungan dijadwalkan sejak tanggal
 * berlaku, lalu membuat ulang kunjungan dari pola baru. Semua tulisan database
 * dilakukan dalam satu perintah SQL (CONTRIBUTING 6.2).
 * Hanya admin; gagal jika isian salah, pola sama, MOU tanpa jam, atau pengajuan
 * bukan lagi siap_bayar pada langganan aktif.
 */
export async function ubahPolaJadwal(
  _sebelumnya: HasilUbahPola | null,
  formData: FormData,
): Promise<HasilUbahPola> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8); teks yang diketik ikut dikembalikan.
  const nilai = nilaiIsian(formData);
  const hasil = skemaUbahPola.safeParse(nilai);
  if (!hasil.success) {
    return {
      ok: false,
      pesan: "Periksa kembali isian yang ditandai.",
      galat: z.flattenError(hasil.error).fieldErrors,
      nilai,
    };
  }
  const { idPengajuan, hariPengambilan, jamMulai, jamSelesai, berlakuMulai, alasan } =
    hasil.data;

  // 3. Baca pengajuan dan langganan. Hanya pelanggan aktif dengan pengajuan
  //    siap_bayar yang punya pola tetap; selain itu tidak ada yang bisa diubah.
  const [pengajuan] = await getDb()
    .select({
      idUser: pengajuanLangganan.idUser,
      jenisPelanggan: pengajuanLangganan.jenisPelanggan,
      hariPengambilan: pengajuanLangganan.hariPengambilan,
      jamMulai: pengajuanLangganan.jamMulai,
      jamSelesai: pengajuanLangganan.jamSelesai,
      tanggalAkhir: dataLangganan.tanggalAkhirLangganan,
    })
    .from(pengajuanLangganan)
    .innerJoin(
      dataLangganan,
      eq(dataLangganan.userId, pengajuanLangganan.idUser),
    )
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, idPengajuan),
        eq(pengajuanLangganan.status, "siap_bayar"),
        kondisiLanggananAktif(),
      ),
    )
    .limit(1);
  if (!pengajuan) {
    return {
      ok: false,
      pesan: "Pelanggan tidak ditemukan atau langganannya tidak aktif.",
      nilai,
    };
  }

  // 4. Syarat bisnis: MOU wajib punya rentang jam, dan perubahan yang tidak mengubah
  //    apa pun tidak dicatat supaya tracker tidak menampilkan notifikasi palsu.
  if (pengajuan.jenisPelanggan === "mou" && jamMulai === null) {
    return {
      ok: false,
      pesan: "Periksa kembali isian yang ditandai.",
      galat: { jamMulai: ["Pelanggan MOU wajib punya rentang jam."] },
      nilai,
    };
  }
  const polaSekarang = pengajuan.hariPengambilan ?? [];
  if (
    polaHariSama(polaSekarang, hariPengambilan) &&
    pengajuan.jamMulai === jamMulai &&
    pengajuan.jamSelesai === jamSelesai
  ) {
    return { ok: false, pesan: "Pola baru sama dengan pola yang sekarang.", nilai };
  }

  // 5. Hitung tanggal kunjungan baru dari pola baru mulai tanggal berlaku, memakai
  //    fungsi 2.2. Kunjungan hanya sampai tanggal akhir langganan (keputusan 2.2).
  const tanggalAkhir = pengajuan.tanggalAkhir;
  if (tanggalAkhir === null) {
    return {
      ok: false,
      pesan: "Pelanggan tidak punya tanggal akhir langganan.",
      nilai,
    };
  }
  const libur = await bacaPetaHariLibur(berlakuMulai);
  // Hasil geser hari libur boleh jatuh setelah tanggal selesai; sama seperti
  // buatKunjungan() (2.2), kunjungan setelah tanggal akhir langganan tidak dibuat.
  const daftarTanggal = tanggalKunjungan({
    hariPengambilan,
    mulai: berlakuMulai,
    selesai: tanggalAkhir,
    hariLibur: libur,
  }).filter((tanggal) => tanggal <= tanggalAkhir);

  // 6. Satu perintah SQL (CONTRIBUTING 6.2): ubah pengajuan, catat perubahan, batalkan
  //    kunjungan dijadwalkan yang tidak ada di pola baru, lalu buat ulang kunjungan.
  //    Tanggal pola baru dikecualikan dari pembatalan supaya baris yang sama tidak
  //    ditulis dua kali dalam satu perintah; pembuatan ulang memakai ON CONFLICT.
  const hariSql = sql`ARRAY[${sql.join(
    hariPengambilan.map((hari) => sql`${hari}::integer`),
    sql`, `,
  )}]::integer[]`;
  const daftarBaruSql =
    daftarTanggal.length === 0
      ? sql`SELECT NULL::date AS tanggal WHERE false`
      : sql`VALUES ${sql.join(
          daftarTanggal.map((tanggal) => sql`(${tanggal}::date)`),
          sql`, `,
        )}`;

  const hasilUbah = await getDb().execute<{
    jumlah_ubah: number;
    jumlah_catat: number;
    jumlah_batal: number;
    jumlah_buat: number;
  }>(sql`
    WITH daftar_baru AS (
      SELECT t.tanggal
      FROM (${daftarBaruSql}) AS t(tanggal)
      WHERE t.tanggal IS NOT NULL
    ),
    ubah AS (
      UPDATE pengajuan_langganan
      SET hari_pengambilan = ${hariSql},
          jam_mulai = ${jamMulai}::time,
          jam_selesai = ${jamSelesai}::time,
          diperbarui_pada = now()
      WHERE id_pengajuan = ${idPengajuan}
        AND status = 'siap_bayar'
        AND (jenis_pelanggan IS DISTINCT FROM 'mou'
             OR (${jamMulai}::time IS NOT NULL AND ${jamSelesai}::time IS NOT NULL))
      RETURNING id_pengajuan, id_user
    ),
    catat AS (
      INSERT INTO perubahan_jadwal
        (pengajuan_id, hari_pengambilan, jam_mulai, jam_selesai, berlaku_mulai, alasan, diubah_oleh)
      SELECT ubah.id_pengajuan, ${hariSql}, ${jamMulai}::time, ${jamSelesai}::time,
             ${berlakuMulai}::date, ${alasan}, ${cek.idUser}
      FROM ubah
      RETURNING id_perubahan
    ),
    batal AS (
      UPDATE kunjungan_pengambilan
      SET status = 'batal'
      WHERE pengajuan_id IN (SELECT id_pengajuan FROM ubah)
        AND status = 'dijadwalkan'
        AND tanggal >= ${berlakuMulai}::date
        AND pengganti_dari IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM daftar_baru d
          WHERE d.tanggal = kunjungan_pengambilan.tanggal
        )
      RETURNING id_kunjungan
    ),
    buat AS (
      INSERT INTO kunjungan_pengambilan
        (id_user, pengajuan_id, tanggal, jam_mulai, jam_selesai)
      SELECT ubah.id_user, ubah.id_pengajuan, daftar_baru.tanggal,
             ${jamMulai}::time, ${jamSelesai}::time
      FROM ubah
      CROSS JOIN daftar_baru
      ON CONFLICT (id_user, tanggal) DO UPDATE
        SET pengajuan_id = EXCLUDED.pengajuan_id,
            jam_mulai = EXCLUDED.jam_mulai,
            jam_selesai = EXCLUDED.jam_selesai,
            status = 'dijadwalkan'
        WHERE kunjungan_pengambilan.status IN ('batal', 'dijadwalkan')
          AND kunjungan_pengambilan.pengganti_dari IS NULL
      RETURNING id_kunjungan
    )
    SELECT
      (SELECT count(*) FROM ubah)::int AS jumlah_ubah,
      (SELECT count(*) FROM catat)::int AS jumlah_catat,
      (SELECT count(*) FROM batal)::int AS jumlah_batal,
      (SELECT count(*) FROM buat)::int AS jumlah_buat
  `);

  const [ringkasan] = hasilUbah.rows;
  // 7. Tidak ada baris berubah berarti status atau langganan sudah berubah di tab lain.
  if (!ringkasan || ringkasan.jumlah_ubah === 0) {
    return {
      ok: false,
      pesan: "Data pelanggan sudah berubah. Muat ulang halaman lalu coba lagi.",
      nilai,
    };
  }

  // 8. Segarkan halaman admin dan halaman yang menampilkan kunjungan/pola pelanggan.
  revalidatePath("/admin/jadwal-pelanggan");
  revalidatePath("/admin/kunjungan");
  revalidatePath("/admin/buat-kunjungan");
  revalidatePath("/tracker");
  return {
    ok: true,
    pesan: "Pola jadwal disimpan.",
    dibatalkan: ringkasan.jumlah_batal,
    dibuat: ringkasan.jumlah_buat,
  };
}
