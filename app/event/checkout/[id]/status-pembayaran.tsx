"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cekStatusPembayaranEvent } from "@/app/event/actions";

const JEDA_POLLING_MS = 2000;
const MAKS_PERCOBAAN = 15;

export default function StatusPembayaran({
  eventId,
  orderId,
  message,
}: {
  eventId: number;
  orderId: string;
  message: string;
}) {
  const router = useRouter();
  const [mencariBukti, setMencariBukti] = useState(false);
  const [berhenti, setBerhenti] = useState<
    "menunggu" | "tanpa_kuota" | "gagal" | null
  >(null);
  const [ulangi, setUlangi] = useState(0);

  useEffect(() => {
    let dibatalkan = false;
    let percobaan = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const periksa = async () => {
      percobaan += 1;
      let hasil: Awaited<ReturnType<typeof cekStatusPembayaranEvent>>;

      try {
        hasil = await cekStatusPembayaranEvent({ eventId, orderId });
      } catch (error) {
        console.error("Gagal memeriksa status pembayaran event:", error);
        if (!dibatalkan) setBerhenti("gagal");
        return;
      }

      if (dibatalkan) return;

      if (hasil.status === "berhasil") {
        setMencariBukti(true);
        router.replace(`/event/bukti/${hasil.idPendaftaran}`);
        return;
      }

      if (hasil.status === "berhasil_tanpa_kuota") {
        setBerhenti("tanpa_kuota");
        return;
      }

      if (hasil.status === "gagal") {
        setBerhenti("gagal");
        return;
      }

      if (percobaan < MAKS_PERCOBAAN) {
        timer = setTimeout(periksa, JEDA_POLLING_MS);
      } else {
        setBerhenti("menunggu");
      }
    };

    timer = setTimeout(periksa, 1000);

    return () => {
      dibatalkan = true;
      if (timer) clearTimeout(timer);
    };
  }, [eventId, orderId, router, ulangi]);

  if (mencariBukti) {
    return (
      <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800 shadow-sm">
        Pembayaran diterima. Mengalihkan ke bukti pendaftaran…
      </div>
    );
  }

  if (berhenti === "tanpa_kuota") {
    return (
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Pembayaran Anda sudah diterima, tetapi kuota event ini ternyata sudah
        habis. Silakan hubungi admin untuk penyelesaian.
      </div>
    );
  }

  if (berhenti === "gagal") {
    return (
      <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Pembayaran belum berhasil atau dibatalkan. Silakan coba lagi dari form
        di bawah.
      </div>
    );
  }

  if (berhenti === "menunggu") {
    return (
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p>
          Pembayaran masih diproses. Muat ulang halaman ini beberapa saat lagi
          atau cek kembali melalui halaman event.
        </p>
        <button
          type="button"
          onClick={() => {
            setBerhenti(null);
            setUlangi((jumlah) => jumlah + 1);
          }}
          className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
        >
          Periksa lagi
        </button>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-xl border border-(--hx-pastel) bg-(--hx-canvas)/80 px-4 py-3 text-sm text-(--hx-ink-2)">
      {message || "Memeriksa status pembayaran…"}
    </div>
  );
}
