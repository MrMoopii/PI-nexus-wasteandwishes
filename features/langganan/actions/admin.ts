"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { pengajuanLangganan, pesanNegosiasi } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { AKSI_PENGAJUAN, statusAsal } from "../aturan";
import type { StatusPengajuan } from "../types";
import {
  skemaPenawaran,
  skemaPesanAdmin,
  type GalatIsianPenawaran,
  type NilaiIsianPenawaran,
} from "../validasi/admin";

// Aksi admin yang menulis pesan negosiasi (kode tugas 1.5): kirim penawaran dan
// kirim pesan. Aksi yang hanya mengubah status ada di actions/admin-status.ts.

/** Hasil aksi admin untuk useActionState; teks dikembalikan ke form saat gagal. */
export type HasilAksiAdmin =
  | { ok: true }
  | { ok: false; pesan: string; teks?: string };

/** Hasil kirimPenawaran(): pesan per isian dan isian yang diketik saat gagal. */
export type HasilKirimPenawaran =
  | { ok: true }
  | {
      ok: false;
      pesan: string;
      galat?: GalatIsianPenawaran;
      nilai?: NilaiIsianPenawaran;
    };

const STATUS_BERUBAH = "Status pengajuan sudah berubah. Muat ulang halaman.";

/** Segarkan halaman admin dan halaman pelanggan yang menampilkan pengajuan ini. */
function segarkanHalaman(idPengajuan: number): void {
  revalidatePath(`/admin/langganan/${idPengajuan}`);
  revalidatePath("/admin/langganan");
  revalidatePath("/langganan");
}

/** Teks isian penawaran apa adanya, hanya untuk dikembalikan ke form saat gagal. */
function nilaiPenawaran(formData: FormData): NilaiIsianPenawaran {
  const teks = (nama: string) => {
    const isian = formData.get(nama);
    return typeof isian === "string" ? isian : undefined;
  };
  return {
    idPengajuan: teks("idPengajuan"),
    harga: teks("harga"),
    jenisPelanggan: teks("jenisPelanggan"),
    hariPengambilan: formData
      .getAll("hariPengambilan")
      .filter((hari): hari is string => typeof hari === "string"),
    jamMulai: teks("jamMulai"),
    jamSelesai: teks("jamSelesai"),
    jumlahEmber: teks("jumlahEmber"),
    catatan: teks("catatan"),
  };
}

/**
 * Satu perintah SQL (CONTRIBUTING 6.2): ubah pengajuan hanya jika statusnya masih
 * termasuk statusAsal, lalu sisipkan pesan admin dari baris yang berubah itu.
 * Driver neon-http tidak punya transaksi, jadi keduanya harus dalam satu perintah.
 * false berarti tidak ada baris yang berubah: status sudah berubah atau ID salah.
 */
async function ubahLaluCatatPesan(isi: {
  idPengajuan: number;
  statusAsal: StatusPengajuan[];
  set: PgUpdateSetSource<typeof pengajuanLangganan>;
  idAdmin: number;
  hargaUsulan: number | null;
  pesan: string | null;
}): Promise<boolean> {
  const db = getDb();
  const diubah = db.$with("diubah").as(
    db
      .update(pengajuanLangganan)
      .set({ ...isi.set, diperbaruiPada: sql`now()` })
      .where(
        and(
          eq(pengajuanLangganan.idPengajuan, isi.idPengajuan),
          inArray(pengajuanLangganan.status, isi.statusAsal),
        ),
      )
      .returning({ idPengajuan: pengajuanLangganan.idPengajuan }),
  );

  // Nilai tetap diberi tipe eksplisit, karena di INSERT … SELECT Postgres
  // tidak menebak tipe parameter dari kolom tujuan.
  const hargaUsulan =
    isi.hargaUsulan === null ? null : String(isi.hargaUsulan);
  const [pesanBaru] = await db
    .with(diubah)
    .insert(pesanNegosiasi)
    .select((qb) =>
      qb
        .select({
          pengajuanId: diubah.idPengajuan,
          pengirim: sql<string>`'admin'::text`.as("pengirim"),
          idPengirim: sql<number>`${isi.idAdmin}::integer`.as("id_pengirim"),
          hargaUsulan: sql<string | null>`${hargaUsulan}::numeric`.as(
            "harga_usulan",
          ),
          pesan: sql<string | null>`${isi.pesan}::text`.as("pesan"),
        })
        .from(diubah),
    )
    .returning({ idPesan: pesanNegosiasi.idPesan });

  return pesanBaru !== undefined;
}

/**
 * Admin mengirim penawaran: syarat pengambilan disimpan di pengajuan, harga
 * menjadi pesan admin dengan harga_usulan. harga_final tidak diisi (CONTRIBUTING 9.7).
 * Hanya admin; gagal jika isian salah atau status bukan menunggu_review/negosiasi.
 */
export async function kirimPenawaran(
  _sebelumnya: HasilKirimPenawaran | null,
  formData: FormData,
): Promise<HasilKirimPenawaran> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8); teks yang diketik ikut dikembalikan.
  const nilai = nilaiPenawaran(formData);
  const hasil = skemaPenawaran.safeParse(nilai);
  if (!hasil.success) {
    return {
      ok: false,
      pesan: "Periksa kembali isian yang ditandai.",
      galat: z.flattenError(hasil.error).fieldErrors,
      nilai,
    };
  }
  const { idPengajuan, harga, catatan, ...syarat } = hasil.data;

  // 3. Ubah status dan syarat, lalu catat harga sebagai pesan admin, dalam satu perintah.
  const berhasil = await ubahLaluCatatPesan({
    idPengajuan,
    statusAsal: statusAsal("kirimPenawaran"),
    set: { ...syarat, status: AKSI_PENGAJUAN.kirimPenawaran.ke },
    idAdmin: cek.idUser,
    hargaUsulan: harga,
    pesan: catatan,
  });
  if (!berhasil) return { ok: false, pesan: STATUS_BERUBAH, nilai };

  // 4. Segarkan halaman admin dan pelanggan.
  segarkanHalaman(idPengajuan);
  return { ok: true };
}

/**
 * Admin mengirim pesan tanpa harga di riwayat negosiasi; status tidak berubah.
 * Hanya admin; gagal jika pesan kosong atau status tidak lagi menerima pesan.
 */
export async function kirimPesan(
  _sebelumnya: HasilAksiAdmin | null,
  formData: FormData,
): Promise<HasilAksiAdmin> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8).
  const teks = formData.get("pesan");
  const hasil = skemaPesanAdmin.safeParse({
    idPengajuan: formData.get("idPengajuan"),
    pesan: teks,
  });
  const teksAsli = typeof teks === "string" ? teks : undefined;
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
      teks: teksAsli,
    };
  }

  // 3. Status tetap; hanya diperbarui_pada yang ditulis, supaya pesan hanya masuk
  //    jika status pengajuan masih menerima pesan (aturan.ts kirimPesan).
  const berhasil = await ubahLaluCatatPesan({
    idPengajuan: hasil.data.idPengajuan,
    statusAsal: statusAsal("kirimPesan"),
    set: {},
    idAdmin: cek.idUser,
    hargaUsulan: null,
    pesan: hasil.data.pesan,
  });
  if (!berhasil) return { ok: false, pesan: STATUS_BERUBAH, teks: teksAsli };

  // 4. Segarkan halaman admin dan pelanggan.
  segarkanHalaman(hasil.data.idPengajuan);
  return { ok: true };
}
