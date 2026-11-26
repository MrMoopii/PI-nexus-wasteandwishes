"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hariLibur, kunjunganPengambilan } from "@/lib/db/schema";
import { requireLogin } from "@/lib/require-login";
import { bolehMintaLewati } from "../jadwal";
import { isLanggananAktif } from "../queries/pelanggan";
import { isStatusKunjungan, LABEL_STATUS_KUNJUNGAN } from "../types";
import {
  skemaKendala,
  skemaLewati,
  type IsianKendala,
  type IsianLewati,
} from "../validasi/lapor-kendala";
import { teksIsian, type GalatIsian } from "../validasi/jadwal";

// Aksi pelanggan di /tracker (kode tugas 2.4): melaporkan kendala dan meminta satu
// pengambilan dilewati. Dipanggil lewat useActionState. Laporannya ditanggapi admin
// di 2.6, termasuk tanggal pengganti yang diusulkan.

/** Hasil aksi laporan: pesan sukses, atau pesan gagal beserta pesan per isian. */
export type HasilLaporan<K extends string> =
  | { ok: true; pesan: string }
  | { ok: false; pesan: string; galat?: GalatIsian<K> };

const TIDAK_AKTIF =
  "Laporan hanya untuk pelanggan dengan langganan aktif. Muat ulang halaman.";
const KUNJUNGAN_TIDAK_ADA = "Kunjungan tidak ditemukan. Muat ulang halaman.";
const PERIKSA_ISIAN = "Periksa kembali isian yang ditandai.";
const ISIAN_KENDALA: IsianKendala[] = ["kunjunganId", "pesan"];
const ISIAN_LEWATI: IsianLewati[] = [
  "kunjunganId",
  "alasan",
  "pengganti",
  "tanggalPengganti",
];

const k = kunjunganPengambilan;

/**
 * Pelanggan melaporkan kendala untuk satu kunjungan miliknya (hari ini, mendatang,
 * atau riwayat). Hanya pelanggan dengan langganan aktif; gagal jika isian salah
 * atau kunjungan bukan miliknya.
 */
export async function laporKendala(
  _sebelumnya: HasilLaporan<IsianKendala> | null,
  formData: FormData,
): Promise<HasilLaporan<IsianKendala>> {
  // 1. Cek sesi sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8).
  const hasil = skemaKendala.safeParse(teksIsian(formData, ISIAN_KENDALA));
  if (!hasil.success) {
    return {
      ok: false,
      pesan: PERIKSA_ISIAN,
      galat: z.flattenError(hasil.error).fieldErrors,
    };
  }
  const { kunjunganId, pesan } = hasil.data;

  // 3. Menyembunyikan form bukan pengaman, jadi langganan aktif dicek lagi (7.2 no. 9).
  if (!(await isLanggananAktif(cek.idUser))) {
    return { ok: false, pesan: TIDAK_AKTIF };
  }

  // 4. Satu perintah: laporan hanya tercatat jika kunjungan itu milik akun ini,
  //    jadi kunjungan akun lain sama dengan kunjungan yang tidak ada.
  const hasilSql = await getDb().execute(sql`
    INSERT INTO laporan_kendala (id_user, kunjungan_id, jenis, pesan)
    SELECT id_user, id_kunjungan, 'kendala', ${pesan}
    FROM kunjungan_pengambilan
    WHERE id_kunjungan = ${kunjunganId}
      AND id_user = ${cek.idUser}
    RETURNING id_laporan
  `);
  if (hasilSql.rows.length === 0) {
    return { ok: false, pesan: KUNJUNGAN_TIDAK_ADA };
  }

  // 5. Segarkan tracker supaya laporan muncul di daftar permintaan.
  revalidatePath("/tracker");
  return {
    ok: true,
    pesan: "Laporan terkirim. Tanggapan admin akan tampil di Permintaan saya.",
  };
}

/**
 * Pesan gagal untuk tanggal pengganti, atau null jika memenuhi usulan syarat 2.4:
 * setelah tanggal yang dilewati, bukan hari libur, dan belum ada kunjungan di tanggal
 * itu. Hari kerja sudah dicek skemaLewati.
 */
async function periksaTanggalPengganti(
  idUser: number,
  tanggalDilewati: string,
  tanggal: string,
): Promise<string | null> {
  // Teks "YYYY-MM-DD" dibandingkan langsung (CONTRIBUTING 9.2).
  if (tanggal <= tanggalDilewati) {
    return "Tanggal pengganti harus setelah tanggal yang dilewati.";
  }

  const db = getDb();
  const [[libur], [sudahAda]] = await Promise.all([
    db
      .select({ keterangan: hariLibur.keterangan })
      .from(hariLibur)
      .where(eq(hariLibur.tanggal, tanggal))
      .limit(1),
    // Semua status dihitung, karena unique (id_user, tanggal) berlaku untuk semua status.
    db
      .select({ idKunjungan: k.idKunjungan })
      .from(k)
      .where(and(eq(k.idUser, idUser), eq(k.tanggal, tanggal)))
      .limit(1),
  ]);
  if (libur) return `Tanggal itu hari libur (${libur.keterangan}).`;
  if (sudahAda) return "Anda sudah punya kunjungan di tanggal itu.";
  return null;
}

/**
 * Pelanggan meminta satu kunjungan miliknya dilewati, dengan alasan dan boleh
 * mengusulkan tanggal pengganti. Kunjungan langsung menjadi dilewati; tanggal
 * pengganti menunggu persetujuan admin (2.6). Hanya pelanggan dengan langganan
 * aktif; gagal jika isian salah, kunjungan bukan miliknya, statusnya bukan
 * dijadwalkan, atau batas H-1 pukul 17.00 WIB sudah lewat.
 */
export async function mintaLewati(
  _sebelumnya: HasilLaporan<IsianLewati> | null,
  formData: FormData,
): Promise<HasilLaporan<IsianLewati>> {
  // 1. Cek sesi sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8). Alasan wajib, juga untuk lewati tanpa pengganti.
  const hasil = skemaLewati.safeParse(teksIsian(formData, ISIAN_LEWATI));
  if (!hasil.success) {
    return {
      ok: false,
      pesan: PERIKSA_ISIAN,
      galat: z.flattenError(hasil.error).fieldErrors,
    };
  }
  const isian = hasil.data;
  const tanggalPengganti =
    isian.pengganti === "ya" ? isian.tanggalPengganti : null;

  // 3. Menyembunyikan form bukan pengaman, jadi langganan aktif dicek lagi (7.2 no. 9).
  if (!(await isLanggananAktif(cek.idUser))) {
    return { ok: false, pesan: TIDAK_AKTIF };
  }

  // 4. Baca kunjungan milik akun ini saja. Kunjungan akun lain dianggap tidak ada.
  const db = getDb();
  const [kunjungan] = await db
    .select({ tanggal: k.tanggal, status: k.status })
    .from(k)
    .where(and(eq(k.idKunjungan, isian.kunjunganId), eq(k.idUser, cek.idUser)))
    .limit(1);
  if (!kunjungan) return { ok: false, pesan: KUNJUNGAN_TIDAK_ADA };

  // 5. Hanya kunjungan dijadwalkan, dan hanya sebelum H-1 pukul 17.00 WIB. Batasnya
  //    dihitung bolehMintaLewati() (2.2), bukan ditulis ulang di sini.
  if (kunjungan.status !== "dijadwalkan") {
    const label = isStatusKunjungan(kunjungan.status)
      ? LABEL_STATUS_KUNJUNGAN[kunjungan.status].toLowerCase()
      : kunjungan.status;
    return {
      ok: false,
      pesan: `Kunjungan ini sudah berstatus ${label}, jadi tidak bisa dilewati.`,
    };
  }
  if (!bolehMintaLewati(kunjungan.tanggal, new Date())) {
    return {
      ok: false,
      pesan:
        "Batas meminta lewati untuk kunjungan ini sudah lewat (H-1 pukul 17.00 WIB).",
    };
  }

  // 6. Tanggal pengganti hanya usulan; admin yang menyetujui atau memilih tanggal lain (2.6).
  if (tanggalPengganti !== null) {
    const galat = await periksaTanggalPengganti(
      cek.idUser,
      kunjungan.tanggal,
      tanggalPengganti,
    );
    if (galat) {
      return {
        ok: false,
        pesan: PERIKSA_ISIAN,
        galat: { tanggalPengganti: [galat] },
      };
    }
  }

  // 7. Satu perintah (CONTRIBUTING 6.2): kunjungan menjadi dilewati hanya jika masih
  //    dijadwalkan di tanggal yang sama, lalu laporan lewati dicatat untuk admin.
  //    Tanpa baris kembali berarti kunjungan sudah diubah di tab lain atau oleh admin.
  const hasilSql = await db.execute(sql`
    WITH dilewati AS (
      UPDATE kunjungan_pengambilan
      SET status = 'dilewati'
      WHERE id_kunjungan = ${isian.kunjunganId}
        AND id_user = ${cek.idUser}
        AND status = 'dijadwalkan'
        AND tanggal = ${kunjungan.tanggal}
      RETURNING id_kunjungan, id_user
    )
    INSERT INTO laporan_kendala
      (id_user, kunjungan_id, jenis, pesan, tanggal_pengganti)
    SELECT id_user, id_kunjungan, 'lewati', ${isian.alasan}, ${tanggalPengganti}
    FROM dilewati
    RETURNING id_laporan
  `);
  if (hasilSql.rows.length === 0) {
    return {
      ok: false,
      pesan: "Status kunjungan sudah berubah. Muat ulang halaman.",
    };
  }

  // 8. Segarkan tracker: kunjungan tampil dilewati dan permintaan muncul di daftar.
  revalidatePath("/tracker");
  return {
    ok: true,
    pesan:
      tanggalPengganti === null
        ? "Kunjungan dilewati. Alasan Anda sudah diteruskan ke admin."
        : "Kunjungan dilewati. Tanggal pengganti menunggu persetujuan admin.",
  };
}
