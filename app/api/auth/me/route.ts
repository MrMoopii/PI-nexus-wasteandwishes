import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/session";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const activityTimestamp = session.user.lastActivityAt ?? 0;
  if (Date.now() - activityTimestamp >= SESSION_IDLE_TIMEOUT_MS) {
    return NextResponse.json(
      { error: "Session expired", code: "SESSION_IDLE" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    user: {
      name: session.user.name,
      email: session.user.email,
      peran: session.user.peran,
      lastActivityAt: session.user.lastActivityAt,
    }
  });
}
