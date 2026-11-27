"use client";

import { Field } from "@/components/ui/field";
import type { IsianEvent } from "@/features/event/validasi/admin";

const KELAS_ISIAN =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-(--hx-accent) focus:outline-none focus:ring-1 focus:ring-(--hx-accent) aria-invalid:border-red-500";

type InputEventProps = {
  /** Nama isian form (sama dengan atribut name di input). */
  nama: IsianEvent;
  /** Label isian yang ditampilkan kepada user. */
  label: string;
  /** Error message dari server, jika ada. */
  error?: string;
  /** Value default untuk edit, atau string kosong untuk tambah. */
  defaultValue?: string;
  /** Apakah field wajib diisi. */
  required?: boolean;
  /** Tipe input HTML (text, date, time, url, dsb). */
  tipe?: "text" | "date" | "time" | "url" | "number";
  /** Maksimal panjang karakter. */
  maxLength?: number;
  /** Placeholder contoh isian. */
  placeholder?: string;
  /** Kelas CSS tambahan untuk wrapper. */
  className?: string;
};

/**
 * Input field standar untuk form event admin.
 * Menggunakan komponen Field UI utama untuk label, error, dan accessibility.
 */
export function InputEvent({
  nama,
  label,
  error,
  defaultValue = "",
  required = true,
  tipe = "text",
  maxLength,
  placeholder,
  className,
}: InputEventProps) {
  return (
    <Field label={label} error={error} className={className}>
      <input
        type={tipe}
        name={nama}
        required={required}
        maxLength={maxLength}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={KELAS_ISIAN}
      />
    </Field>
  );
}