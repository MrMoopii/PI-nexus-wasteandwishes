import { formatRupiah } from "@/lib/format-angka";
import type { PengirimPesan, PesanNegosiasiTampilan } from "../types";

// Kolom dibuat_pada bertipe timestamp, jadi ditampilkan dalam zona Jakarta (CONTRIBUTING 9.2).
const FORMAT_WAKTU = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

type RiwayatNegosiasiProps = {
  daftarPesan: PesanNegosiasiTampilan[];
  /**
   * Nama setiap pihak, diisi halaman pemakai supaya komponen tidak bergantung
   * pada peran. Misalnya { pelanggan: "Anda", admin: "Waste and Wishes" }.
   */
  namaPengirim: Record<PengirimPesan, string>;
};

/**
 * Riwayat pesan negosiasi satu pengajuan, dari yang terlama: nama pengirim,
 * waktu (WIB), harga usulan jika ada, dan isi pesan. Hanya menerima props.
 */
export function RiwayatNegosiasi({
  daftarPesan,
  namaPengirim,
}: RiwayatNegosiasiProps) {
  if (daftarPesan.length === 0) {
    return (
      <p className="text-sm text-slate-500">Belum ada pesan negosiasi.</p>
    );
  }

  // Diurutkan di sini supaya urutan tidak bergantung pada ORDER BY di query;
  // id_pesan memisahkan pesan yang tersimpan pada waktu yang sama.
  const urut = [...daftarPesan].sort(
    (a, b) =>
      a.dibuatPada.getTime() - b.dibuatPada.getTime() || a.idPesan - b.idPesan,
  );

  return (
    <ol aria-label="Riwayat negosiasi" className="space-y-3">
      {urut.map((pesan) => (
        <li
          key={pesan.idPesan}
          className="rounded-lg border border-slate-200 p-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {namaPengirim[pesan.pengirim]}
            </p>
            <time
              dateTime={pesan.dibuatPada.toISOString()}
              className="text-xs text-slate-500"
            >
              {FORMAT_WAKTU.format(pesan.dibuatPada)}
            </time>
          </div>

          {pesan.hargaUsulan !== null && (
            <p className="mt-2 text-sm text-slate-700">
              Usulan harga:{" "}
              <span className="font-semibold text-waste">
                {formatRupiah(pesan.hargaUsulan)}
              </span>{" "}
              / 30 hari
            </p>
          )}

          {pesan.pesan && (
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
              {pesan.pesan}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
