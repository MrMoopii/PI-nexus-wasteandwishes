"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function register(formData: { name: string; email: string; password: string }) {
  const { name, email, password } = formData;

  try {
    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return { error: "Email sudah terdaftar" };
    }

    // Check if username already exists
    const [existingUsername] = await db
      .select()
      .from(users)
      .where(eq(users.name, name))
      .limit(1);

    if (existingUsername) {
      return { error: "Nama pengguna sudah digunakan" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new user
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: "user",
      subscriptionActive: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Register error:", error);
    return { error: "Terjadi kesalahan saat mendaftar" };
  }
}