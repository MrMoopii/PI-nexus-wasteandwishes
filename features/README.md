# features/

Folder ini berisi logika per fitur: membaca data, mengubah data, aturan bisnis, dan komponen yang dipakai beberapa halaman dalam satu fitur. Aturan lengkapnya ada di `CONTRIBUTING.md` bagian 4. File ini berisi **kerangka setiap jenis file**, supaya semua anggota dan AI agent-nya menulis dengan pola yang sama.

Peta file untuk fitur yang sedang dibangun ada di `README.md` masing-masing folder fitur (misalnya `features/langganan/README.md`).

## Susunan satu fitur

```text
features/<fitur>/
  README.md                peta file fitur ini dan kode tugasnya
  types.ts                 tipe status dan bentuk data untuk tampilan
  aturan.ts                fungsi murni: tanpa database, tanpa sesi
  queries/<peran>.ts       membaca data; baris pertama import "server-only"
  actions/<peran>.ts       Server Action; baris pertama "use server"
  components/<nama>.tsx    komponen yang dipakai lebih dari satu halaman fitur ini
```

- Buat hanya file yang memang dibutuhkan.
- `<peran>` adalah `pelanggan`, `admin`, atau nama proses (misalnya `pembayaran`, `jadwal`). Satu file dipegang satu orang supaya jarang konflik.
- Nama file huruf kecil dengan tanda hubung. Nama komponen di dalamnya PascalCase.
- Setiap file kode maksimal 300 baris. Jika mendekati batas, pecah per peran atau per proses.
- Fitur tidak saling impor. Yang dipakai bersama naik ke `lib/`, `components/`, atau `hooks/`.

## Kerangka

Nama tabel dan kolom di bawah hanya ilustrasi alur langganan. Pakai nama yang sebenarnya dari `lib/db/schema.ts`.

### `types.ts`

```ts
// Daftar status ditulis sekali, lalu tipenya diturunkan dari daftar itu.
export const STATUS_PENGAJUAN = [
  "menunggu_review",
  "ditawarkan",
  "negosiasi",
  "disetujui_pelanggan",
  "siap_bayar",
  "ditolak",
  "dibatalkan",
] as const;

export type StatusPengajuan = (typeof STATUS_PENGAJUAN)[number];

// Pemeriksa tipe tanpa "as": nilai dari database bertipe string.
export function isStatusPengajuan(nilai: string): nilai is StatusPengajuan {
  return STATUS_PENGAJUAN.some((status) => status === nilai);
}

// Bentuk data untuk tampilan: hanya kolom yang dipakai, angka sudah berupa number.
export type RingkasanPengajuan = {
  idPengajuan: number;
  namaInstansi: string;
  status: StatusPengajuan;
  hargaFinal: number | null;
};
```

### `aturan.ts`

Fungsi murni: menerima nilai, mengembalikan nilai. Tidak memanggil database, `auth()`, atau `fetch`, sehingga mudah diuji dan dipakai di server maupun klien.

```ts
import type { StatusPengajuan } from "./types";

export function bolehBayar(status: StatusPengajuan): boolean {
  return status === "siap_bayar";
}
```

### `queries/pelanggan.ts`

Membaca data untuk Server Component. Cek sesi dan kepemilikan dilakukan di sini (Data Access Layer), dan yang dikembalikan hanya kolom yang dibutuhkan tampilan.

```ts
import "server-only";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pengajuanLangganan } from "@/lib/db/schema";
import { requireLogin } from "@/lib/require-login";
import { isStatusPengajuan, type RingkasanPengajuan } from "../types";

export async function getPengajuanSaya(): Promise<RingkasanPengajuan | null> {
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");

  const [baris] = await getDb()
    .select({
      idPengajuan: pengajuanLangganan.idPengajuan,
      namaInstansi: pengajuanLangganan.namaInstansi,
      status: pengajuanLangganan.status,
      hargaFinal: pengajuanLangganan.hargaFinal,
    })
    .from(pengajuanLangganan)
    .where(eq(pengajuanLangganan.idUser, cek.idUser))
    .limit(1);

  if (!baris) return null;
  if (!isStatusPengajuan(baris.status)) {
    throw new Error(`Status pengajuan tidak dikenal: ${baris.status}`);
  }

  return {
    ...baris,
    status: baris.status,
    // Kolom numeric dikembalikan sebagai string (CONTRIBUTING 9.2).
    hargaFinal: baris.hargaFinal === null ? null : Number(baris.hargaFinal),
  };
}
```

Untuk admin, ganti `requireLogin()` dengan `requireAdmin()`, lalu `redirect(cek.status === 401 ? "/auth/login" : "/")`.

### `actions/admin.ts`

Server Action yang dipanggil dari komponen klien dan hasilnya dibaca. Polanya: cek peran, validasi input, ubah data dengan **satu perintah bersyarat**, lalu `revalidatePath`.

```ts
"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pengajuanLangganan } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";

type HasilAksi = { ok: true } | { ok: false; pesan: string };

export async function kirimPenawaran(formData: FormData): Promise<HasilAksi> {
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  const idPengajuan = Number(formData.get("idPengajuan"));
  const harga = Number(formData.get("harga"));
  if (!(Number.isInteger(idPengajuan) && idPengajuan > 0)) {
    return { ok: false, pesan: "Pengajuan tidak valid." };
  }
  if (!(Number.isFinite(harga) && harga > 0)) {
    return { ok: false, pesan: "Harga harus lebih dari 0." };
  }

  // Hanya berubah jika status asalnya diizinkan (CONTRIBUTING 6.2).
  const [berubah] = await getDb()
    .update(pengajuanLangganan)
    .set({ status: "ditawarkan", hargaFinal: String(harga) })
    .where(
      and(
        eq(pengajuanLangganan.idPengajuan, idPengajuan),
        inArray(pengajuanLangganan.status, ["menunggu_review", "negosiasi"]),
      ),
    )
    .returning({ idPengajuan: pengajuanLangganan.idPengajuan });

  if (!berubah) {
    return {
      ok: false,
      pesan: "Status pengajuan sudah berubah. Muat ulang halaman.",
    };
  }

  revalidatePath(`/admin/langganan/${idPengajuan}`);
  return { ok: true };
}
```

Server Action yang dipasang langsung di `<form action={…}>` tanpa membaca hasil memakai `redirect()` saat gagal, bukan `return` objek (CONTRIBUTING 7.2 no. 1).

### Halaman di `app/` yang memakai fitur

`page.tsx` tipis: data runtime ada di komponen anak di bawah `<Suspense>`, dengan fallback setinggi isi aslinya (CONTRIBUTING bagian 8).

```tsx
// app/langganan/page.tsx
import { Suspense } from "react";
import { connection } from "next/server";
import { getPengajuanSaya } from "@/features/langganan/queries/pelanggan";
import { KartuPenawaran } from "@/features/langganan/components/kartu-penawaran";
import { FormPengajuan } from "./_components/form-pengajuan";
import { KerangkaLangganan } from "./_components/kerangka-langganan";

export default function HalamanLangganan() {
  return (
    <Suspense fallback={<KerangkaLangganan />}>
      <IsiLangganan />
    </Suspense>
  );
}

async function IsiLangganan() {
  await connection();
  const pengajuan = await getPengajuanSaya();

  if (!pengajuan) return <FormPengajuan />;
  return <KartuPenawaran pengajuan={pengajuan} />;
}
```

### Komponen klien yang memanggil Server Action

`"use client"` hanya di komponen kecil yang interaktif. Data masuk lewat props, perubahan lewat Server Action.

```tsx
// app/langganan/_components/form-pengajuan.tsx
"use client";

import { useState, useTransition } from "react";
import { kirimPengajuan } from "@/features/langganan/actions/pelanggan";
import { Button } from "@/components/ui/button";

export function FormPengajuan() {
  const [pesan, setPesan] = useState<string | null>(null);
  const [sedangMengirim, startTransition] = useTransition();

  function kirim(formData: FormData) {
    startTransition(async () => {
      const hasil = await kirimPengajuan(formData);
      setPesan(hasil.ok ? null : hasil.pesan);
    });
  }

  return (
    <form action={kirim} className="space-y-4">
      {/* isian form */}
      <Button type="submit" disabled={sedangMengirim}>
        {sedangMengirim ? "Mengirim…" : "Kirim pengajuan"}
      </Button>
      {pesan && <p role="alert">{pesan}</p>}
    </form>
  );
}
```
