"use client";

import { useState } from "react";
import type { KunjunganHarian } from "@/features/kunjungan/queries/admin";
import { formatTanggal } from "@/lib/format-tanggal";
import { BarisKunjungan } from "./baris-kunjungan";

type PencatatanHarianProps = {
  /** Tanggal yang sedang ditampilkan ("YYYY-MM-DD"). */
  tanggal: string;
  daftar: KunjunganHarian[];
};

/**
 * Tabel pencatatan kunjungan satu tanggal. Baris `dijadwalkan` bisa dicentang
 * untuk membuka form tandai tertunda; baris `tertunda` tidak bisa dicentang dan
 * pembatalannya lewat tombol Batalkan penundaan di baris itu.
 */
export function PencatatanHarian({ tanggal, daftar }: PencatatanHarianProps) {
  const [terpilih, setTerpilih] = useState<number[]>([]);

  // Setiap daftar baru dari server (setelah simpan/batal/segarkan) mengosongkan
  // pilihan. Tanpa ini, kunjungan yang penundaannya dibatalkan akan tercentang
  // lagi karena ID-nya masih tersimpan, padahal statusnya sudah kembali dijadwalkan.
  const [daftarTerakhir, setDaftarTerakhir] = useState(daftar);
  if (daftar !== daftarTerakhir) {
    setDaftarTerakhir(daftar);
    setTerpilih([]);
  }

  // Hanya baris dijadwalkan yang bisa dicentang. Baris tertunda tidak bisa
  // dicentang lagi; pembatalannya lewat tombol di baris itu (permintaan bos).
  const bisaDipilih = daftar
    .filter((baris) => baris.status === "dijadwalkan")
    .map((baris) => baris.idKunjungan);
  const dipilih = terpilih.filter((id) => bisaDipilih.includes(id));

  function ubahPilihan(id: number, dicentang: boolean) {
    setTerpilih((sebelumnya) =>
      dicentang
        ? [...sebelumnya.filter((lain) => lain !== id), id]
        : sebelumnya.filter((lain) => lain !== id),
    );
  }

  return (
    <section className="rounded-2xl space-y-4 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">
          Kunjungan {formatTanggal(tanggal)}
        </h2>
        <p className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium">
          {daftar.length === 0
            ? "Belum ada kunjungan pada tanggal ini."
            : `${daftar.length} kunjungan`}
        </p>
        <div className="mx-auto w-full max-w-6xl font-(family-name:--font-plus-jakarta-sans)">
          <p className="text-sm text-gray-500">Centang kunjungan berstatus dijadwalkan di tabel, lalu isi alasan dan tanggal paling lambat. Tidak ada kunjungan yang bisa ditandai tertunda pada tanggal ini.</p>
        </div>
      </div>

      {daftar.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <p className="text-center font-medium text-gray-500">
            Belum ada kunjungan pada tanggal ini. Buat kunjungan lewat halaman
            Buat Kunjungan, atau pilih tanggal lain.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-center text-sm">
            <thead className="bg-waste text-xs uppercase text-white">
              <tr>
                <th className="w-10 p-5">
                  <span className="sr-only">Pilih untuk ditandai tertunda</span>
                </th>
                <th className="p-3">Instansi</th>
                <th className="p-3">Jam</th>
                <th className="p-3">Status</th>
                <th className="p-3">Ember</th>
                <th className="p-3">Berat</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {daftar.map((baris) => (
                <BarisKunjungan
                  key={baris.idKunjungan}
                  kunjungan={baris}
                  tanggal={tanggal}
                  dipilih={dipilih.includes(baris.idKunjungan)}
                  onPilih={ubahPilihan}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
