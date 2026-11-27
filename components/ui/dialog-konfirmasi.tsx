"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type VarianKonfirmasi = "bahaya" | "utama";

const KELAS_TOMBOL: Record<VarianKonfirmasi, string> = {
  bahaya: "bg-red-600 hover:bg-red-700",
  utama: "bg-waste hover:bg-waste-dark",
};

export type DialogKonfirmasiProps = {
  /** Judul di bagian atas, misalnya "Lewati Pengambilan". */
  judul: string;
  /** Pertanyaan konfirmasi; boleh berisi teks tebal. */
  children: ReactNode;
  /** Peringatan merah di bawah pertanyaan, misalnya "Tindakan ini tidak dapat dibatalkan." */
  peringatan?: string;
  /** Teks tombol konfirmasi, misalnya "Hapus". */
  labelKonfirmasi: string;
  /** Teks tombol batal. Bawaan "Batal". */
  labelBatal?: string;
  /** Warna tombol konfirmasi. Bawaan "bahaya" (merah). */
  varian?: VarianKonfirmasi;
  onKonfirmasi: () => void;
  onBatal: () => void;
};

/**
 * Dialog konfirmasi modal pengganti window.confirm: judul, pertanyaan, peringatan merah
 * opsional, tombol Batal dan tombol konfirmasi. Tampil selama dirender, jadi pemanggil
 * yang menentukan kapan dirender. Memakai <dialog> bawaan browser: fokus tertahan di
 * dialog, dan tombol Esc sama dengan Batal. Tanpa logika bisnis.
 */
export function DialogKonfirmasi({
  judul,
  children,
  peringatan,
  labelKonfirmasi,
  labelBatal = "Batal",
  varian = "bahaya",
  onKonfirmasi,
  onBatal,
}: DialogKonfirmasiProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const idJudul = useId();

  // Buka sebagai modal saat dirender dan tutup saat dilepas, supaya aman di StrictMode.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idJudul}
      onCancel={(e) => {
        // Esc ditahan, lalu diteruskan sebagai Batal supaya pemanggil yang menutup dialog.
        e.preventDefault();
        onBatal();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-slate-200 bg-white p-0 shadow-lg backdrop:bg-slate-900/40 backdrop:backdrop-blur-sm"
    >
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 id={idJudul} className="text-lg font-bold text-slate-800">
          {judul}
        </h3>
      </div>
      <div className="px-6 py-4">
        <div className="text-slate-600">{children}</div>
        {peringatan && (
          <p className="mt-2 text-sm text-red-600">{peringatan}</p>
        )}
      </div>
      <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          onClick={onBatal}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          {labelBatal}
        </button>
        <button
          type="button"
          onClick={onKonfirmasi}
          className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition-colors ${KELAS_TOMBOL[varian]}`}
        >
          {labelKonfirmasi}
        </button>
      </div>
    </dialog>
  );
}
