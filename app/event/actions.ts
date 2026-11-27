"use server";

import { redirect } from "next/navigation";
import { requireLogin } from "@/lib/require-login";

/**
 * Server Action pendaftaran event alur lama.
 * Menolak setiap panggilan karena WW tidak lagi menerima pendaftaran (issue #171, tugas 3.2).
 */
export async function registerForEvent(_input: { eventId: number | string }) {
  // 1. Cek sesi login (CONTRIBUTING 7.2 no. 1).
  const cek = await requireLogin();
  if (!cek.ok) {
    return {
      ok: false,
      error: cek.pesan,
    };
  }

  // 2. Tolak pendaftaran event: WW tidak lagi menerima pendaftaran.
  return {
    ok: false,
    error: "Pendaftaran event tidak lagi tersedia. Event Waste & Wishes hanya bersifat informasi.",
  };
}

/**
 * Server Action pembayaran event alur lama.
 * Menolak setiap panggilan dan mengalihkan ke /event (issue #171, tugas 3.2).
 */
export async function mulaiPembayaranEvent(_formData: FormData) {
  // 1. Cek sesi login (CONTRIBUTING 7.2 no. 1).
  const cek = await requireLogin();
  if (!cek.ok) {
    redirect("/auth/login");
  }

  // 2. Alihkan ke halaman daftar event publik.
  redirect("/event");
}

/**
 * Pengecekan status pembayaran event lama.
 * Selalu mengembalikan status "gagal" untuk panggilan baru (issue #171, tugas 3.2).
 */
export async function cekStatusPembayaranEvent(
  _input: { eventId: number; orderId: string },
): Promise<
  | { status: "menunggu" }
  | { status: "berhasil"; idPendaftaran: number }
  | { status: "berhasil_tanpa_kuota" }
  | { status: "gagal" }
> {
  const cek = await requireLogin();
  if (!cek.ok) return { status: "gagal" };

  return { status: "gagal" };
}

/**
 * Server Action konfirmasi registrasi event lama.
 * Menolak dan mengalihkan ke /event (issue #171, tugas 3.2).
 */
export async function confirmEventRegistration(_formData: FormData) {
  const cek = await requireLogin();
  if (!cek.ok) {
    redirect("/auth/login");
  }

  redirect("/event");
}

/**
 * Mengambil bukti pendaftaran event alur lama.
 * Menolak setiap panggilan baru (issue #171, tugas 3.2).
 */
export async function getRegistrationProof(_idPendaftaran: number | string) {
  const cek = await requireLogin();
  if (!cek.ok) {
    return {
      ok: false,
      error: cek.pesan,
    };
  }

  return {
    ok: false,
    error: "Pendaftaran event tidak lagi tersedia.",
  };
}
