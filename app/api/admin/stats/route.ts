import { requireAdmin } from "@/lib/require-admin";
import { getDb } from "@/lib/db";
import {
  users,
  dataLangganan,
  events,
  riwayatPengambilan,
} from "@/lib/db/schema";
import { count, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { readdirSync } from "fs";
import { join } from "path";

export async function GET() {
  // Check apakah user adalah admin
  const cek = await requireAdmin();
  if (!cek.ok) {
    return NextResponse.json({ error: cek.pesan }, { status: cek.status });
  }

  // Ensure dynamic rendering
  const h = await headers();
  h.get("x-vercel-ip-city");
  try {
    const [totalUsers] = await getDb().select({ count: count() }).from(users);
    const [activeSubscriptions] = await getDb()
      .select({ count: count() })
      .from(dataLangganan)
      .where(eq(dataLangganan.statusLangganan, "aktif"));
    const [totalEvents] = await getDb().select({ count: count() }).from(events);

    // Get waste collected this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [wasteThisMonth] = await getDb()
      .select({
        total: sql<number>`COALESCE(SUM(${riwayatPengambilan.bobotSampah}), 0)`,
      })
      .from(riwayatPengambilan)
      .where(gte(riwayatPengambilan.tanggalPengambilan, firstDayOfMonth));

    // Count product images in public/img/produk
    let totalProducts = 0;
    try {
      const produkPath = join(process.cwd(), "public", "img", "produk");
      const files = readdirSync(produkPath);
      const imageExtensions = [".png", ".jpg", ".jpeg", ".webp"];
      totalProducts = files.filter((file) =>
        imageExtensions.some((ext) => file.toLowerCase().endsWith(ext)),
      ).length;
    } catch (error) {
      console.error("Error counting product files:", error);
      // totalProducts tetap 0 jika folder tidak ada atau tidak bisa dibaca
    }

    return NextResponse.json({
      totalUsers: Number(totalUsers.count) || 0,
      activeSubscriptions: Number(activeSubscriptions.count) || 0,
      totalEvents: Number(totalEvents.count) || 0,
      wasteThisMonth: Number(wasteThisMonth?.total || 0),
      totalProducts,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
