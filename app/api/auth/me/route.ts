import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        loggedIn: false,
        username: "Pengguna",
      },
      { status: 401 },
    );
  }

  if (session.user.isIdle) {
    return NextResponse.json(
      {
        loggedIn: false,
        username: "Pengguna",
        code: "SESSION_IDLE",
      },
      { status: 401 },
    );
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
