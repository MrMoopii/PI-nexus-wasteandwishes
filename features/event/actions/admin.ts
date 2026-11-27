"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { deleteImageKitFile } from "@/lib/imagekit";
import { requireAdmin } from "@/lib/require-admin";
import { statusAkhirEvent } from "../aturan";
import {
  skemaEvent,
  skemaIdEvent,
  type GalatIsianEvent,
  type NilaiIsianEvent,
} from "../validasi/admin";

// Aksi admin event (kode tugas 3.3): tambah dan ubah event.
// Dipanggil lewat useActionState dari form klien di app/admin/events/_components/.

/** Hasil aksi admin untuk useActionState; pesan per isian dan isian yang diketik
 *  dikembalikan ke form saat gagal. */
export type HasilAksiEvent =
  | { ok: true; pesan: string }
  | {
      ok: false;
      pesan: string;
      galat?: GalatIsianEvent;
      nilai?: NilaiIsianEvent;
    };

const ISIAN_EVENT: (keyof NilaiIsianEvent)[] = [
  "namaEvent",
  "jenisEvent",
  "penyelenggara",
  "peranWw",
  "tautanInfo",
  "tanggalPelaksanaan",
  "waktuMulai",
  "waktuSelesai",
  "lokasi",
  "statusEvent",
  "gambarUrl",
  "gambarFileId",
  "deletedPosterFileId",
];

/** Teks isian form event apa adanya, hanya untuk dikembalikan ke form saat gagal. */
function nilaiIsian(formData: FormData): NilaiIsianEvent {
  const teks = (nama: string) => {
    const isian = formData.get(nama);
    return typeof isian === "string" ? isian : undefined;
  };
  const nilai: NilaiIsianEvent = {};
  for (const nama of ISIAN_EVENT) {
    nilai[nama] = teks(nama);
  }
  return nilai;
}

/** Hasil gagal form event dengan pesan per isian. */
function isianSalah(
  galat: GalatIsianEvent,
  nilai: NilaiIsianEvent,
): HasilAksiEvent {
  return {
    ok: false,
    pesan: "Periksa kembali isian yang ditandai.",
    galat,
    nilai,
  };
}

/** Segarkan halaman admin dan halaman publik yang menampilkan event ini. */
function segarkanHalaman(idEvent: number): void {
  revalidatePath(`/admin/events/edit/${idEvent}`);
  revalidatePath("/admin/events");
  revalidatePath("/event");
}

// 1. Pengecekan status akhir berdasarkan waktu, dipakai tambah dan ubah.
//    Jika event sudah lewat, status menjadi "lalu" walaupun admin pilih "aktif".

/**
 * Admin menambah event baru.
 * Hanya admin; gagal jika isian salah.
 * kuota_peserta dan biaya_event tidak ditulis, jadi nilai default database
 * tetap (0 dan "0").
 */
export async function tambahEvent(
  _sebelumnya: HasilAksiEvent | null,
  formData: FormData,
): Promise<HasilAksiEvent> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi isian (CONTRIBUTING 9.8); teks yang diketik ikut dikembalikan.
  const nilai = nilaiIsian(formData);
  const hasil = skemaEvent.safeParse(nilai);
  if (!hasil.success) {
    return isianSalah(z.flattenError(hasil.error).fieldErrors, nilai);
  }
  const data = hasil.data;

  // 3. Bersihkan poster lama yang diganti/dihapus sebelum form disimpan.
  if (data.deletedPosterFileId) {
    await deleteImageKitFile(data.deletedPosterFileId);
  }

  // 4. Hitung status akhir berdasarkan waktu (sama dengan logika lama).
  const finalStatus = statusAkhirEvent(
    data.statusEvent,
    data.tanggalPelaksanaan,
    data.waktuSelesai,
  );

  // 5. Simpan event baru. kuota_peserta dan biaya_event tidak di-set,
  //    jadi tetap default (0 dan "0").
  const [baru] = await getDb()
    .insert(events)
    .values({
      namaEvent: data.namaEvent,
      jenisEvent: data.jenisEvent,
      penyelenggara: data.penyelenggara,
      peranWw: data.peranWw,
      tautanInfo: data.tautanInfo,
      tanggalPelaksanaan: data.tanggalPelaksanaan,
      waktuMulai: data.waktuMulai,
      waktuSelesai: data.waktuSelesai,
      lokasi: data.lokasi,
      statusEvent: finalStatus,
      gambarUrl: data.gambarUrl,
      gambarFileId: data.gambarFileId,
    })
    .returning({ idEvent: events.idEvent });

  if (!baru) {
    return { ok: false, pesan: "Gagal menyimpan event. Silakan coba lagi." };
  }

  // 6. Segarkan halaman admin dan publik.
  segarkanHalaman(baru.idEvent);
  return { ok: true, pesan: "Event berhasil disimpan." };
}

/**
 * Admin mengubah event yang sudah ada.
 * Hanya admin; gagal jika isian salah atau event sudah tidak ada.
 * kuota_peserta dan biaya_event tidak ditulis, jadi nilai lama di database
 * tetap utuh.
 */
export async function ubahEvent(
  _sebelumnya: HasilAksiEvent | null,
  formData: FormData,
): Promise<HasilAksiEvent> {
  // 1. Cek admin sebelum membaca isian apa pun (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) return { ok: false, pesan: cek.pesan };

  // 2. Validasi ID event dari form (hidden input, bukan dari URL).
  const id = skemaIdEvent.safeParse({
    idEvent: formData.get("idEvent"),
  });
  if (!id.success) {
    return {
      ok: false,
      pesan: id.error.issues[0]?.message ?? "Event tidak valid.",
    };
  }
  const { idEvent } = id.data;

  // 3. Validasi isian form (CONTRIBUTING 9.8).
  const nilai = nilaiIsian(formData);
  const hasil = skemaEvent.safeParse(nilai);
  if (!hasil.success) {
    return isianSalah(z.flattenError(hasil.error).fieldErrors, nilai);
  }
  const data = hasil.data;

  // 4. Bersihkan poster lama yang diganti/dihapus sebelum menyimpan.
  if (data.deletedPosterFileId) {
    await deleteImageKitFile(data.deletedPosterFileId);
  }

  // 5. Hitung status akhir berdasarkan waktu.
  const finalStatus = statusAkhirEvent(
    data.statusEvent,
    data.tanggalPelaksanaan,
    data.waktuSelesai,
  );

  // 6. Ubah event. kuota_peserta dan biaya_event tidak di-set.
  const [diubah] = await getDb()
    .update(events)
    .set({
      namaEvent: data.namaEvent,
      jenisEvent: data.jenisEvent,
      penyelenggara: data.penyelenggara,
      peranWw: data.peranWw,
      tautanInfo: data.tautanInfo,
      tanggalPelaksanaan: data.tanggalPelaksanaan,
      waktuMulai: data.waktuMulai,
      waktuSelesai: data.waktuSelesai,
      lokasi: data.lokasi,
      statusEvent: finalStatus,
      gambarUrl: data.gambarUrl,
      gambarFileId: data.gambarFileId,
    })
    .where(eq(events.idEvent, idEvent))
    .returning({ idEvent: events.idEvent });

  if (!diubah) {
    return { ok: false, pesan: "Event tidak ditemukan atau sudah dihapus." };
  }

  // 7. Segarkan halaman admin dan publik.
  segarkanHalaman(idEvent);
  return { ok: true, pesan: "Perubahan event disimpan." };
}
