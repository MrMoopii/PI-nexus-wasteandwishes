"use server";

import { redirect } from "next/navigation";
import { requireLogin } from "@/lib/require-login";

/**
 * Server Action pembuatan jadwal janjian lama. Fitur jadwal janjian sudah
 * tidak dipakai, jadi setiap panggilan langsung ditolak dan dialihkan ke
 * /langganan (1.7). Gagal: tidak ada, semua input ditolak.
 */
export async function ajukanJadwalJanjian() {
  // 1. Cek sesi di baris pertama sesuai aturan wajib Server Action (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");

  // 2. Fitur sudah tidak dipakai, jadi panggilan apa pun dialihkan ke /langganan.
  redirect("/langganan");
}
