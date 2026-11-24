"use client";

import { useState, useTransition } from "react";
import { mulaiPembayaranLangganan } from "./actions";

export default function PaymentButton() {
  const [isPending, startTransition] = useTransition();
  const [pesan, setPesan] = useState<string | null>(null);

  function mulaiCheckout() {
    setPesan(null);
    startTransition(async () => {
      const result = await mulaiPembayaranLangganan();
      if (!result.ok) {
        setPesan(result.pesan);
        return;
      }
      window.location.assign(result.redirectUrl);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={mulaiCheckout}
        disabled={isPending}
        className="rounded-full bg-[#17AFB0] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#128f90] disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Menyiapkan pembayaran…" : "Berlangganan — Rp30.000"}
      </button>
      {pesan && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {pesan}
        </p>
      )}
    </div>
  );
}
