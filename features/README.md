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
  validasi/<peran>.ts      skema Zod untuk input actions/ atau queries/ yang namanya sama
  components/<nama>.tsx    komponen yang dipakai lebih dari satu halaman fitur ini
```

- Buat hanya file yang memang dibutuhkan.
- `<peran>` adalah `pelanggan`, `admin`, atau nama proses (misalnya `pembayaran`, `jadwal`). Satu file dipegang satu orang supaya jarang konflik.
- Nama file huruf kecil dengan tanda hubung. Nama komponen di dalamnya PascalCase.
- Setiap file kode maksimal 300 baris. Jika mendekati batas, pecah per peran atau per proses.
- Fitur tidak saling impor. Yang dipakai bersama naik ke `lib/`, `components/`, atau `hooks/`.
- Setiap fungsi dan komponen yang di-export diberi komentar `/** … */` singkat, dan alur lebih dari dua langkah diberi komentar langkah bernomor (`CONTRIBUTING.md` bagian 9.9). Kerangka di bawah sudah memakai pola ini.

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

/** Tombol bayar hanya aktif setelah harga disepakati dan diaktifkan admin. */
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

/**
 * Pengajuan langganan milik pelanggan yang sedang login.
 * Mengembalikan null jika belum pernah mengajukan; belum login dialihkan ke halaman login.
 */
export async function getPengajuanSaya(): Promise<RingkasanPengajuan | null> {
  // 1. Pastikan login. idUser diambil dari sesi, bukan dari URL (bagian 7.2).
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");

  // 2. Ambil hanya kolom yang dipakai tampilan.
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

  // 3. Ubah ke bentuk tampilan; status asing berarti data rusak, jadi dilempar.
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

### `validasi/admin.ts`

Skema Zod untuk isian yang diterima `actions/admin.ts`. Tanpa `"use server"` dan tanpa `"server-only"`, jadi form klien boleh memakai skema yang sama untuk cek awal (`CONTRIBUTING.md` bagian 9.8). Zod dipasang lewat PR tersendiri oleh pemilik `package.json`; sebelum PR itu masuk, impor `zod` belum bisa dipakai.

```ts
import { z } from "zod";

const ID_TIDAK_VALID = { error: "Pengajuan tidak valid." };

/** Isian form admin saat mengirim harga penawaran untuk satu pengajuan. */
export const skemaPenawaran = z.object({
  idPengajuan: z.coerce
    .number(ID_TIDAK_VALID)
    .int(ID_TIDAK_VALID)
    .positive(ID_TIDAK_VALID),
  harga: z.coerce
    .number({ error: "Harga harus berupa angka." })
    .positive({ error: "Harga harus lebih dari 0." }),
});

export type InputPenawaran = z.infer<typeof skemaPenawaran>;
```

`idUser`, peran, jumlah yang dibayar, dan status tujuan tidak pernah masuk skema form. Nilai itu diambil dari sesi atau database.

### `actions/admin.ts`

Server Action yang dipanggil dari komponen klien dan hasilnya dibaca. Polanya: cek peran, validasi input dengan skema, ubah data dengan **satu perintah bersyarat**, lalu `revalidatePath`.

```ts
"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pengajuanLangganan } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { skemaPenawaran } from "../validasi/admin";

type HasilAksi = { ok: true } | { ok: false; pesan: string };

/**
 * Admin mengirim harga penawaran untuk satu pengajuan langganan.
 * Hanya admin. Gagal jika isian salah atau status pengajuan sudah berubah.
 */
export async function kirimPenawaran(formData: FormData): Promise<HasilAksi> {
  // 1. Cek sesi admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian form dengan skema (CONTRIBUTING 9.8).
  const hasil = skemaPenawaran.safeParse({
    idPengajuan: formData.get("idPengajuan"),
    harga: formData.get("harga"),
  });
  if (!hasil.success) {
    return {
      ok: false,
      pesan: hasil.error.issues[0]?.message ?? "Isian tidak valid.",
    };
  }
  const { idPengajuan, harga } = hasil.data;

  // 3. Ubah status hanya jika masih menunggu review atau negosiasi (CONTRIBUTING 6.2).
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

  // 4. Segarkan halaman detail supaya admin langsung melihat status baru.
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

/** Halaman langganan pelanggan: form pengajuan, atau status penawaran jika sudah mengajukan. */
export default function HalamanLangganan() {
  return (
    <Suspense fallback={<KerangkaLangganan />}>
      <IsiLangganan />
    </Suspense>
  );
}

// Bagian yang membaca data per pengguna, dirender di dalam <Suspense>.
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

/** Form pengajuan langganan. Pesan gagal dari server ditampilkan di bawah tombol. */
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
