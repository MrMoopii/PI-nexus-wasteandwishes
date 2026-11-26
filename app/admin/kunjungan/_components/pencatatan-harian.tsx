"use client";

import { useState } from "react";
import type { KunjunganHarian } from "@/features/kunjungan/queries/admin";
import { formatTanggal } from "@/lib/format-tanggal";
import { BarisKunjungan } from "./baris-kunjungan";
import { FormTertundaMassal } from "./form-tertunda-massal";

type PencatatanHarianProps = {
  /** Tanggal yang sedang ditampilkan ("YYYY-MM-DD"). */
  tanggal: string;
  daftar: KunjunganHarian[];
};

/**
 * Tabel pencatatan kunjungan satu tanggal. Baris `dijadwalkan` bisa dicentang
 * untuk ditandai tertunda sekaligus; setiap baris punya aksi sesuai statusnya.
 */
export function PencatatanHarian({ tanggal, daftar }: PencatatanHarianProps) {
  const [terpilih, setTerpilih] = useState<number[]>([]);

  // Hanya baris dijadwalkan yang boleh ditandai tertunda (lihat tandaiTertunda()).
  // Pilihan lama yang statusnya sudah berubah otomatis dibuang dari kiriman.
  const bisaDipilih = daftar
    .filter((baris) => baris.status === "dijadwalkan")
    .map((baris) => baris.idKunjungan);
  const dipilih = terpilih.filter((id) => bisaDipilih.includes(id));
  const semuaDipilih =
    bisaDipilih.length > 0 && dipilih.length === bisaDipilih.length;

  function ubahPilihan(id: number, dicentang: boolean) {
    setTerpilih((sebelumnya) =>
      dicentang
        ? [...sebelumnya.filter((lain) => lain !== id), id]
        : sebelumnya.filter((lain) => lain !== id),
    );
  }

  function pilihSemua(dicentang: boolean) {
    setTerpilih(dicentang ? bisaDipilih : []);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">
          Kunjungan {formatTanggal(tanggal)}
        </h2>
        <p className="text-sm text-gray-500">
          {daftar.length === 0
            ? "Belum ada kunjungan pada tanggal ini."
            : `${daftar.length} kunjungan`}
        </p>
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
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="w-10 p-3">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua kunjungan yang bisa ditandai tertunda"
                    checked={semuaDipilih}
                    disabled={bisaDipilih.length === 0}
                    onChange={(event) => pilihSemua(event.target.checked)}
                  />
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
                  dipilih={dipilih.includes(baris.idKunjungan)}
                  onPilih={ubahPilihan}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormTertundaMassal
        tanggal={tanggal}
        idTerpilih={dipilih}
        jumlahBisaDipilih={bisaDipilih.length}
      />
    </section>
  );
}
