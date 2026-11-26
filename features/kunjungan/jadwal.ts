import type { AturanHariLibur } from "./types";

// Fungsi murni untuk jadwal kunjungan (kode tugas 2.2): tanpa database, tanpa sesi.
// Dipakai aksi "Buat kunjungan" (2.2), tracker dan form lewati (2.4), serta
// pembuatan ulang kunjungan setelah pola diubah admin (2.7).
//
// Semua tanggal berupa teks "YYYY-MM-DD", sama dengan nilai kolom date dari Drizzle
// (CONTRIBUTING 9.2). Perhitungan hari dilakukan di UTC supaya tanggal tidak bergeser
// antara laptop (WIB) dan Vercel (UTC), sama seperti formatTanggal().

/** Tanggal libur ("YYYY-MM-DD") beserta aturannya, dari tabel hari_libur. */
export type PetaHariLibur = ReadonlyMap<string, AturanHariLibur>;

const SATU_HARI_MS = 24 * 60 * 60 * 1000;

/** Tengah malam UTC tanggal itu. */
function keWaktu(tanggal: string): Date {
  return new Date(`${tanggal}T00:00:00Z`);
}

/** Nomor hari ISO: Senin = 1 sampai Minggu = 7, sama dengan angka hari_pengambilan. */
function hariIso(tanggal: string): number {
  const hari = keWaktu(tanggal).getUTCDay();
  return hari === 0 ? 7 : hari;
}

/** Tanggal "YYYY-MM-DD" ditambah sejumlah hari kalender (boleh negatif). */
export function tambahHari(tanggal: string, jumlah: number): string {
  const waktu = keWaktu(tanggal).getTime() + jumlah * SATU_HARI_MS;
  return new Date(waktu).toISOString().slice(0, 10);
}

/** Senin sampai Jumat. Sabtu dan Minggu tidak ada pengambilan. */
export function isHariKerja(tanggal: string): boolean {
  return hariIso(tanggal) <= 5;
}

/**
 * Hari kerja pertama setelah `tanggal` yang bukan hari libur, apa pun aturan
 * libur itu. Dipakai aturan geser, termasuk libur yang berurutan (Kamis dan
 * Jumat libur berarti pindah ke Senin).
 */
export function hariKerjaBerikutnya(
  tanggal: string,
  hariLibur: PetaHariLibur,
): string {
  let kandidat = tambahHari(tanggal, 1);
  while (!isHariKerja(kandidat) || hariLibur.has(kandidat)) {
    kandidat = tambahHari(kandidat, 1);
  }
  return kandidat;
}

/**
 * Tanggal kunjungan satu pelanggan dari pola hari (1 = Senin … 5 = Jumat) untuk
 * rentang mulai–selesai (keduanya ikut), setelah aturan hari libur diterapkan:
 * - bukan libur: tetap;
 * - libur `geser`: pindah ke hariKerjaBerikutnya(), boleh jatuh setelah `selesai`;
 * - libur `lewati`: tidak ada kunjungan.
 * Hasil geser yang jatuh di hari jadwal pelanggan menjadi satu kunjungan saja.
 * Hasil urut dari tanggal terawal, tanpa tanggal ganda.
 */
export function tanggalKunjungan(isi: {
  hariPengambilan: readonly number[];
  mulai: string;
  selesai: string;
  hariLibur: PetaHariLibur;
}): string[] {
  const hasil = new Set<string>();

  // 1. Telusuri setiap hari kalender di rentang; teks "YYYY-MM-DD" bisa dibandingkan langsung.
  for (
    let tanggal = isi.mulai;
    tanggal <= isi.selesai;
    tanggal = tambahHari(tanggal, 1)
  ) {
    // 2. Ambil hanya hari kerja yang ada di pola pelanggan.
    if (!isHariKerja(tanggal)) continue;
    if (!isi.hariPengambilan.includes(hariIso(tanggal))) continue;

    // 3. Terapkan aturan hari libur. Set membuat hasil geser yang sama dengan
    //    hari jadwal berikutnya tidak tercatat dua kali.
    const aturan = isi.hariLibur.get(tanggal);
    if (aturan === undefined) {
      hasil.add(tanggal);
    } else if (aturan === "geser") {
      hasil.add(hariKerjaBerikutnya(tanggal, isi.hariLibur));
    }
  }

  return [...hasil].sort();
}

/**
 * Batas waktu pelanggan meminta satu pengambilan dilewati: H-1 pukul 17.00 WIB,
 * dihitung per hari kalender. Kunjungan Senin batasnya Minggu 17.00 WIB.
 */
export function batasMintaLewati(tanggalKunjungan: string): Date {
  return new Date(`${tambahHari(tanggalKunjungan, -1)}T17:00:00+07:00`);
}

/**
 * Apakah pelanggan masih boleh meminta kunjungan pada `tanggalKunjungan` dilewati
 * pada waktu `sekarang`. Tepat pukul 17.00 WIB di H-1 sudah tidak boleh.
 * Status kunjungan (misalnya hanya dijadwalkan) dicek pemanggil.
 */
export function bolehMintaLewati(
  tanggalKunjungan: string,
  sekarang: Date,
): boolean {
  return sekarang.getTime() < batasMintaLewati(tanggalKunjungan).getTime();
}
