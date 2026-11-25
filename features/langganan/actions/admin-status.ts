"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pengajuanLangganan, pesanNegosiasi } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { AKSI_PENGAJUAN, statusAsal } from "../aturan";
import {
  skemaAktifkanPembayaran,
  skemaTerimaTawaran,
  skemaTolak,
} from "../validasi/admin";
import type { HasilAksiAdmin } from "./admin";

// Aksi admin yang hanya mengubah status pengajuan (kode tugas 1.5): terima tawaran,
// aktifkan pembayaran, dan tolak. Setiap perubahan ditulis dalam satu
// UPDATE … WHERE status IN (…) RETURNING (CONTRIBUTING 6.2).

/** Segarkan halaman admin dan halaman pelanggan yang menampilkan pengajuan ini. */
function segarkanHalaman(idPengajuan: number): void {
  revalidatePath(`/admin/langganan/${idPengajuan}`);
  revalidatePath("/admin/langganan");
  revalidatePath("/langganan");
}

/**
 * Admin menerima tawaran pelanggan: status negosiasi → disetujui_pelanggan, dan
 * harga_final = harga_usulan tawaran pelanggan terakhir (CONTRIBUTING 9.7).
 * Hanya admin; gagal jika tawaran yang tampil bukan lagi yang terakhir atau status berubah.
 */
export async function terimaTawaran(
  _sebelumnya: HasilAksiAdmin | null,
  formData: FormData,
): Promise<HasilAksiAdmin> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi ID pengajuan dan ID tawaran yang tampil di layar (CONTRIBUTING 9.8).
  const hasil = skemaTerimaTawaran.safeParse({
    idPengajuan: formData.get("idPengajuan"),
    idPesan: formData.get("idPesan"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
    };
  }
  const { idPengajuan, idPesan } = hasil.data;

  // 3. Tawaran terakhir pelanggan, dengan urutan yang sama seperti getPesanNegosiasi().
  const db = getDb();
  const tawaran = db
    .select({
      idPesan: pesanNegosiasi.idPesan,
      hargaUsulan: pesanNegosiasi.hargaUsulan,
    })
    .from(pesanNegosiasi)
    .where(
      and(
        eq(pesanNegosiasi.pengajuanId, idPengajuan),
        eq(pesanNegosiasi.pengirim, "pelanggan"),
        isNotNull(pesanNegosiasi.hargaUsulan),
      ),
    )
    .orderBy(desc(pesanNegosiasi.dibuatPada), desc(pesanNegosiasi.idPesan))
    .limit(1)
    .as("tawaran");

  // 4. Satu UPDATE: harga_final diambil dari tawaran itu, dan hanya berhasil jika
  //    tawaran yang tampil di layar masih yang terakhir.
  const [diterima] = await db
    .update(pengajuanLangganan)
    .set({
      status: AKSI_PENGAJUAN.terimaTawaran.ke,
      hargaFinal: sql`${tawaran.hargaUsulan}`,
      diperbaruiPada: sql`now()`,
    })
    .from(tawaran)
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, idPengajuan),
        inArray(pengajuanLangganan.status, statusAsal("terimaTawaran")),
        eq(tawaran.idPesan, idPesan),
      ),
    )
    .returning({ idPengajuan: pengajuanLangganan.idPengajuan });

  if (!diterima) {
    return {
      ok: false,
      pesan:
        "Tawaran tidak bisa diterima: ada tawaran baru dari pelanggan atau status pengajuan sudah berubah. Muat ulang halaman.",
    };
  }

  // 5. Segarkan halaman admin dan pelanggan.
  segarkanHalaman(idPengajuan);
  return { ok: true };
}

/**
 * Admin mengaktifkan pembayaran: disetujui_pelanggan → siap_bayar. Harga dan
 * syarat terkunci setelah ini. Hanya admin; gagal jika status berubah atau harga_final kosong.
 */
export async function aktifkanPembayaran(
  _sebelumnya: HasilAksiAdmin | null,
  formData: FormData,
): Promise<HasilAksiAdmin> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi ID pengajuan (CONTRIBUTING 9.8).
  const hasil = skemaAktifkanPembayaran.safeParse({
    idPengajuan: formData.get("idPengajuan"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
    };
  }

  // 3. Satu UPDATE bersyarat. harga_final wajib ada, karena tombol bayar
  //    menagih dari kolom itu (CONTRIBUTING 9.7).
  const [diaktifkan] = await getDb()
    .update(pengajuanLangganan)
    .set({
      status: AKSI_PENGAJUAN.aktifkanPembayaran.ke,
      diperbaruiPada: sql`now()`,
    })
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, hasil.data.idPengajuan),
        inArray(pengajuanLangganan.status, statusAsal("aktifkanPembayaran")),
        isNotNull(pengajuanLangganan.hargaFinal),
      ),
    )
    .returning({ idPengajuan: pengajuanLangganan.idPengajuan });

  if (!diaktifkan) {
    return {
      ok: false,
      pesan:
        "Pembayaran tidak bisa diaktifkan: status pengajuan sudah berubah atau harga final belum ada. Muat ulang halaman.",
    };
  }

  // 4. Segarkan halaman admin dan pelanggan (tombol bayar muncul di sana).
  segarkanHalaman(hasil.data.idPengajuan);
  return { ok: true };
}

/**
 * Admin menolak pengajuan sebelum siap_bayar; alasan wajib dan tampil ke pelanggan.
 * Hanya admin; gagal jika alasan kosong atau status sudah siap_bayar atau selesai.
 */
export async function tolakPengajuan(
  _sebelumnya: HasilAksiAdmin | null,
  formData: FormData,
): Promise<HasilAksiAdmin> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8); alasan yang diketik dikembalikan saat gagal.
  const alasan = formData.get("alasan");
  const teks = typeof alasan === "string" ? alasan : undefined;
  const hasil = skemaTolak.safeParse({
    idPengajuan: formData.get("idPengajuan"),
    alasan,
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
      teks,
    };
  }

  // 3. Satu UPDATE bersyarat: hanya status sebelum siap_bayar (aturan.ts).
  const [ditolak] = await getDb()
    .update(pengajuanLangganan)
    .set({
      status: AKSI_PENGAJUAN.tolakPengajuan.ke,
      alasanDitolak: hasil.data.alasan,
      diperbaruiPada: sql`now()`,
    })
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, hasil.data.idPengajuan),
        inArray(pengajuanLangganan.status, statusAsal("tolakPengajuan")),
      ),
    )
    .returning({ idPengajuan: pengajuanLangganan.idPengajuan });

  if (!ditolak) {
    return {
      ok: false,
      pesan:
        "Pengajuan tidak bisa ditolak karena statusnya sudah berubah. Muat ulang halaman.",
      teks,
    };
  }

  // 4. Segarkan halaman admin dan pelanggan (alasan tampil di halaman pelanggan).
  segarkanHalaman(hasil.data.idPengajuan);
  return { ok: true };
}
