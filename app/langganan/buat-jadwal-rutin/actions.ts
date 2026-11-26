"use server";

import { redirect } from "next/navigation";
import { requireLogin } from "@/lib/require-login";

/**
 * Server Action pembuatan jadwal rutin lama. Pelanggan tidak lagi membuat
 * jadwal sendiri, jadi setiap panggilan langsung ditolak dan dialihkan ke
 * /langganan (1.7). Gagal: tidak ada, semua input ditolak.
 */
export async function simpanJadwalRutin() {
  // 1. Cek sesi di baris pertama sesuai aturan wajib Server Action (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");

  // 2. Halaman lama sudah tidak dipakai lagi, jadi panggilan apa pun dialihkan ke /langganan.
  redirect("/langganan");
}
