import { db } from "@/lib/db";
import { jadwal, jadwalJanjian, jadwalRutin, riwayatPengambilan } from "@/lib/db/schema";
import { count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  // Ensure dynamic rendering
  const h = await headers();
  h.get("x-vercel-ip-city");
  try {
    const [totalJadwalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jadwal);
    const [rutinResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jadwalRutin);
    const [janjianResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jadwalJanjian);
    const [totalWasteResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${riwayatPengambilan.bobotSampah}), 0)` })
      .from(riwayatPengambilan);

    return NextResponse.json({
      totalJadwal: Number(totalJadwalResult.count) || 0,
      rutinCount: Number(rutinResult.count) || 0,
      janjianCount: Number(janjianResult.count) || 0,
      totalWaste: Number(totalWasteResult.total) || 0,
    });
  } catch (error) {
    console.error("Error fetching schedule stats:", error);
    return NextResponse.json({ error: "Failed to fetch schedule stats" }, { status: 500 });
  }
}