import type { EventTampilan } from "./types";

// Aturan status event: fungsi murni tanpa database dan tanpa sesi.
// Dipakai daftar admin (3.3) untuk menyegarkan status event yang sudah lewat,
// dan Server Action admin untuk menentukan status akhir saat event disimpan.

/** Status event yang bisa dipilih admin. */
export type StatusEvent = "draft" | "aktif" | "lalu";

/**
 * Titik waktu event berakhir pada hari|longgar yang sama.
 * Kalau waktu selesai tidak diisi, event dianggap berakhir sampai akhir hari.
 */
function waktuSelesaiEvent(
  tanggalPelaksanaan: string,
  waktuSelesai: string | null,
): Date {
  const eventDate = new Date(tanggalPelaksanaan);
  if (waktuSelesai) {
    const [hours, minutes] = waktuSelesai.split(":");
    eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
  } else {
    eventDate.setHours(23, 59, 59, 999);
  }
  return eventDate;
}

/**
 * Status akhir event setelah memperhitungkan waktu sekarang.
 * Event yang waktunya sudah lewat menjadi "lalu", apa pun pilihan admin.
 */
export function statusAkhirEvent(
  statusInput: string,
  tanggalPelaksanaan: string,
  waktuSelesai: string | null,
): StatusEvent {
  if (waktuSelesaiEvent(tanggalPelaksanaan, waktuSelesai) < new Date()) {
    return "lalu";
  }
  if (statusInput === "draft" || statusInput === "aktif" || statusInput === "lalu") {
    return statusInput;
  }
  return "draft";
}

/**
 * Event yang statusnya harus disegarkan karena waktu sudah lewat:
 * yang aktif jadi "lalu", dan yang draft yang waktunya sudahLewat juga jadi "lalu".
 * Event draft yang waktunya sudah tiba tapi belum selesai jadi "aktif".
 */
export function eventYangStatusnyaBerubah(
  daftarEvent: EventTampilan[],
  sekarang: Date,
): { keLalu: number[]; keAktif: number[] } {
  const keLalu: number[] = [];
  const keAktif: number[] = [];

  for (const event of daftarEvent) {
    const eventEnd = waktuSelesaiEvent(event.tanggalPelaksanaan, event.waktuSelesai);
    const eventStart = new Date(event.tanggalPelaksanaan);
    if (event.waktuMulai) {
      const [hours, minutes] = event.waktuMulai.split(":");
      eventStart.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    } else {
      eventStart.setHours(0, 0, 0, 0);
    }

    // Aktif yang sudah lewat menjadi "lalu".
    if (event.statusEvent === "aktif" && eventEnd < sekarang) {
      keLalu.push(event.idEvent);
      continue;
    }
    // Draft yang waktunya sudah lewat jauh juga menjadi "lalu".
    if (event.statusEvent === "draft" && eventEnd < sekarang) {
      keLalu.push(event.idEvent);
      continue;
    }
    // Draft yang sudah waktunya tayang dan belum selesai menjadi "aktif".
    if (event.statusEvent === "draft" && eventStart <= sekarang) {
      keAktif.push(event.idEvent);
    }
  }

  return { keLalu, keAktif };
}

/**
 * Apakah event sudah lewat waktu, dipakai untuk menyaring tab "lalu".
 * Event aktif yang waktunya lewat tetap tampil di tab "lalu".
 */
export function eventSudahLewat(event: EventTampilan, sekarang: Date): boolean {
  return (
    waktuSelesaiEvent(event.tanggalPelaksanaan, event.waktuSelesai) < sekarang
  );
}
