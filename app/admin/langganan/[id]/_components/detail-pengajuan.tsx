import Link from "next/link";
import {
  LABEL_JENIS_INSTANSI,
  type PesanNegosiasiTampilan,
} from "@/features/langganan/types";
import type { DetailPengajuanAdmin } from "@/features/langganan/queries/admin";
import { formatRupiah } from "@/lib/format-angka";
import { formatWaktu } from "@/lib/format-tanggal";
import { StatusPengajuanBadge } from "../../_components/status-pengajuan";
import { PanelAksi } from "./panel-aksi";

const FORMAT_WAKTU = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

// Urutan hari di database: 1 = Senin sampai 5 = Jumat (CHECK di schema-langganan.ts).
const LABEL_HARI: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
};

/** Satu baris fakta berlabel di kartu detail. */
function Fakta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 py-2 last:border-b-0">
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-gray-800">{children}</dd>
    </div>
  );
}

/** Teks jenis instansi; 'lainnya' menampilkan isian manual pelanggan. */
function teksJenisInstansi(pengajuan: DetailPengajuanAdmin): string {
  if (pengajuan.jenisInstansi === "lainnya") {
    return pengajuan.jenisInstansiLain || "Instansi lain (tanpa keterangan)";
  }
  return LABEL_JENIS_INSTANSI[pengajuan.jenisInstansi];
}

/**
 * Teks rentang jam. Jam kosong setelah admin menetapkan syarat berarti
 * jam menyesuaikan WW (keputusan mitra); sebelum itu berarti belum diatur.
 */
function teksJam(pengajuan: DetailPengajuanAdmin): string {
  if (pengajuan.jamMulai === null && pengajuan.jamSelesai === null) {
    return pengajuan.jenisPelanggan === null
      ? "Belum diatur"
      : "Jam menyesuaikan WW";
  }
  return formatWaktu(pengajuan.jamMulai, pengajuan.jamSelesai);
}

/** Teks hari pengambilan; hari kosong atau asing ditampilkan apa adanya. */
function teksHari(hari: number[] | null): string {
  if (!hari || hari.length === 0) return "Belum diatur admin";
  return hari.map((nilai) => LABEL_HARI[nilai] ?? String(nilai)).join(", ");
}

/**
 * Detail satu pengajuan langganan untuk review admin: data pelanggan,
 * instansi, perkiraan ember, syarat pengambilan, catatan pelanggan, dan
 * panel tindakan admin (kode tugas 1.5).
 */
export function DetailPengajuan({
  pengajuan,
  pesan,
}: {
  pengajuan: DetailPengajuanAdmin;
  /** Riwayat pesan negosiasi, urut dari yang terlama. */
  pesan: PesanNegosiasiTampilan[];
}) {
  return (
    <div className="mx-auto w-full max-w-5xl font-(family-name:--font-plus-jakarta-sans)">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/langganan"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-(--hx-accent)/50 hover:text-(--hx-accent)"
          >
            <span aria-hidden="true">←</span>
            <span>Kembali</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Detail Pengajuan</h1>
        </div>
        <StatusPengajuanBadge status={pengajuan.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
            Data pelanggan
          </h2>
          <dl>
            <Fakta label="Nama">
              {pengajuan.namaPelanggan || "Nama belum diisi"}
            </Fakta>
            <Fakta label="Email">{pengajuan.email}</Fakta>
            <Fakta label="Nomor telepon">
              {pengajuan.nomorTelp || "Belum diisi"}
            </Fakta>
            <Fakta label="Alamat profil">
              {pengajuan.alamat || "Belum diisi"}
            </Fakta>
          </dl>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
            Instansi dan pengambilan
          </h2>
          <dl>
            <Fakta label="Nama instansi">{pengajuan.namaInstansi}</Fakta>
            <Fakta label="Jenis instansi">
              {teksJenisInstansi(pengajuan)}
            </Fakta>
            <Fakta label="Alamat pengambilan">
              {pengajuan.alamatPengambilan}
            </Fakta>
            <Fakta label="Nama PIC">{pengajuan.namaPic}</Fakta>
            <Fakta label="Telepon PIC">{pengajuan.telpPic}</Fakta>
            <Fakta label="Jenis limbah">
              {pengajuan.jenisLimbah || "Belum diisi"}
            </Fakta>
            <Fakta label="Perkiraan ember">{pengajuan.estimasiEmber}</Fakta>
          </dl>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
            Syarat yang ditetapkan admin
          </h2>
          <dl>
            <Fakta label="Jenis pelanggan">
              {pengajuan.jenisPelanggan === null
                ? "Belum ditetapkan"
                : pengajuan.jenisPelanggan === "mou"
                  ? "MOU"
                  : "Reguler"}
            </Fakta>
            <Fakta label="Hari pengambilan">
              {teksHari(pengajuan.hariPengambilan)}
            </Fakta>
            <Fakta label="Rentang jam">{teksJam(pengajuan)}</Fakta>
            <Fakta label="Jumlah ember">
              {pengajuan.jumlahEmber === null
                ? "Belum ditetapkan"
                : pengajuan.jumlahEmber}
            </Fakta>
            <Fakta label="Harga final">
              {pengajuan.hargaFinal === null
                ? "Belum disepakati"
                : `${formatRupiah(pengajuan.hargaFinal)} / 30 hari`}
            </Fakta>
          </dl>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
            Catatan dan riwayat
          </h2>
          <dl>
            <Fakta label="Catatan pelanggan">
              {pengajuan.catatanPelanggan || "Tidak ada catatan."}
            </Fakta>
            <Fakta label="Alasan ditolak">
              {pengajuan.alasanDitolak || "—"}
            </Fakta>
            <Fakta label="Diajukan">
              {FORMAT_WAKTU.format(pengajuan.dibuatPada)}
            </Fakta>
            <Fakta label="Terakhir diperbarui">
              {FORMAT_WAKTU.format(pengajuan.diperbaruiPada)}
            </Fakta>
          </dl>
        </section>
      </div>

      <PanelAksi pengajuan={pengajuan} pesan={pesan} />
    </div>
  );
}
