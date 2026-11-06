import { requireAdmin } from "@/lib/require-admin";
import { getDb } from "@/lib/db";
import { users, dataLangganan } from "@/lib/db/schema";
import { asc, count, eq, and, or, ilike, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  // Check apakah user adalah admin
  const cek = await requireAdmin();
  if (!cek.ok) {
    return NextResponse.json({ error: cek.pesan }, { status: cek.status });
  }

  // Ensure dynamic rendering
  const h = await headers();
  h.get("x-vercel-ip-city");
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const teksPage = searchParams.get("page");
    let page = 1;
    if (teksPage) {
      page = Number(teksPage);
      if (!(Number.isInteger(page) && page > 0)) {
        return NextResponse.json(
          { error: "Nomor halaman tidak valid." },
          { status: 400 },
        );
      }
    }

    const limit = 10;
    const offset = (page - 1) * limit;

    const kondisi: (SQL | undefined)[] = [eq(users.peran, "user")];

    if (search) {
      kondisi.push(
        or(
          ilike(users.namaPelanggan, `%${search}%`),
          ilike(users.email, `%${search}%`),
        ),
      );
    }

    const kondisiWhere = and(...kondisi);

    const [totalResult] = await getDb()
      .select({ count: count() })
      .from(users)
      .leftJoin(dataLangganan, eq(dataLangganan.userId, users.idUser))
      .where(kondisiWhere);

    const userList = await getDb()
      .select({
        id: users.idUser,
        namaPelanggan: users.namaPelanggan,
        email: users.email,
        nomorTelp: users.nomorTelp,
        alamat: users.alamat,
        tanggalLahir: users.tanggalLahir,
        updatedAt: users.updatedAt,
        statusLangganan: dataLangganan.statusLangganan,
      })
      .from(users)
      .leftJoin(dataLangganan, eq(dataLangganan.userId, users.idUser))
      .where(kondisiWhere)
      .orderBy(asc(users.idUser))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      users: userList,
      total: Number(totalResult.count) || 0,
      totalPages: Math.ceil((Number(totalResult.count) || 0) / limit),
    });
  } catch (error) {
    console.error("Gagal memuat data pelanggan.", error);
    return NextResponse.json(
      { error: "Gagal memuat data pelanggan." },
      { status: 500 },
    );
  }
}
