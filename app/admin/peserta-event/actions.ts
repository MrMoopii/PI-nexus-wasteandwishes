"use server";

import { requireAdmin } from "@/lib/require-admin";

// Server Action peserta event lama (issue #172, kode tugas 3.3).
// Semua aksi ditolak karena halaman peserta event sudah dialihkan ke
// /admin/events dan WW tidak lagi menerima pendaftaran event.

/**
 * Menolak setiap panggilan hapus peserta event.
 * Data pendaftaran lama tidak dihapus.
 */
export async function hapusPesertaEvent(_formData: FormData) {
  // 1. Cek admin sebelum menolak, supaya akun bukan admin juga ditolak (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { error: cek.pesan };

  // 2. Tolak aksi karena halaman sudah tidak digunakan.
  return {
    error:
      "Pendaftaran event tidak lagi tersedia. Kelola event di halaman Data Event.",
  };
}
