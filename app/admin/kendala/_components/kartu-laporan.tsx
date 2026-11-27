import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { BadgeStatusKunjungan } from "@/features/kunjungan/components/badge-status-kunjungan";
import type { LaporanAdmin } from "@/features/kunjungan/queries/kendala";
import { LABEL_JENIS_LAPORAN } from "@/features/kunjungan/types";

// Kolom date diformat di UTC supaya hari tidak bergeser (CONTRIBUTING 9.2).
const FORMAT_TANGGAL_PANJANG = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "Selasa, 22 Desember 2026" dari nilai kolom date "YYYY-MM-DD". */
export function tanggalPanjang(tanggal: string): string {
  return FORMAT_TANGGAL_PANJANG.format(new Date(`${tanggal}T00:00:00Z`));
}

/** Waktu kirim laporan. Kolom timestamp diformat di zona Jakarta (CONTRIBUTING 9.2). */
function waktuKirim(waktu: Date): string {
  const teks = waktu.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return `${teks} WIB`;
}

type KartuLaporanProps = {
  laporan: LaporanAdmin;
  /** Form tanggapan (kotak masuk) atau hasil dan tanggapan (riwayat). */
  children?: ReactNode;
};

/**
 * Satu laporan pelanggan untuk admin: instansi, PIC, kunjungan yang dilaporkan beserta
 * statusnya sekarang, isi laporan, usulan tanggal pengganti, dan waktu kirim.
 * Hanya menerima props; dipakai kotak masuk dan riwayat.
 */
export function KartuLaporan({ laporan, children }: KartuLaporanProps) {
  return (
    <li className="space-y-3 py-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{laporan.namaInstansi}</p>
          <p className="text-xs text-gray-500">
            PIC {laporan.namaPic} · {laporan.telpPic}
          </p>
        </div>
        <Badge varian={laporan.jenis === "kendala" ? "peringatan" : "netral"}>
          {LABEL_JENIS_LAPORAN[laporan.jenis]}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
        <span>Kunjungan {tanggalPanjang(laporan.tanggalKunjungan)}</span>
        <BadgeStatusKunjungan status={laporan.statusKunjungan} />
      </div>

      <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {laporan.jenis === "kendala" ? "Pesan pelanggan" : "Alasan pelanggan"}
        </p>
        <p className="mt-1 whitespace-pre-line wrap-break-word">
          {laporan.pesan}
        </p>
      </div>

      {laporan.tanggalPengganti !== null && (
        <p className="text-sm text-gray-700">
          Usulan tanggal pengganti:{" "}
          <span className="font-medium text-gray-900">
            {tanggalPanjang(laporan.tanggalPengganti)}
          </span>
        </p>
      )}
      <p className="text-xs text-gray-400">
        Dikirim {waktuKirim(laporan.dibuatPada)}
      </p>

      {children}
    </li>
  );
}
