# hooks

Hook React untuk Client Component yang dipakai **lebih dari satu fitur**. Hook yang hanya dipakai satu fitur ditaruh di folder fitur itu.

## Kapan membuat hook

- Ada logika stateful di Client Component (state, efek, API browser) yang dipakai di beberapa tempat. Contoh: membaca lokasi browser untuk toko terdekat, atau mendeteksi sesi idle.
- **Bukan** untuk mengambil data dari database. Data diambil di Server Component lewat `features/<fitur>/queries/` (`CONTRIBUTING.md` bagian 4.2).
- **Bukan** untuk membungkus satu `useState`. Duplikasi kecil tidak apa-apa.
- Fungsi yang tidak memanggil hook bukan hook. Taruh di `lib/` atau `aturan.ts`, dan jangan beri awalan `use`.

Panduan resmi: [React, Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks).

## Aturan penulisan

- Nama fungsi diawali `use` (`useLokasiBrowser`), nama file huruf kecil dengan tanda hubung (`use-lokasi-browser.ts`).
- Baris pertama `"use client";`.
- Tulis tipe kembalian secara eksplisit.
- Setiap efek membersihkan dirinya (hapus listener, batalkan request) di fungsi cleanup.
- Maksimal 300 baris per file.

## Kerangka

```ts
// hooks/use-lokasi-browser.ts
"use client";

import { useEffect, useState } from "react";

type Lokasi =
  | { keadaan: "memuat" }
  | { keadaan: "ditolak" }
  | { keadaan: "ada"; latitude: number; longitude: number };

export function useLokasiBrowser(): Lokasi {
  const [lokasi, setLokasi] = useState<Lokasi>({ keadaan: "memuat" });

  useEffect(() => {
    let aktif = true;
    navigator.geolocation.getCurrentPosition(
      (posisi) => {
        if (aktif) {
          setLokasi({
            keadaan: "ada",
            latitude: posisi.coords.latitude,
            longitude: posisi.coords.longitude,
          });
        }
      },
      () => {
        if (aktif) {
          setLokasi({ keadaan: "ditolak" });
        }
      },
    );
    return () => {
      aktif = false;
    };
  }, []);

  return lokasi;
}
```
