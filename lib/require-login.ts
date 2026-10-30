import { Session } from "next-auth";
import { auth } from "./auth";

type HasilCekLogin =
  | { ok: true; session: Session; idUser: number }
  | { ok: false; status: 401; pesan: string };

export async function requireLogin(): Promise<HasilCekLogin> {
  const session = await auth();

  if (!session?.user) {
    return { ok: false, status: 401, pesan: "Silakan login terlebih dahulu." };
  }

  if (session.user.isIdle) {
    return {
      ok: false,
      status: 401,
      pesan: "Sesi Anda telah berakhir. Silakan untuk login ulang.",
    };
  }

  const idUser = Number(session?.user?.idUser);
  if (!(Number.isInteger(idUser) && idUser > 0)) {
    return { ok: false, status: 401, pesan: "Silakan login terlebih dahulu." };
  }

  return { ok: true, session: session, idUser: idUser };
}
