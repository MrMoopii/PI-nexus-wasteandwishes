# components/ui

Komponen tampilan umum yang dipakai lintas fitur: tombol, badge, kartu, isian form, dan pesan. Aturan lengkapnya ada di `CONTRIBUTING.md` bagian 4.

## Aturan

- **Tanpa logika bisnis.** Komponen di sini tidak tahu apa pun soal langganan, event, atau tabel database. Semua data masuk lewat props.
- **Tidak memanggil database, `auth()`, atau `fetch`.**
- **Tanpa `"use client"`**, kecuali komponen itu sendiri memakai state atau event handler internal. Komponen tanpa `"use client"` bisa dipakai di Server Component maupun Client Component.
- **Props bertipe jelas.** Untuk elemen HTML, perluas tipe bawaannya (`ButtonHTMLAttributes`, `InputHTMLAttributes`) supaya atribut seperti `disabled` dan `aria-*` tetap bisa dipakai.
- **Gaya mengikuti tampilan yang sudah ada.** Pakai Tailwind dengan warna tema `waste` (`bg-waste`, `text-waste`, `hover:bg-waste-dark`) dari `app/globals.css`. Font sudah diatur di `body`, jadi tidak perlu ditulis ulang.
- **Satu komponen utama per file**, nama file huruf kecil dengan tanda hubung (`button.tsx`), nama komponen PascalCase (`Button`), dan maksimal 300 baris.
- **Setiap komponen yang di-export diberi komentar singkat** dengan format `/** … */` tentang kegunaannya dan perilaku bawaan yang perlu diketahui pemakainya (`CONTRIBUTING.md` bagian 9.9).
- Sebelum membuat komponen baru, cek dulu yang sudah ada di folder ini dan di tabel `CONTRIBUTING.md` bagian 9.1.

## Kerangka

```tsx
// components/ui/button.tsx
import type { ButtonHTMLAttributes } from "react";

type Varian = "utama" | "garis";

const KELAS_VARIAN: Record<Varian, string> = {
  utama: "bg-waste text-white hover:bg-waste-dark",
  garis: "border border-waste text-waste hover:bg-waste/10",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  varian?: Varian;
};

/** Tombol umum bergaya tema waste. Bawaan type="button" supaya tidak mengirim form tanpa sengaja. */
export function Button({
  varian = "utama",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${KELAS_VARIAN[varian]} ${className}`}
      {...props}
    />
  );
}
```

## Daftar komponen

Perbarui tabel ini setiap kali menambah atau mengubah komponen di folder ini (`CONTRIBUTING.md` bagian 4.6).

| Komponen | File         | Varian / props penting                                              | Perilaku bawaan                                                                                          |
| -------- | ------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Button` | `button.tsx` | `varian`: `utama` (bawaan), `garis`. Semua atribut `<button>`       | `type="button"` supaya tidak mengirim form tanpa sengaja. Untuk tombol kirim, tulis `type="submit"`      |
| `Badge`  | `badge.tsx`  | `varian`: `netral` (bawaan), `sukses`, `peringatan`, `bahaya`       | Label kecil berbentuk pil. Pemetaan status ke varian dilakukan pemanggil                                 |
| `Card`   | `card.tsx`   | Semua atribut `<div>`                                               | Wadah dengan border, latar putih, sudut membulat                                                         |
| `Field`  | `field.tsx`  | `label`, `error`, satu elemen isian sebagai `children`              | Memasang `id`, `htmlFor`, `aria-invalid`, dan `aria-describedby` ke isian. Pesan `error` tampil di bawah |
| `Alert`  | `alert.tsx`  | `varian`: `info` (bawaan), `sukses`, `gagal`. Semua atribut `<div>` | `role="alert"` untuk `gagal`, `role="status"` untuk varian lain                                          |

Format harga Rupiah ada di `formatRupiah()` (`lib/format-angka.ts`), bukan di folder ini.
