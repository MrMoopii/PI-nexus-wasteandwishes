"use server";

import { revalidatePath } from "next/cache";
import { NeonDbError } from "@neondatabase/serverless";
import {
  and,
  DrizzleQueryError,
  eq,
  isNotNull,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { laporanKendala } from "@/lib/db/schema";
import { formatTanggal, tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { requireAdmin } from "@/lib/require-admin";
import {
  bacaBentrokTanggal,
  bacaLaporanPengganti,
  type LaporanPengganti,
} from "../queries/kendala";
import { teksIsian, type GalatIsian } from "../validasi/jadwal";
import {
  skemaPutusanPengganti,
  skemaTanggapiLaporan,
  syaratTanggalPengganti,
  type IsianPutusanPengganti,
  type IsianTanggapiLaporan,
  type KeputusanPengganti,
} from "../validasi/tanggapi-kendala";

// Aksi admin di /admin/kendala (kode tugas 2.6), dipanggil lewat useActionState.
// Setiap tanggapan mengubah laporan menjadi 'ditanggapi' hanya jika masih 'menunggu'
// (CONTRIBUTING 6.2), jadi laporan yang sudah ditanggapi di tab lain tidak ditimpa.
// tanggapan_admin tampil apa adanya di tracker pelanggan (dibaca 2.4).

/** Hasil aksi tanggapan: pesan sukses, atau pesan gagal beserta pesan per isian. */
export type HasilTanggapan<K extends string> =
  | { ok: true; pesan: string }
  | { ok: false; pesan: string; galat?: GalatIsian<K> };

type HasilPutusan = HasilTanggapan<IsianPutusanPengganti>;

const PERIKSA_ISIAN = "Periksa kembali isian yang ditandai.";
const SUDAH_DITANGGAPI =
  "Laporan ini sudah ditanggapi atau tidak ditemukan. Muat ulang halaman.";
const SUDAH_ADA_KUNJUNGAN =
  "Pelanggan sudah punya kunjungan di tanggal itu. Pilih tanggal lain.";
const DATA_BERUBAH =
  "Laporan atau tanggal pengganti sudah berubah. Muat ulang halaman lalu coba lagi.";
const ISIAN_TANGGAPAN: IsianTanggapiLaporan[] = ["idLaporan", "tanggapan"];
const ISIAN_PUTUSAN: IsianPutusanPengganti[] = [
  "idLaporan",
  "keputusan",
  "tanggalPengganti",
  "tanggapan",
];

/**
 * Menutup satu laporan yang masih menunggu dengan tanggapan, tanpa kunjungan baru.
 * `syaratUsulan` memilih laporan tanpa usulan tanggal (kendala dan lewati saja) atau
 * dengan usulan (ditolak). False jika laporan sudah ditanggapi, tidak ada, atau tidak cocok.
 */
async function tutupLaporan(
  idLaporan: number,
  tanggapan: string,
  syaratUsulan: SQL,
): Promise<boolean> {
  const [diubah] = await getDb()
    .update(laporanKendala)
    .set({ status: "ditanggapi", tanggapanAdmin: tanggapan })
    .where(
      and(
        eq(laporanKendala.idLaporan, idLaporan),
        eq(laporanKendala.status, "menunggu"),
        syaratUsulan,
      ),
    )
    .returning({ idLaporan: laporanKendala.idLaporan });
  return diubah !== undefined;
}

/**
 * Admin menanggapi laporan kendala, atau lewati tanpa tanggal pengganti yang sudah
 * berlaku. Tanggapan wajib. Hanya admin; gagal jika isian salah, atau laporan sudah
 * ditanggapi, tidak ada, atau membawa usulan tanggal (itu lewat putuskanPengganti()).
 */
export async function tanggapiLaporan(
  _sebelumnya: HasilTanggapan<IsianTanggapiLaporan> | null,
  formData: FormData,
): Promise<HasilTanggapan<IsianTanggapiLaporan>> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8). ID ada di hidden input, jadi pesannya
  //    dijadikan pesan utama.
  const hasil = skemaTanggapiLaporan.safeParse(
    teksIsian(formData, ISIAN_TANGGAPAN),
  );
  if (!hasil.success) {
    const galat = z.flattenError(hasil.error).fieldErrors;
    return { ok: false, pesan: galat.idLaporan?.[0] ?? PERIKSA_ISIAN, galat };
  }
  const { idLaporan, tanggapan } = hasil.data;

  // 3. Satu UPDATE bersyarat. Kendala tidak pernah punya tanggal pengganti (CHECK di
  //    skema), jadi syarat tanggal kosong mencakup kendala dan lewati tanpa usulan.
  const ditutup = await tutupLaporan(
    idLaporan,
    tanggapan,
    isNull(laporanKendala.tanggalPengganti),
  );
  if (!ditutup) return { ok: false, pesan: SUDAH_DITANGGAPI };

  // 4. Segarkan halaman supaya laporan pindah ke Terakhir ditanggapi.
  revalidatePath("/admin/kendala");
  return { ok: true, pesan: "Tanggapan terkirim ke pelanggan." };
}

/** Pesan gagal tanggal: di bawah isian tanggal jika admin memilih tanggalnya sendiri. */
function gagalTanggal(
  keputusan: KeputusanPengganti,
  pesan: string,
): HasilPutusan {
  if (keputusan === "tanggal_lain") {
    return {
      ok: false,
      pesan: PERIKSA_ISIAN,
      galat: { tanggalPengganti: [pesan] },
    };
  }
  return { ok: false, pesan };
}

/**
 * Pesan gagal untuk tanggal pengganti, atau null jika memenuhi semua syarat 2.6:
 * syarat tanpa database (validasi/tanggapi-kendala.ts), bukan hari libur, dan belum
 * ada kunjungan pelanggan di tanggal itu.
 */
async function periksaTanggal(
  laporan: LaporanPengganti,
  tanggal: string,
): Promise<string | null> {
  const syarat = syaratTanggalPengganti({
    tanggal,
    tanggalDilewati: laporan.tanggalDilewati,
    hariIni: tanggalHariIniJakarta(),
    akhirLanggananAktif: laporan.akhirLanggananAktif,
  });
  if (syarat !== null) return syarat;

  const bentrok = await bacaBentrokTanggal(laporan.idUser, tanggal);
  if (bentrok.libur !== null) return `Tanggal itu hari libur (${bentrok.libur}).`;
  if (bentrok.adaKunjungan) return SUDAH_ADA_KUNJUNGAN;
  return null;
}

/** Unique (id_user, tanggal) menolak kunjungan pengganti karena tanggalnya baru terisi. */
function isTanggalBentrok(galat: unknown): boolean {
  return (
    galat instanceof DrizzleQueryError &&
    galat.cause instanceof NeonDbError &&
    galat.cause.code === "23505" &&
    galat.cause.constraint === "kunjungan_pengambilan_user_tanggal_unique"
  );
}

/**
 * Satu perintah (CONTRIBUTING 6.2, neon-http tanpa transaksi): laporan ditanggapi, lalu
 * kunjungan pengganti dibuat dengan pengganti_dari = kunjungan yang dilewati dan jam yang
 * sama (keputusan 2.6). UPDATE di depan, jadi persetujuan kedua yang bersamaan tidak cocok
 * lagi dengan status 'menunggu'. INSERT tanpa ON CONFLICT, jadi kunjungan lain yang masuk
 * di tanggal itu tepat bersamaan menggagalkan seluruh perintah, termasuk UPDATE-nya.
 */
async function simpanPengganti(
  idLaporan: number,
  tanggal: string,
  tanggapan: string,
): Promise<"dibuat" | "berubah" | "bentrok"> {
  try {
    const hasilSql = await getDb().execute(sql`
      WITH lap AS (
        UPDATE laporan_kendala AS l
        SET status = 'ditanggapi', tanggapan_admin = ${tanggapan}
        FROM kunjungan_pengambilan AS asal
        WHERE l.id_laporan = ${idLaporan}
          AND l.status = 'menunggu'
          AND l.jenis = 'lewati'
          AND l.tanggal_pengganti IS NOT NULL
          AND asal.id_kunjungan = l.kunjungan_id
          AND asal.status = 'dilewati'
          AND NOT EXISTS (SELECT 1 FROM kunjungan_pengambilan AS p
                          WHERE p.pengganti_dari = asal.id_kunjungan)
          AND NOT EXISTS (SELECT 1 FROM kunjungan_pengambilan AS k
                          WHERE k.id_user = asal.id_user AND k.tanggal = ${tanggal}::date)
          AND NOT EXISTS (SELECT 1 FROM hari_libur AS h WHERE h.tanggal = ${tanggal}::date)
        RETURNING asal.id_kunjungan, asal.id_user, asal.pengajuan_id,
                  asal.jam_mulai, asal.jam_selesai
      )
      INSERT INTO kunjungan_pengambilan
        (id_user, pengajuan_id, tanggal, jam_mulai, jam_selesai, pengganti_dari)
      SELECT id_user, pengajuan_id, ${tanggal}::date, jam_mulai, jam_selesai, id_kunjungan
      FROM lap
      RETURNING id_kunjungan
    `);
    return hasilSql.rows.length === 0 ? "berubah" : "dibuat";
  } catch (galat) {
    // Hanya bentrok tanggal yang diubah menjadi pesan; error lain naik ke error.tsx.
    if (isTanggalBentrok(galat)) return "bentrok";
    throw galat;
  }
}

/**
 * Admin memutuskan permintaan lewati yang membawa usulan tanggal: setujui usulan,
 * pilih tanggal lain, atau tolak, selalu dengan tanggapan. Setujui dan tanggal lain
 * membuat tepat satu kunjungan pengganti; tolak tidak, dan kunjungan asal tetap
 * dilewati. Hanya admin; gagal jika isian salah, laporan sudah ditanggapi, atau
 * tanggalnya tidak memenuhi syarat (libur, bentrok, sudah lewat, di luar masa langganan).
 */
export async function putuskanPengganti(
  _sebelumnya: HasilPutusan | null,
  formData: FormData,
): Promise<HasilPutusan> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8). Tanggapan wajib untuk semua keputusan.
  //    ID ada di hidden input, jadi pesannya dijadikan pesan utama.
  const hasil = skemaPutusanPengganti.safeParse(
    teksIsian(formData, ISIAN_PUTUSAN),
  );
  if (!hasil.success) {
    const galat = z.flattenError(hasil.error).fieldErrors;
    return { ok: false, pesan: galat.idLaporan?.[0] ?? PERIKSA_ISIAN, galat };
  }
  const isian = hasil.data;

  // 3. Tolak: satu UPDATE bersyarat tanpa kunjungan baru. Hanya laporan dengan usulan
  //    tanggal, yang pasti berjenis lewati (CHECK di skema).
  if (isian.keputusan === "tolak") {
    const ditutup = await tutupLaporan(
      isian.idLaporan,
      isian.tanggapan,
      isNotNull(laporanKendala.tanggalPengganti),
    );
    if (!ditutup) return { ok: false, pesan: SUDAH_DITANGGAPI };
    revalidatePath("/admin/kendala");
    return {
      ok: true,
      pesan: "Tanggal pengganti ditolak. Tanggapan terkirim ke pelanggan.",
    };
  }

  // 4. Baca laporan: harus lewati dengan usulan yang masih menunggu.
  const laporan = await bacaLaporanPengganti(isian.idLaporan);
  if (!laporan) return { ok: false, pesan: SUDAH_DITANGGAPI };

  // 5. Tanggal: usulan pelanggan dari database (bukan dari form), atau pilihan admin.
  const tanggal =
    isian.keputusan === "setujui"
      ? laporan.tanggalUsulan
      : isian.tanggalPengganti;
  const galat = await periksaTanggal(laporan, tanggal);
  if (galat !== null) return gagalTanggal(isian.keputusan, galat);

  // 6. Laporan dan kunjungan pengganti ditulis dalam satu perintah.
  const simpan = await simpanPengganti(isian.idLaporan, tanggal, isian.tanggapan);
  if (simpan === "bentrok") {
    return gagalTanggal(isian.keputusan, SUDAH_ADA_KUNJUNGAN);
  }
  if (simpan === "berubah") return { ok: false, pesan: DATA_BERUBAH };

  // 7. Laporan pindah ke riwayat, dan kunjungan baru tampil di halaman pencatatan.
  revalidatePath("/admin/kendala");
  revalidatePath("/admin/kunjungan");
  return {
    ok: true,
    pesan: `Kunjungan pengganti ${formatTanggal(tanggal)} dibuat. Tanggapan terkirim ke pelanggan.`,
  };
}
