import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { jadwal, jadwalJanjian, jadwalRutin, riwayatPengambilan } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const cek = await requireAdmin();
  if (!cek.ok) return NextResponse.json({ error: cek.pesan }, { status: cek.status });

  const { id: teksId } = await context.params;
  const id = Number(teksId);
  if (!(Number.isInteger(id) && id > 0)) return NextResponse.json({ error: "ID jadwal tidak valid." }, { status: 400 });
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Payload edit jadwal bukan JSON valid:", error);
    return NextResponse.json({ error: "Data jadwal tidak valid." }, { status: 400 });
  }
  if (!isRecord(body)) return NextResponse.json({ error: "Data jadwal tidak valid." }, { status: 400 });

  const [existing] = await getDb().select({ jenis: jadwal.jenisJadwal })
    .from(jadwal).where(eq(jadwal.idJadwal, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Jadwal tidak ditemukan." }, { status: 404 });

  const waktuValid = typeof body.jamPengambilan === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(body.jamPengambilan);
  if (!waktuValid) return NextResponse.json({ error: "Jam tidak valid." }, { status: 400 });
  const jamPengambilan = body.jamPengambilan;
  if (typeof jamPengambilan !== "string") return NextResponse.json({ error: "Jam tidak valid." }, { status: 400 });

  if (existing.jenis === "rutin") {
    const hari = body.hariPengambilan;
    if (typeof hari !== "string" || !["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].includes(hari)) {
      return NextResponse.json({ error: "Hari tidak valid." }, { status: 400 });
    }
    if (!/^(?:0[89]|1[0-4]):(?:00|15|30|45)$|^15:00$/.test(jamPengambilan)) {
      return NextResponse.json({ error: "Jam rutin harus pukul 08.00–15.00 dengan interval 15 menit." }, { status: 400 });
    }
    await getDb().update(jadwal).set({ hariPengambilan: hari, jamPengambilan: `${jamPengambilan}:00` }).where(eq(jadwal.idJadwal, id));
  } else if (existing.jenis === "janjian") {
    const tanggal = body.tanggalJanjian;
    const status = body.statusKonfirmasi;
    if (typeof tanggal !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || new Date(`${tanggal}T00:00:00Z`).toISOString().slice(0, 10) !== tanggal) {
      return NextResponse.json({ error: "Tanggal janjian tidak valid." }, { status: 400 });
    }
    if (typeof status !== "string" || !["menunggu", "dikonfirmasi", "ditolak"].includes(status)) {
      return NextResponse.json({ error: "Status konfirmasi tidak valid." }, { status: 400 });
    }
    await getDb().update(jadwal).set({ jamPengambilan: `${jamPengambilan}:00` }).where(eq(jadwal.idJadwal, id));
    await getDb().update(jadwalJanjian).set({ tanggalJanjian: tanggal, statusKonfirmasi: status }).where(eq(jadwalJanjian.jadwalId, id));
  } else {
    return NextResponse.json({ error: "Jenis jadwal tidak dikenal." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const cek = await requireAdmin();
  if (!cek.ok) return NextResponse.json({ error: cek.pesan }, { status: cek.status });

  const { id: teksId } = await context.params;
  const id = Number(teksId);
  if (!(Number.isInteger(id) && id > 0)) return NextResponse.json({ error: "ID jadwal tidak valid." }, { status: 400 });
  const [existing] = await getDb().select({ id: jadwal.idJadwal })
    .from(jadwal).where(eq(jadwal.idJadwal, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Jadwal tidak ditemukan." }, { status: 404 });
  const [history] = await getDb().select({ id: riwayatPengambilan.idRiwayat })
    .from(riwayatPengambilan).where(eq(riwayatPengambilan.jadwalId, id)).limit(1);
  if (history) return NextResponse.json({ error: "Jadwal tidak dapat dihapus karena sudah memiliki riwayat pengambilan." }, { status: 409 });

  await getDb().delete(jadwalJanjian).where(eq(jadwalJanjian.jadwalId, id));
  await getDb().delete(jadwalRutin).where(eq(jadwalRutin.jadwalId, id));
  await getDb().delete(jadwal).where(eq(jadwal.idJadwal, id));
  return NextResponse.json({ ok: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
