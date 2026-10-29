import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import EditProfilForm from "./edit-profil-form";

export default function EditProfilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8">Memuat...</div>}>
      <EditProfilContent />
    </Suspense>
  );
}

async function EditProfilContent() {
  const session = await auth();
  const idUser = Number(session?.user?.idUser);

  if (!idUser) {
    redirect("/auth/login");
  }

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.idUser, idUser))
    .limit(1);

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <EditProfilForm
      email={user.email}
      username={user.username || ""}
      namaPelanggan={user.namaPelanggan || ""}
      nomorTelp={user.nomorTelp || ""}
      alamat={user.alamat || ""}
      tanggalLahir={user.tanggalLahir || ""}
    />
  );
}
