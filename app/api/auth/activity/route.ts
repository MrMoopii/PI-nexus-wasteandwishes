import { auth, unstable_update } from "@/lib/auth";
import { NextResponse } from "next/server";
import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/session";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const activityTimestamp = session.user.lastActivityAt ?? 0;
  if (Date.now() - activityTimestamp >= SESSION_IDLE_TIMEOUT_MS) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const updatedSession = await unstable_update({
    user: { lastActivityAt: Date.now() },
  });
  if (!updatedSession?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
