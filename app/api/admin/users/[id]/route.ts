import { requireAdmin } from "@/lib/require-admin";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  // Check apakah user adalah admin
  const cek = await requireAdmin();
  if (!cek.ok) {
    return NextResponse.json({ error: cek.pesan }, { status: cek.status });
  }

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "ID pengguna tidak valid." },
      { status: 400 },
    );
  }

  try {
    const body: {
      namaPelanggan?: string;
      username?: string;
      email?: string;
      peran?: string;
    } = await request.json();
    const namaPelanggan = body.namaPelanggan?.trim();
    const username = body.username?.trim();
    const email = body.email?.trim();
    const peran = body.peran;

    if (!namaPelanggan || !email || !["user", "admin"].includes(peran || "")) {
      return NextResponse.json(
        { error: "Nama, email, dan peran yang valid wajib diisi." },
        { status: 400 },
      );
    }

    await getDb()
      .update(users)
      .set({
        namaPelanggan: namaPelanggan,
        username: username || null,
        email,
        peran,
      })
      .where(eq(users.idUser, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        error:
          "Gagal menyimpan perubahan. Pastikan email dan username belum digunakan.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  // Check apakah user adalah admin
  const cek = await requireAdmin();
  if (!cek.ok) {
    return NextResponse.json({ error: cek.pesan }, { status: cek.status });
  }

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "ID pengguna tidak valid." },
      { status: 400 },
    );
  }

  try {
    await getDb().delete(users).where(eq(users.idUser, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        error:
          "Pengguna tidak dapat dihapus karena masih memiliki data terkait.",
      },
      { status: 409 },
    );
  }
}
