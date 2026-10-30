import { requireAdmin } from "@/lib/require-admin";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

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
    const recentUsers = await getDb()
      .select({
        id: users.idUser,
        namaPelanggan: users.namaPelanggan,
        email: users.email,
        peran: users.peran,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    return NextResponse.json(recentUsers);
  } catch (error) {
    console.error("Error fetching recent users:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent users" },
      { status: 500 },
    );
  }
}
