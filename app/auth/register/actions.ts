"use server";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function register(formData: {
  username: string;
  namaPelanggan: string;
  email: string;
  password: string;
  nomorTelp: string;
  alamat: string;
  tanggalLahir: string;
}) {
  const {
    username: rawUsername,
    namaPelanggan: rawNamaPelanggan,
    email: rawEmail,
    password,
    nomorTelp: rawNomorTelp,
    alamat: rawAlamat,
    tanggalLahir,
  } = formData;

  const username = rawUsername.trim();
  const namaPelanggan = rawNamaPelanggan.trim();
  const email = rawEmail.trim().toLowerCase();
  const nomorTelp = rawNomorTelp.trim();
  const alamat = rawAlamat.trim();

  try {
    // Check if email already exists
    const [checkEmailTerpakai] = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (checkEmailTerpakai) {
      return { error: "Email sudah terdaftar" };
    }

    // Check if username already exists
    const [existingUsername] = await getDb()
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername) {
      return { error: "Username sudah dipakai!" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    await getDb().insert(users).values({
      username: username,
      namaPelanggan: namaPelanggan,
      peran: "user",
      password: hashedPassword,
      email: email,
      nomorTelp: nomorTelp,
      alamat: alamat,
      tanggalLahir: tanggalLahir,
    });

    return { success: true };
  } catch (error) {
    console.error("Register error:", error);
    return { error: "Terjadi kesalahan saat mendaftar" };
  }
}
