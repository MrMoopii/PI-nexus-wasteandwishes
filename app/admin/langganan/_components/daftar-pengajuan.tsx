import Link from "next/link";
import {
  LABEL_JENIS_INSTANSI,
  STATUS_PENGAJUAN,
  type StatusPengajuan,
} from "@/features/langganan/types";
import type { RingkasanPengajuanAdmin } from "@/features/langganan/queries/admin";
import {
  LABEL_STATUS_PENGAJUAN,
  StatusPengajuanBadge,
} from "./status-pengajuan";

const FORMAT_WAKTU = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

type Props = {
  daftar: RingkasanPengajuanAdmin[];
  jumlahMenunggu: number;
  statusAktif?: StatusPengajuan;
};

/** Kelas tautan tab; tab aktif memakai warna aksen admin. */
function kelasTab(aktif: boolean): string {
  return `rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
    aktif
      ? "border-(--hx-accent) bg-(--hx-accent) text-white"
      : "border-gray-200 bg-white text-gray-600 hover:border-(--hx-accent)/50 hover:text-(--hx-accent)"
  }`;
}

/** Tab filter status, termasuk "Semua" yang membuka halaman tanpa ?status=. */
function TabStatus({ statusAktif }: { statusAktif?: StatusPengajuan }) {
  return (
    <nav
      aria-label="Filter status pengajuan"
      className="mb-6 flex flex-wrap gap-2"
    >
      <Link
        href="/admin/langganan"
        aria-current={statusAktif === undefined ? "page" : undefined}
        className={kelasTab(statusAktif === undefined)}
      >
        Semua
      </Link>
      {STATUS_PENGAJUAN.map((status) => (
        <Link
          key={status}
          href={`/admin/langganan?status=${status}`}
          aria-current={statusAktif === status ? "page" : undefined}
          className={kelasTab(statusAktif === status)}
        >
          {LABEL_STATUS_PENGAJUAN[status]}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Tabel daftar pengajuan langganan untuk admin, dengan filter status dan
 * jumlah pengajuan yang menunggu tindakan admin.
 */
export function DaftarPengajuan({
  daftar,
  jumlahMenunggu,
  statusAktif,
}: Props) {
  return (
    <div className="mx-auto w-full max-w-7xl font-(family-name:--font-plus-jakarta-sans)">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Langganan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tinjau pengajuan langganan pelanggan dan tentukan harga serta syarat
            pengambilan.
          </p>
        </div>
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
          {jumlahMenunggu} pengajuan menunggu admin
        </p>
      </header>

      <TabStatus statusAktif={statusAktif} />

      {daftar.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <p className="text-center font-medium text-gray-500">
            {statusAktif === undefined
              ? "Belum ada pengajuan langganan."
              : `Tidak ada pengajuan berstatus ${LABEL_STATUS_PENGAJUAN[statusAktif]}.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-4">Instansi</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Jenis instansi</th>
                <th className="p-4">Perkiraan ember</th>
                <th className="p-4">Status</th>
                <th className="p-4">Diajukan</th>
                <th className="p-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {daftar.map((baris) => (
                <tr key={baris.idPengajuan} className="hover:bg-gray-50/60">
                  <td className="p-4 font-medium text-gray-900">
                    {baris.namaInstansi}
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-gray-900">
                      {baris.namaPelanggan || "Nama belum diisi"}
                    </p>
                    <p className="text-xs text-gray-500">{baris.email}</p>
                  </td>
                  <td className="p-4 text-gray-600">
                    {LABEL_JENIS_INSTANSI[baris.jenisInstansi]}
                  </td>
                  <td className="p-4 text-gray-600">{baris.estimasiEmber}</td>
                  <td className="p-4">
                    <StatusPengajuanBadge status={baris.status} />
                  </td>
                  <td className="p-4 text-gray-600">
                    {FORMAT_WAKTU.format(baris.dibuatPada)}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/admin/langganan/${baris.idPengajuan}`}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-(--hx-accent)/50 hover:text-(--hx-accent)"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
