import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const MAX_PAGE_SIZE = 100;

/** Return a paginated user list for the admin user table. */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.peran !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const pageParam = Number(params.get("page") ?? "1");
  const pageSizeParam = Number(params.get("pageSize") ?? "10");
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize =
    Number.isInteger(pageSizeParam) && pageSizeParam > 0
      ? Math.min(pageSizeParam, MAX_PAGE_SIZE)
      : 10;
  const search = params.get("search")?.trim();
  const searchFilter = search
    ? or(
        ilike(users.username, `%${search}%`),
        ilike(users.namaPelanggan, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.nomorTelp, `%${search}%`),
      )
    : undefined;
  // Admin accounts may access this endpoint, but the table lists regular users only.
  const where = searchFilter
    ? and(eq(users.peran, "user"), searchFilter)
    : eq(users.peran, "user");

  try {
    const [items, [totalResult]] = await Promise.all([
      db
        .select({
          idUser: users.idUser,
          username: users.username,
          namaPelanggan: users.namaPelanggan,
          peran: users.peran,
          email: users.email,
          nomorTelp: users.nomorTelp,
          alamat: users.alamat,
          tanggalLahir: users.tanggalLahir,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(users.idUser)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ total: sql<number>`count(*)::int` }).from(users).where(where),
    ]);
    const total = totalResult?.total ?? 0;

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to list admin users:", error);
    return NextResponse.json(
      { message: "Gagal mengambil daftar pengguna" },
      { status: 500 },
    );
  }
}
