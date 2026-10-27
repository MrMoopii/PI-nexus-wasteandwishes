export function formatTanggal(tanggal: string): string {
  return new Date(`${tanggal}T00:00:00Z`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
