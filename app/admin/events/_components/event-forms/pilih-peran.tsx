"use client";

import { useId } from "react";
import { PERAN_WW, LABEL_PERAN_WW } from "@/features/event/types";
import type { EventTampilan } from "@/features/event/types";

type PilihPeranProps = {
  /** Error message dari server, jika ada. */
  error?: string;
  /** Value yang diketik oleh server saat validasi gagal. */
  nilaiPeran?: string;
  /** Event yang diubah (untuk default checked). */
  event?: EventTampilan;
};

/**
 * Pilihan peran WW (narasumber/peserta/mitra) untuk form event admin.
 */
export function PilihPeran({ error, nilaiPeran, event }: PilihPeranProps) {
  const idGalat = useId();
  const nilaiBenar = nilaiPeran ?? event?.peranWw ?? "";

  return (
    <fieldset className="md:col-span-2" aria-describedby={error ? idGalat : undefined}>
      <legend className="text-sm font-medium text-waste">Peran WW</legend>
      <div className="mt-2 flex flex-wrap gap-4">
        {PERAN_WW.map((peran) => (
          <label key={peran} className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input type="radio" name="peranWw" value={peran} defaultChecked={nilaiBenar === peran} />
            {LABEL_PERAN_WW[peran]}
          </label>
        ))}
      </div>
      {error && <p id={idGalat} className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </fieldset>
  );
}