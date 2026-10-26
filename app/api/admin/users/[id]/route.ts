import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

async function authorizeAdmin() {
  const session = await auth();
  if (session?.user?.peran !== "admin") {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  return null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await authorizeAdmin();
  if (denied) return denied;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID pengguna tidak valid." }, { status: 400 });
  }

  try {
    const body: { nama?: string; username?: string; email?: string; peran?: string } = await request.json();
    const nama = body.nama?.trim();
    const username = body.username?.trim();
    const email = body.email?.trim();
    const peran = body.peran;

    if (!nama || !email || !["user", "admin"].includes(peran || "")) {
      return NextResponse.json({ error: "Nama, email, dan peran yang valid wajib diisi." }, { status: 400 });
    }

    await db.update(users).set({ namaPelanggan: nama, username: username || null, email, peran }).where(eq(users.idUser, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Gagal menyimpan perubahan. Pastikan email dan username belum digunakan." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await authorizeAdmin();
  if (denied) return denied;

  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID pengguna tidak valid." }, { status: 400 });
  }

  try {
    await db.delete(users).where(eq(users.idUser, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Pengguna tidak dapat dihapus karena masih memiliki data terkait." }, { status: 409 });
  }
}
