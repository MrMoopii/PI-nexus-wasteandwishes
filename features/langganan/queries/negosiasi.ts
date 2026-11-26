import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pengajuanLangganan, pesanNegosiasi } from "@/lib/db/schema";
import { requireLogin } from "@/lib/require-login";
import { isPengirimPesan, type PesanNegosiasiTampilan } from "../types";

/**
 * Riwayat pesan negosiasi untuk satu pengajuan milik pelanggan yang login,
 * dari yang terlama. null jika pengajuan tidak ada atau bukan milik akun ini.
 * Belum login mengembalikan null; pemanggil di halaman mengalihkan lebih dulu.
 */
export async function getRiwayatPesanNegosiasi(
  idPengajuan: number,
): Promise<PesanNegosiasiTampilan[] | null> {
  // 1. Cek sesi; idUser hanya dari sesi (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) return null;

  // 2. Pastikan pengajuan ini milik akun yang login (bagian 7.2 no. 9).
  const [pengajuan] = await getDb()
    .select({ idPengajuan: pengajuanLangganan.idPengajuan })
    .from(pengajuanLangganan)
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, idPengajuan),
        eq(pengajuanLangganan.idUser, cek.idUser),
      ),
    )
    .limit(1);

  if (!pengajuan) return null;

  // 3. Semua pesan pengajuan ini, urut dari yang terlama.
  const baris = await getDb()
    .select({
      idPesan: pesanNegosiasi.idPesan,
      pengirim: pesanNegosiasi.pengirim,
      hargaUsulan: pesanNegosiasi.hargaUsulan,
      pesan: pesanNegosiasi.pesan,
      dibuatPada: pesanNegosiasi.dibuatPada,
    })
    .from(pesanNegosiasi)
    .where(eq(pesanNegosiasi.pengajuanId, idPengajuan))
    .orderBy(pesanNegosiasi.idPesan);

  // 4. Sempitkan pengirim ke tipenya. Nilai asing berarti data rusak,
  //    jadi dilempar ke error.tsx, bukan ditebak (CONTRIBUTING 8 no. 4).
  return baris.map((b) => {
    if (!isPengirimPesan(b.pengirim)) {
      throw new Error(`Pengirim pesan tidak dikenal: ${b.pengirim}`);
    }
    return {
      idPesan: b.idPesan,
      pengirim: b.pengirim,
      hargaUsulan: b.hargaUsulan === null ? null : Number(b.hargaUsulan),
      pesan: b.pesan,
      dibuatPada: b.dibuatPada,
    };
  });
}
