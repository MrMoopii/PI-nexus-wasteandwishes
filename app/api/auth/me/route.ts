import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/session";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ loggedIn: false, username: "Pengguna" });
  }

  const activityTimestamp = session.user.lastActivityAt ?? 0;
  const isIdle = Date.now() - activityTimestamp >= SESSION_IDLE_TIMEOUT_MS;

  if (isIdle) {
    return NextResponse.json({ loggedIn: false, username: "Pengguna" });
  }

  return NextResponse.json({
    loggedIn: true,
    username: session.user.name || "Pengguna",
    user: {
      name: session.user.name,
      email: session.user.email,
      peran: session.user.peran,
      lastActivityAt: session.user.lastActivityAt,
    },
  });
}
