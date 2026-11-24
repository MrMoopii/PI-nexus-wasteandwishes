import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getImageKitAuthParams } from "@/lib/imagekit";

export async function GET() {
  const cek = await requireAdmin();
  if (!cek.ok) {
    return NextResponse.json({ error: cek.pesan }, { status: cek.status });
  }

  try {
    const authParams = getImageKitAuthParams();
    return NextResponse.json(authParams);
  } catch (err: unknown) {
    const pesan =
      err instanceof Error
        ? err.message
        : "Gagal membuat parameter autentikasi ImageKit.";
    return NextResponse.json({ error: pesan }, { status: 500 });
  }
}
