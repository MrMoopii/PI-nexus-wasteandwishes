import { Children, cloneElement, useId, isValidElement, type HTMLAttributes, type ReactNode } from "react";

type FieldProps = {
  /** Label teks di atas isian. */
  label: string;
  /** Elemen input, select, atau textarea. */
  children: ReactNode;
  /** Pesan error jika isian tidak valid. */
  error?: string;
  /** Gaya tambahan untuk pembungkus terluar. */
  className?: string;
};

/**
 * Komponen pembungkus form yang menghubungkan label, isian, dan pesan error.
 * Otomatis memberikan id, htmlFor, aria-invalid, dan aria-describedby.
 */
export function Field({ label, children, error, className = "" }: FieldProps) {
  const idBawaan = useId();
  const idError = `${idBawaan}-error`;

  // 1. Ambil anak pertama dan pastikan itu elemen React yang bisa di-clone.
  //    isValidElement sebagai type guard (bukan as) agar TypeScript masih mengecek tipe.
  const anak = Children.only(children);
  if (!isValidElement<HTMLAttributes<unknown>>(anak)) {
    throw new Error("Anak komponen harus merupakan elemen React yang valid.");
  }

  // 2. Gunakan ID dari props anak jika ada, kalau tidak pakai idBawaan.
  const id = anak.props.id || idBawaan;

  // 3. Clone anak untuk menyuntikkan atribut aksesibilitas.
  const isian = cloneElement(
    anak,
    { id, "aria-invalid": !!error, "aria-describedby": error ? idError : undefined }
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <label htmlFor={id} className="text-sm font-medium text-waste">
        {label}
      </label>

      {isian}

      {error && (
        <p id={idError} className="text-xs text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
