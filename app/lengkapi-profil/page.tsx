import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import ProfilForm from "./profil-form";
import { isProfilLengkap } from "@/lib/validasi-profil";

export default function LengkapiProfilPage() {
  return (
    <Suspense>
      <ProfileGate />
    </Suspense>
  );
}

async function ProfileGate() {
  const session = await auth();
  const idUser = Number(session?.user?.idUser);

  if (!idUser) {
    redirect("/auth/login");
  }

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.idUser, idUser))
    .limit(1);

  if (!row) {
    redirect("/auth/login");
  }

  if (isProfilLengkap(row)) {
    redirect("/");
  }

  return <ProfilForm email={row.email} />;
}
