import type { Session } from "next-auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireLogin } from "./require-login";

type HasilCekAdmin =
  | { ok: true; session: Session; idUser: number }
  | { ok: false; status: 401 | 403; pesan: string };

export async function requireAdmin(): Promise<HasilCekAdmin> {
  const cek = await requireLogin();

  if (!cek.ok) return cek;

  const isAdminOnSession = cek.session.user.peran === "admin";

  if (!isAdminOnSession)
    return { ok: false, status: 403, pesan: "Akses khusus admin." };

  const [adminOnDb] = await getDb()
    .select({ idUser: users.idUser })
    .from(users)
    .where(and(eq(users.peran, "admin"), eq(users.idUser, cek.idUser)))
    .limit(1);

  if (!adminOnDb)
    return { ok: false, status: 403, pesan: "Akses khusus admin." };

  return { ok: true, session: cek.session, idUser: cek.idUser };
}
