import type { PengirimPesan, StatusPengajuan } from "./types";

// Aturan alur pengajuan langganan: fungsi murni tanpa database dan tanpa sesi.
// Server Action memakai statusAsal(aksi) di WHERE status IN (…) dan statusTujuan(aksi)
// di SET status, supaya aturan transisi hanya ditulis di sini (CONTRIBUTING 6.2, 9.7).
// Mengirim pengajuan baru tidak ada di sini karena belum ada status asal;
// satu pengajuan berjalan per akun dijaga unique index di database.

type AturanAksi = {
  /** Siapa yang boleh menjalankan aksi ini. Dicek di Server Action lewat requireLogin/requireAdmin. */
  aktor: readonly PengirimPesan[];
  /** Status yang mengizinkan aksi ini. */
  dari: readonly StatusPengajuan[];
  /** Status setelah aksi; null berarti status tetap. */
  ke: StatusPengajuan | null;
};

// Penolakan dan pembatalan hanya boleh sebelum harga dan syarat terkunci di siap_bayar.
const SEBELUM_SIAP_BAYAR = [
  "menunggu_review",
  "ditawarkan",
  "negosiasi",
  "disetujui_pelanggan",
] as const satisfies readonly StatusPengajuan[];

/** Tabel alur status pengajuan. Satu baris per aksi, sesuai rencana kerja tim. */
export const AKSI_PENGAJUAN = {
  // Admin: harga per 30 hari, jenis pelanggan, hari, jam, jumlah ember, catatan.
  kirimPenawaran: {
    aktor: ["admin"],
    dari: ["menunggu_review", "negosiasi"],
    ke: "ditawarkan",
  },
  // Pelanggan menyetujui penawaran terakhir; harga_final = harga usulan admin terakhir.
  setujuiHarga: {
    aktor: ["pelanggan"],
    dari: ["ditawarkan"],
    ke: "disetujui_pelanggan",
  },
  // Pelanggan mengusulkan harga lain beserta pesan.
  tawarHarga: { aktor: ["pelanggan"], dari: ["ditawarkan"], ke: "negosiasi" },
  // Admin menerima usulan; harga_final = harga usulan pelanggan terakhir.
  terimaTawaran: {
    aktor: ["admin"],
    dari: ["negosiasi"],
    ke: "disetujui_pelanggan",
  },
  // Pesan tanpa harga dari kedua pihak, status tidak berubah.
  kirimPesan: {
    aktor: ["pelanggan", "admin"],
    dari: ["menunggu_review", "ditawarkan", "negosiasi"],
    ke: null,
  },
  // Harga dan syarat terkunci setelah ini.
  aktifkanPembayaran: {
    aktor: ["admin"],
    dari: ["disetujui_pelanggan"],
    ke: "siap_bayar",
  },
  // Status tetap siap_bayar; keadaan langganan dibaca dari data_langganan (bagian 9.7).
  bayar: { aktor: ["pelanggan"], dari: ["siap_bayar"], ke: null },
  // Alasan wajib (dicek di skema Zod admin).
  tolakPengajuan: { aktor: ["admin"], dari: SEBELUM_SIAP_BAYAR, ke: "ditolak" },
  batalkanPengajuan: {
    aktor: ["pelanggan"],
    dari: SEBELUM_SIAP_BAYAR,
    ke: "dibatalkan",
  },
} as const satisfies Record<string, AturanAksi>;

export type AksiPengajuan = keyof typeof AKSI_PENGAJUAN;

/**
 * Status asal yang mengizinkan aksi, untuk WHERE status IN (…).
 * Dikembalikan sebagai salinan supaya bisa langsung dipakai inArray().
 */
export function statusAsal(aksi: AksiPengajuan): StatusPengajuan[] {
  return [...AKSI_PENGAJUAN[aksi].dari];
}

/** Status setelah aksi berhasil; null berarti status tidak berubah. */
export function statusTujuan(aksi: AksiPengajuan): StatusPengajuan | null {
  return AKSI_PENGAJUAN[aksi].ke;
}

/**
 * Apakah aksi boleh dijalankan pada pengajuan berstatus ini.
 * Untuk menampilkan tombol; Server Action tetap memakai UPDATE … WHERE status IN (…).
 */
export function transisiValid(
  aksi: AksiPengajuan,
  statusSekarang: StatusPengajuan,
): boolean {
  return statusAsal(aksi).includes(statusSekarang);
}

/** Tombol bayar hanya aktif setelah harga disepakati dan diaktifkan admin. */
export function bolehBayar(status: StatusPengajuan): boolean {
  return transisiValid("bayar", status);
}

/** Status yang menunggu tindakan admin, untuk penanda jumlah di dasbor admin. */
export const STATUS_MENUNGGU_ADMIN = [
  "menunggu_review",
  "negosiasi",
  "disetujui_pelanggan",
] as const satisfies readonly StatusPengajuan[];
