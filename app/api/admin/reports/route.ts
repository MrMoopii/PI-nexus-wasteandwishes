import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getDb } from "@/lib/db";
import { dataLangganan, jadwal, jadwalJanjian, riwayatPengambilan, users } from "@/lib/db/schema";

export async function GET() {
  const cek = await requireAdmin();
  if (!cek.ok) return NextResponse.json({ error: cek.pesan }, { status: cek.status });
  try {
    const rows = await getDb().select({
      idRiwayat: riwayatPengambilan.idRiwayat,
      idJadwal: jadwal.idJadwal,
      jenisJadwal: jadwal.jenisJadwal,
      hariPengambilan: jadwal.hariPengambilan,
      jamJadwal: jadwal.jamPengambilan,
      tanggalJanjian: jadwalJanjian.tanggalJanjian,
      namaPelanggan: users.namaPelanggan,
      email: users.email,
      tanggalPengambilan: riwayatPengambilan.tanggalPengambilan,
      bobotSampah: riwayatPengambilan.bobotSampah,
      fotoBuktiPengambilan: riwayatPengambilan.fotoBuktiPengambilan,
    })
      .from(riwayatPengambilan)
      .innerJoin(jadwal, eq(jadwal.idJadwal, riwayatPengambilan.jadwalId))
      .innerJoin(dataLangganan, eq(dataLangganan.idLangganan, jadwal.langgananId))
      .innerJoin(users, eq(users.idUser, dataLangganan.userId))
      .leftJoin(jadwalJanjian, eq(jadwalJanjian.jadwalId, jadwal.idJadwal))
      .orderBy(desc(riwayatPengambilan.tanggalPengambilan), desc(riwayatPengambilan.idRiwayat));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Gagal mengambil laporan:", error);
    return NextResponse.json({ error: "Laporan belum dapat dimuat." }, { status: 500 });
  }
}
