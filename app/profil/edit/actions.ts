"use server";

import { requireLogin } from "@/lib/require-login";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import {
  isProfilLengkap,
  validasiUsername,
  validasiNamaPelanggan,
  validasiNomorTelp,
  validasiAlamat,
  validasiTanggalLahir,
} from "@/lib/validasi-profil";

export async function updateProfil(props: {
  username: string;
  namaPelanggan: string;
  nomorTelp: string;
  alamat: string;
  tanggalLahir: string;
}) {
  const cek = await requireLogin();
  if (!cek.ok) return { error: cek.pesan };
  const idUser = cek.idUser;

  const username = props.username.trim();
  const namaPelanggan = props.namaPelanggan.trim();
  const nomorTelp = props.nomorTelp.trim().replace(/[\s-]/g, "");
  const alamat = props.alamat.trim();
  const tanggalLahir = props.tanggalLahir.trim();

  if (
    !isProfilLengkap({
      username,
      namaPelanggan,
      nomorTelp,
      alamat,
      tanggalLahir,
    })
  ) {
    return { error: "Semua kolom wajib diisi" };
  }

  const errUsername = validasiUsername(username);
  if (errUsername) return { error: errUsername };

  const errNamaPelanggan = validasiNamaPelanggan(namaPelanggan);
  if (errNamaPelanggan) return { error: errNamaPelanggan };

  const errNomorTelp = validasiNomorTelp(nomorTelp);
  if (errNomorTelp) return { error: errNomorTelp };

  const errAlamat = validasiAlamat(alamat);
  if (errAlamat) return { error: errAlamat };

  const errTanggalLahir = validasiTanggalLahir(tanggalLahir);
  if (errTanggalLahir) return { error: errTanggalLahir };

  try {
    const [checkUserTerpakai] = await getDb()
      .select()
      .from(users)
      .where(and(eq(users.username, username), ne(users.idUser, idUser)))
      .limit(1);

    if (checkUserTerpakai) {
      return { error: "Username sudah dipakai!" };
    }

    await getDb()
      .update(users)
      .set({
        username: username,
        namaPelanggan: namaPelanggan,
        nomorTelp: nomorTelp,
        alamat: alamat,
        tanggalLahir: tanggalLahir,
        updatedAt: new Date(),
      })
      .where(eq(users.idUser, idUser));

    return { success: true };
  } catch (error) {
    console.error("Update profil error:", error);
    return { error: "Terjadi kesalahan saat memperbarui profil" };
  }
}
