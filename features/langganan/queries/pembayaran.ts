import "server-only";

import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pengajuanLangganan } from "@/lib/db/schema";
import { requireLogin } from "@/lib/require-login";
import { statusAsal } from "../aturan";

/** Data yang dibutuhkan tombol bayar. hargaFinal sudah berupa number. */
export type PengajuanSiapBayar = { idPengajuan: number; hargaFinal: number };

/**
 * Pengajuan milik pelanggan yang login dan boleh dibayar (status siap_bayar), untuk
 * menampilkan tombol bayar. null jika tidak ada; belum login dialihkan ke halaman login.
 * Melempar error jika pengajuan siap_bayar tidak punya harga_final (data rusak).
 */
export async function getPengajuanSiapBayar(): Promise<PengajuanSiapBayar | null> {
  // 1. idUser dari sesi, bukan dari URL (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");

  // 2. Status yang boleh dibayar diambil dari aturan.ts, bukan ditulis ulang di sini.
  const [baris] = await getDb()
    .select({
      idPengajuan: pengajuanLangganan.idPengajuan,
      hargaFinal: pengajuanLangganan.hargaFinal,
    })
    .from(pengajuanLangganan)
    .where(
      and(
        eq(pengajuanLangganan.idUser, cek.idUser),
        inArray(pengajuanLangganan.status, statusAsal("bayar")),
      ),
    )
    .limit(1);

  // 3. harga_final diisi saat harga disepakati, jadi kosong di siap_bayar berarti data rusak.
  if (!baris) return null;
  if (baris.hargaFinal === null) {
    throw new Error(
      `Pengajuan ${baris.idPengajuan} berstatus siap_bayar tanpa harga_final.`,
    );
  }

  // Kolom numeric dikembalikan sebagai string (CONTRIBUTING 9.2).
  return {
    idPengajuan: baris.idPengajuan,
    hargaFinal: Number(baris.hargaFinal),
  };
}
