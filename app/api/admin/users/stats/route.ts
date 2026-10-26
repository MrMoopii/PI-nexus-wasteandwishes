import { getDb } from "@/lib/db";
import { users, dataLangganan } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  // Ensure dynamic rendering
  const h = await headers();
  h.get("x-vercel-ip-city");
  try {
    const [totalResult] = await getDb().select({ count: count() }).from(users);
    const [adminResult] = await getDb()
      .select({ count: count() })
      .from(users)
      .where(eq(users.peran, "admin"));
    const [subscribedResult] = await getDb()
      .select({ count: count() })
      .from(dataLangganan)
      .where(eq(dataLangganan.statusLangganan, "aktif"));

    return NextResponse.json({
      total: Number(totalResult.count) || 0,
      adminCount: Number(adminResult.count) || 0,
      subscribedCount: Number(subscribedResult.count) || 0,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 },
    );
  }
}
