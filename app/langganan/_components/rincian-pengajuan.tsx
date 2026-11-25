import { formatJam } from "@/lib/format-tanggal";
import {
  LABEL_JENIS_INSTANSI,
  type DetailPengajuan,
} from "@/features/langganan/types";

// Angka di hari_pengambilan: 1 = Senin sampai 5 = Jumat (CHECK di skema).
const NAMA_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

/** Waktu dibuat (timestamp) dalam zona Jakarta (CONTRIBUTING 9.2). */
function tanggalDiajukan(waktu: Date): string {
  return waktu.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

/** Jadwal yang ditetapkan admin; null jika admin belum mengisinya. */
function jadwalPengambilan(pengajuan: DetailPengajuan): string | null {
  const { hariPengambilan, jamMulai, jamSelesai } = pengajuan;
  if (hariPengambilan === null) return null;

  const hari = hariPengambilan
    .map((angka) => NAMA_HARI[angka - 1] ?? `hari ke-${angka}`)
    .join(", ");
  // Jam kosong berarti jam menyesuaikan WW (keputusan mitra).
  const jam =
    jamMulai !== null && jamSelesai !== null
      ? `${formatJam(jamMulai)}–${formatJam(jamSelesai)} WIB`
      : "jam menyesuaikan Waste and Wishes";
  return `${hari}, ${jam}`;
}

/** Daftar isian pengajuan dan syarat dari admin. Baris yang kosong tidak ditampilkan. */
export function RincianPengajuan({ pengajuan }: { pengajuan: DetailPengajuan }) {
  const jenisInstansi =
    pengajuan.jenisInstansi === "lainnya" && pengajuan.jenisInstansiLain
      ? pengajuan.jenisInstansiLain
      : LABEL_JENIS_INSTANSI[pengajuan.jenisInstansi];

  const baris: [string, string | null][] = [
    ["Nama instansi", pengajuan.namaInstansi],
    ["Jenis instansi", jenisInstansi],
    ["Alamat pengambilan", pengajuan.alamatPengambilan],
    ["PIC", `${pengajuan.namaPic} · ${pengajuan.telpPic}`],
    ["Perkiraan ember per pengambilan", `${pengajuan.estimasiEmber} ember`],
    ["Jenis limbah", pengajuan.jenisLimbah],
    ["Catatan", pengajuan.catatanPelanggan],
    ["Jadwal pengambilan", jadwalPengambilan(pengajuan)],
    [
      "Jumlah ember dari admin",
      pengajuan.jumlahEmber === null ? null : `${pengajuan.jumlahEmber} ember`,
    ],
    ["Diajukan pada", tanggalDiajukan(pengajuan.dibuatPada)],
  ];
  const terisi = baris.filter(
    (b): b is [string, string] => b[1] !== null,
  );

  return (
    <dl className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
      {terisi.map(([label, isi]) => (
        <div key={label}>
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            {label}
          </dt>
          <dd className="mt-1 whitespace-pre-line text-sm font-medium text-slate-900">
            {isi}
          </dd>
        </div>
      ))}
    </dl>
  );
}
