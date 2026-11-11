import { and, eq, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getDb } from "@/lib/db";
import { dataLangganan, jadwal, jadwalJanjian, jadwalRutin, users } from "@/lib/db/schema";

export async function GET(request: Request) {
  const cek = await requireAdmin();
  if (!cek.ok) return NextResponse.json({ error: cek.pesan }, { status: cek.status });
  const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
  if (search.length < 2) return NextResponse.json([]);

  try {
    const hariIni = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
    const hasil = await getDb().select({
      idJadwal: jadwal.idJadwal,
      jenisJadwal: jadwal.jenisJadwal,
      hariPengambilan: jadwal.hariPengambilan,
      jamPengambilan: jadwal.jamPengambilan,
      tanggalJanjian: jadwalJanjian.tanggalJanjian,
      tanggalMulai: jadwalRutin.tanggalMulai,
      tanggalSelesai: jadwalRutin.tanggalSelesai,
      idUser: users.idUser,
      namaPelanggan: users.namaPelanggan,
      email: users.email,
    })
      .from(users)
      .innerJoin(dataLangganan, eq(dataLangganan.userId, users.idUser))
      .innerJoin(jadwal, eq(jadwal.langgananId, dataLangganan.idLangganan))
      .leftJoin(jadwalJanjian, eq(jadwalJanjian.jadwalId, jadwal.idJadwal))
      .leftJoin(jadwalRutin, eq(jadwalRutin.jadwalId, jadwal.idJadwal))
      .where(and(
        eq(dataLangganan.statusLangganan, "aktif"),
        sql`${dataLangganan.tanggalAkhirLangganan} >= ${hariIni}::date`,
        ilike(users.namaPelanggan, `%${search.replace(/[%,_]/g, "\\$&")}%`),
      ));
    return NextResponse.json(hasil);
  } catch (error) {
    console.error("Gagal mencari jadwal pengguna aktif:", error);
    return NextResponse.json({ error: "Pencarian pengguna belum dapat dilakukan." }, { status: 500 });
  }
}
