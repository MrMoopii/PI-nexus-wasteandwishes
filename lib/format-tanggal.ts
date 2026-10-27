export function formatTanggal(tanggal: string): string {
  return new Date(`${tanggal}T00:00:00Z`).toLocaleDateString("id-ID", {
    day: "numeric",
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
