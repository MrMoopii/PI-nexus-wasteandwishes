# Design token

Sumbernya `app/globals.css` dan `app/layout.tsx`. Jika token di sana berubah, perbarui file ini di PR yang sama.

## Warna tema

Didaftarkan ke Tailwind lewat `@theme inline`, jadi bisa dipakai sebagai kelas.

| Variabel CSS         | Nilai     | Kelas Tailwind                           | Keterangan                                    |
| -------------------- | --------- | ---------------------------------------- | --------------------------------------------- |
| `--color-waste`      | `#17afb0` | `bg-waste`, `text-waste`, `border-waste` | Warna utama tema                              |
| `--color-waste-dark` | `#118586` | `bg-waste-dark`, `hover:bg-waste-dark`   | Versi gelap warna utama, misalnya untuk hover |
| `--background`       | `#f4f7fa` | `bg-background`                          | Latar                                         |
| `--foreground`       | `#171717` | `text-foreground`                        | Teks utama                                    |

Komponen umum di `components/ui/` memakai warna `waste` (lihat `components/ui/README.md`).

## Font

Plus Jakarta Sans dimuat lewat `next/font/google` di `app/layout.tsx` dengan variabel `--font-plus-jakarta-sans`, lalu dipetakan ke `font-sans` dan `font-display`. Font ini sudah berlaku untuk seluruh halaman, jadi tidak perlu ditulis ulang di komponen.

## Token Helix Drift (`--hx-*`)

Token ini tidak didaftarkan ke Tailwind, sehingga dipakai lewat `var(--hx-…)`. Saat ini dipakai antara lain di `app/toko/` dan `app/admin/events/`. Latar `html` dan `body` memakai `--hx-canvas`.

| Variabel                          | Nilai                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `--hx-canvas`                     | `#f4f7fa`                                                                     |
| `--hx-sunk`                       | `#dde7f2`                                                                     |
| `--hx-pastel`                     | `#b9cde5`                                                                     |
| `--hx-pastel-deep`                | `#96b1d0`                                                                     |
| `--hx-ink`                        | `#1b2233`                                                                     |
| `--hx-ink-2`                      | `#5b6879`                                                                     |
| `--hx-ink-3`                      | `#93a0b2`                                                                     |
| `--hx-accent`                     | `#17afb0` (sama dengan `waste`)                                               |
| `--hx-accent-dark`                | `#118586` (sama dengan `waste-dark`)                                          |
| `--hx-ease`                       | `cubic-bezier(0.22, 1, 0.36, 1)`                                              |
| `--hx-rx`, `--hx-ry`, `--hx-fall` | `600`, `54`, `0.52`, dibaca animasi `components/event-slider/EventSlider.tsx` |
