"use client";

type StatusSelectProps = {
  /** Error message dari server, jika ada. */
  error?: string;
  /** Default value untuk select. */
  defaultValue: string;
  /** Apakah event di masa lalu (status otomatis "lalu"). */
  isPastEvent: boolean;
};

/**
 * Select status event untuk form admin.
 * Disable jika event sudah lewat.
 */
export function StatusSelect({ error, defaultValue, isPastEvent }: StatusSelectProps) {
  return (
    <div className="flex items-center gap-4 border-t border-gray-200 pt-6">
      <label className="text-sm font-medium text-gray-700">Status Event:</label>
      <select
        name="statusEvent"
        defaultValue={defaultValue}
        disabled={isPastEvent}
        className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-60"
      >
        {isPastEvent ? (
          <option value="lalu">Lalu / Berakhir (Otomatis)</option>
        ) : (
          <>
            <option value="draft">Simpan sebagai Draft</option>
            <option value="aktif">Langsung Tayangkan (Aktif)</option>
          </>
        )}
      </select>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}