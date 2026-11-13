import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getDb } from "@/lib/db";
import { riwayatPengambilan } from "@/lib/db/schema";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const cek = await requireAdmin();
  if (!cek.ok) return NextResponse.json({ error: cek.pesan }, { status: cek.status });
  const { id: idTeks } = await context.params;
  const id = Number(idTeks);
  if (!(Number.isInteger(id) && id > 0)) return NextResponse.json({ error: "ID laporan tidak valid." }, { status: 400 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.error("Form edit laporan tidak dapat dibaca:", error);
    return NextResponse.json({ error: "Data laporan tidak valid." }, { status: 400 });
  }
  const bobotTeks = form.get("bobotSampah");
  const tanggalTeks = form.get("tanggalPengambilan");
  const foto = form.get("fotoBuktiPengambilan");
  const bobot = typeof bobotTeks === "string" ? Number(bobotTeks) : NaN;
  if (!Number.isFinite(bobot) || bobot < 0 || typeof tanggalTeks !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(tanggalTeks)) {
    return NextResponse.json({ error: "Tanggal, jam, atau bobot tidak valid." }, { status: 400 });
  }
  if (foto !== null && (!(foto instanceof File) || !foto.type.startsWith("image/") || foto.size === 0 || foto.size > 5 * 1024 * 1024)) {
    return NextResponse.json({ error: "Foto harus berupa gambar maksimal 5 MB." }, { status: 400 });
  }
  const tanggalPengambilan = new Date(`${tanggalTeks}:00+07:00`);
  if (Number.isNaN(tanggalPengambilan.getTime())) return NextResponse.json({ error: "Tanggal dan jam tidak valid." }, { status: 400 });

  const values = {
    tanggalPengambilan,
    bobotSampah: String(bobot),
    ...(foto instanceof File ? { fotoBuktiPengambilan: `data:${foto.type};base64,${Buffer.from(await foto.arrayBuffer()).toString("base64")}` } : {}),
  };
  try {
    const [updated] = await getDb().update(riwayatPengambilan).set(values)
      .where(eq(riwayatPengambilan.idRiwayat, id))
      .returning({ id: riwayatPengambilan.idRiwayat });
    if (!updated) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gagal memperbarui laporan:", error);
    return NextResponse.json({ error: "Laporan belum dapat diperbarui." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const cek = await requireAdmin();
  if (!cek.ok) return NextResponse.json({ error: cek.pesan }, { status: cek.status });
  const { id: idTeks } = await context.params;
  const id = Number(idTeks);
  if (!(Number.isInteger(id) && id > 0)) return NextResponse.json({ error: "ID laporan tidak valid." }, { status: 400 });
  try {
    const [deleted] = await getDb().delete(riwayatPengambilan)
      .where(eq(riwayatPengambilan.idRiwayat, id))
      .returning({ id: riwayatPengambilan.idRiwayat });
    if (!deleted) return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gagal menghapus laporan:", error);
    return NextResponse.json({ error: "Laporan belum dapat dihapus." }, { status: 500 });
  }
}
