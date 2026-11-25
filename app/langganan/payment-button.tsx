"use client";

import { useState, useTransition } from "react";
import { mulaiPembayaranLangganan } from "@/features/langganan/actions/pembayaran";
import { formatRupiah } from "@/lib/format-angka";

type PaymentButtonProps = {
  idPengajuan: number;
  hargaFinal: number;
};

/**
 * Tombol bayar langganan, dipasang hanya untuk pengajuan yang bolehBayar(status).
 * hargaFinal hanya label: jumlah yang ditagih dihitung ulang di server dari harga_final.
 * Pesan gagal dari server tampil di bawah tombol; jika berhasil, pindah ke Midtrans.
 */
export default function PaymentButton({
  idPengajuan,
  hargaFinal,
}: PaymentButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [pesan, setPesan] = useState<string | null>(null);

  function mulaiCheckout(formData: FormData) {
    setPesan(null);
    startTransition(async () => {
      const result = await mulaiPembayaranLangganan(formData);
      if (!result.ok) {
        setPesan(result.pesan);
        return;
      }
      window.location.assign(result.redirectUrl);
    });
  }

  return (
    <form action={mulaiCheckout}>
      <input type="hidden" name="idPengajuan" value={idPengajuan} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[#17AFB0] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#128f90] disabled:cursor-wait disabled:opacity-60"
      >
        {isPending
          ? "Menyiapkan pembayaran…"
          : `Bayar ${formatRupiah(hargaFinal)}`}
      </button>
      {pesan && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {pesan}
        </p>
      )}
    </form>
  );
}
