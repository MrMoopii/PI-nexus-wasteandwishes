import { db } from "@/lib/db";
import { users, dataLangganan, events, riwayatPengambilan } from "@/lib/db/schema";
import { count, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  // Ensure dynamic rendering
  const h = await headers();
  h.get("x-vercel-ip-city");
  try {
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [activeSubscriptions] = await db
      .select({ count: count() })
      .from(dataLangganan)
      .where(eq(dataLangganan.statusLangganan, "aktif"));
    const [totalEvents] = await db.select({ count: count() }).from(events);

    // Get waste collected this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [wasteThisMonth] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${riwayatPengambilan.bobotSampah}), 0)`,
      })
      .from(riwayatPengambilan)
      .where(gte(riwayatPengambilan.tanggalPengambilan, firstDayOfMonth));

    return NextResponse.json({
      totalUsers: Number(totalUsers.count) || 0,
      activeSubscriptions: Number(activeSubscriptions.count) || 0,
      totalEvents: Number(totalEvents.count) || 0,
      wasteThisMonth: Number(wasteThisMonth?.total || 0),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
