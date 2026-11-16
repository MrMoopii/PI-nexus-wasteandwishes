"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hapusPesertaEvent } from "./actions";

export default function HapusPesertaButton({
  idPendaftaran,
  eventId,
  nama,
}: {
  idPendaftaran: number;
  eventId: number;
  nama: string;
}) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [pesan, setPesan] = useState("");
  const [sedangMenghapus, setSedangMenghapus] = useState(false);

  async function hapus() {
    setSedangMenghapus(true);
    setPesan("");

    const data = new FormData();
    data.set("idPendaftaran", String(idPendaftaran));
    data.set("eventId", String(eventId));

    const hasil = await hapusPesertaEvent(data);
    if (hasil.error) {
      setPesan(hasil.error);
      setSedangMenghapus(false);
      return;
    }

    setTerbuka(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => {
          setPesan("");
          setTerbuka(true);
        }}
        className="text-sm font-medium text-red-600 hover:text-red-800"
      >
        Hapus
      </button>
      {pesan && !terbuka ? (
        <p className="text-xs text-red-600">{pesan}</p>
      ) : null}

      {terbuka ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="judul-hapus-peserta"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
          >
            <h3
              id="judul-hapus-peserta"
              className="text-lg font-semibold text-gray-900"
            >
              Hapus peserta
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Yakin hapus peserta {nama}? Pendaftaran ini akan dihapus dari
              event.
            </p>
            {pesan ? <p className="mt-3 text-sm text-red-600">{pesan}</p> : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setTerbuka(false)}
                disabled={sedangMenghapus}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:text-gray-400"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={hapus}
                disabled={sedangMenghapus}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-300"
              >
                {sedangMenghapus ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
