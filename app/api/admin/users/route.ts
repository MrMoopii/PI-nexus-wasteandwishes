import { getDb } from "@/lib/db";
import { users, dataLangganan } from "@/lib/db/schema";
import { asc, count, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  // Ensure dynamic rendering
  const h = await headers();
  h.get("x-vercel-ip-city");
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const page = Number(searchParams.get("page")) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    let whereCondition;

    if (search && role) {
      const searchLower = search.toLowerCase();
      whereCondition = sql`(${users.namaPelanggan} ILIKE ${`%${searchLower}%`} OR ${users.email} ILIKE ${`%${searchLower}%`}) AND ${users.peran} = ${role}`;
    } else if (search) {
      const searchLower = search.toLowerCase();
      whereCondition = sql`${users.namaPelanggan} ILIKE ${`%${searchLower}%`} OR ${users.email} ILIKE ${`%${searchLower}%`}`;
    } else if (role) {
      whereCondition = eq(users.peran, role);
    }

    const [totalResult] = await getDb()
      .select({ count: count() })
      .from(users)
      .where(whereCondition);

    const userList = await getDb()
      .select({
        id: users.idUser,
        namaPelanggan: users.namaPelanggan,
        username: users.username,
        email: users.email,
        peran: users.peran,
        nomorTelp: users.nomorTelp,
        alamat: users.alamat,
        tanggalLahir: users.tanggalLahir,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereCondition)
      .orderBy(asc(users.idUser))
      .limit(limit)
      .offset(offset);

    // Get subscription status for each user
    const usersWithSubscription = await Promise.all(
      userList.map(async (user) => {
        const [subscription] = await getDb()
          .select()
          .from(dataLangganan)
          .where(eq(dataLangganan.userId, user.id))
          .limit(1);
        return {
          ...user,
          statusLangganan:
            subscription?.statusLangganan || "tidak_berlangganan",
        };
      }),
    );

    return NextResponse.json({
      users: usersWithSubscription,
      total: Number(totalResult.count) || 0,
      totalPages: Math.ceil((Number(totalResult.count) || 0) / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
