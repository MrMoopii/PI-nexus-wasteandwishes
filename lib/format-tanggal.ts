export function formatTanggal(tanggal: string): string {
  return new Date(`${tanggal}T00:00:00Z`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Nama bulan dan tahun dari nilai "YYYY-MM", misalnya "2026-11" menjadi
 * "November 2026" (judul laporan bulanan). Memakai UTC seperti formatTanggal(),
 * supaya bulan tidak bergeser karena zona waktu server.
 */
export function formatBulan(bulan: string): string {
  return new Date(`${bulan}-01T00:00:00Z`).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatJam(jam: string): string {
  return jam.slice(0, 5).replace(":", ".");
}

export function formatWaktu(
  waktuMulai: string | null,
  waktuSelesai: string | null,
): string {
  if (waktuMulai !== null && waktuSelesai !== null) {
    return `${formatJam(waktuMulai)} \u2013 ${formatJam(waktuSelesai)} WIB`;
  }

  if (waktuMulai !== null) {
    return `${formatJam(waktuMulai)} WIB \u2013 selesai`;
  }

  if (waktuSelesai !== null) {
    return `Selesai pukul ${formatJam(waktuSelesai)} WIB`;
  }

  return "Waktu acara menyusul";
}

/** Tanggal hari ini menurut zona waktu Asia/Jakarta, dalam format "YYYY-MM-DD"
 *  (sama dengan nilai kolom `date` dari Drizzle).
 * */
export function tanggalHariIniJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
}
