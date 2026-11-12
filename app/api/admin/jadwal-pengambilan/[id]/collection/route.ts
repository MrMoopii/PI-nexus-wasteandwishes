import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { dataLangganan, jadwal, jadwalJanjian, jadwalRutin, riwayatPengambilan } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const cek = await requireAdmin();
  if (!cek.ok) {
    return NextResponse.json({ error: cek.pesan }, { status: cek.status });
  }

  const { id: teksId } = await context.params;
  const idJadwal = Number(teksId);
  if (!(Number.isInteger(idJadwal) && idJadwal > 0)) {
    return NextResponse.json({ error: "ID jadwal tidak valid." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Form pencatatan pengambilan tidak dapat dibaca:", error);
    return NextResponse.json({ error: "Data pencatatan tidak valid." }, { status: 400 });
  }
  const bobotTeks = formData.get("bobotSampah");
  const foto = formData.get("fotoBuktiPengambilan");
  const tanggal = formData.get("tanggalPengambilan");
  const bobot = typeof bobotTeks === "string" ? Number(bobotTeks) : NaN;
  if (!Number.isFinite(bobot) || bobot < 0 || !(foto instanceof File) || !foto.type.startsWith("image/") || foto.size === 0 || foto.size > 5 * 1024 * 1024 || typeof tanggal !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(tanggal)) {
    return NextResponse.json({ error: "Berat atau foto bukti tidak valid." }, { status: 400 });
  }

  const [jadwalAktif] = await getDb()
    .select({ id: jadwal.idJadwal, jenis: jadwal.jenisJadwal, tanggalJanjian: jadwalJanjian.tanggalJanjian })
    .from(jadwal)
    .innerJoin(dataLangganan, eq(dataLangganan.idLangganan, jadwal.langgananId))
    .leftJoin(jadwalRutin, eq(jadwalRutin.jadwalId, jadwal.idJadwal))
    .leftJoin(jadwalJanjian, eq(jadwalJanjian.jadwalId, jadwal.idJadwal))
    .where(and(
      eq(jadwal.idJadwal, idJadwal),
      eq(dataLangganan.statusLangganan, "aktif"),
      sql`${dataLangganan.tanggalAkhirLangganan} >= (now() AT TIME ZONE 'Asia/Jakarta')::date`,
      sql`(${jadwal.jenisJadwal} = 'janjian' OR (${jadwalRutin.tanggalMulai} <= (now() AT TIME ZONE 'Asia/Jakarta')::date AND ${jadwalRutin.tanggalSelesai} >= (now() AT TIME ZONE 'Asia/Jakarta')::date))`,
    )).limit(1);
  if (!jadwalAktif) {
    return NextResponse.json({ error: "Jadwal aktif tidak ditemukan." }, { status: 404 });
  }

  const gambarData = `data:${foto.type};base64,${Buffer.from(await foto.arrayBuffer()).toString("base64")}`;
  const tanggalPengambilan = new Date(`${tanggal}:00+07:00`);
  if (Number.isNaN(tanggalPengambilan.getTime())) {
    return NextResponse.json({ error: "Tanggal dan jam pengambilan tidak valid." }, { status: 400 });
  }

  try {
    const [catatan] = await getDb().insert(riwayatPengambilan).values({
      jadwalId: idJadwal,
      tanggalPengambilan,
      bobotSampah: String(bobot),
      fotoBuktiPengambilan: gambarData,
    }).returning({ idRiwayat: riwayatPengambilan.idRiwayat });
    return NextResponse.json({ idRiwayat: catatan.idRiwayat }, { status: 201 });
  } catch (error) {
    console.error("Gagal mencatat pengambilan rutin:", error);
    return NextResponse.json({ error: "Pengambilan belum dapat dicatat." }, { status: 500 });
  }
}
