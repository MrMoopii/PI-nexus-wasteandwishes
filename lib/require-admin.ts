import type { Session } from "next-auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "./auth";

type HasilCekAdmin =
  | { ok: true; session: Session }
  | { ok: false; status: 401 | 403 };

export async function requireAdmin(): Promise<HasilCekAdmin> {
  const session = await auth();

  if (!session?.user) return { ok: false, status: 401 };

  const idUser = Number(session?.user?.idUser);
  if (!Number.isInteger(idUser)) return { ok: false, status: 401 };

  const isAdminOnSession = session.user.peran === "admin";

  if (!isAdminOnSession) return { ok: false, status: 403 };

  const [adminOnDb] = await getDb()
    .select({ idUser: users.idUser })
    .from(users)
    .where(and(eq(users.peran, "admin"), eq(users.idUser, idUser)))
    .limit(1);

  if (!adminOnDb) return { ok: false, status: 403 };

  return { ok: true, session: session };
}
