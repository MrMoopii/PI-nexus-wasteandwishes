"use server";

import { requireAdmin } from "@/lib/require-admin";
import { getDb } from "@/lib/db";
import { produk } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function tambahProduk(formData: FormData) {
  const cek = await requireAdmin();
  if (!cek.ok) {
    return { error: cek.pesan };
  }

  const namaProduk = formData.get("namaProduk") as string;
  const jenisProduk = formData.get("jenisProduk") as string;
  const hargaProduk = formData.get("hargaProduk") as string;
  const jumlahStok = formData.get("jumlahStok") as string;
  const deskripsi = formData.get("deskripsi") as string;
  const gambarUrl = formData.get("gambarUrl") as string;
  const berat = formData.get("berat") as string;

  // Normalisasi path gambar: pastikan dimulai dengan / dan gunakan forward slash
  let normalizedGambarUrl = gambarUrl.trim();
  if (normalizedGambarUrl) {
    // Ganti backslash dengan forward slash
    normalizedGambarUrl = normalizedGambarUrl.replace(/\\/g, "/");
    // Pastikan dimulai dengan /
    if (!normalizedGambarUrl.startsWith("/") && !normalizedGambarUrl.startsWith("http")) {
      normalizedGambarUrl = "/" + normalizedGambarUrl;
    }
  }

  if (!namaProduk.trim()) {
    return { error: "Nama produk tidak boleh kosong" };
  }

  if (!jenisProduk.trim()) {
    return { error: "Jenis produk tidak boleh kosong" };
  }

  const harga = Number(hargaProduk);
  if (!(Number.isInteger(harga) && harga > 0)) {
    return { error: "Harga harus berupa angka positif" };
  }

  const stok = Number(jumlahStok);
  if (!(Number.isInteger(stok) && stok >= 0)) {
    return { error: "Stok harus berupa angka tidak negatif" };
  }

  await getDb().insert(produk).values({
    namaProduk,
    jenisProduk,
    hargaProduk: hargaProduk || "0",
    jumlahStok: stok,
    deskripsi: deskripsi || null,
    gambarUrl: normalizedGambarUrl || null,
    berat: berat || null,
    statusProduk: "aktif",
  });

  revalidatePath("/admin/produk");
  return { success: true };
}

export async function updateProduk(formData: FormData) {
  const cek = await requireAdmin();
  if (!cek.ok) {
    return { error: cek.pesan };
  }

  const idProduk = formData.get("idProduk") as string;
  const namaProduk = formData.get("namaProduk") as string;
  const jenisProduk = formData.get("jenisProduk") as string;
  const hargaProduk = formData.get("hargaProduk") as string;
  const jumlahStok = formData.get("jumlahStok") as string;
  const deskripsi = formData.get("deskripsi") as string;
  const gambarUrl = formData.get("gambarUrl") as string;
  const berat = formData.get("berat") as string;

  // Normalisasi path gambar: pastikan dimulai dengan / dan gunakan forward slash
  let normalizedGambarUrl = gambarUrl.trim();
  if (normalizedGambarUrl) {
    normalizedGambarUrl = normalizedGambarUrl.replace(/\\/g, "/");
    if (!normalizedGambarUrl.startsWith("/") && !normalizedGambarUrl.startsWith("http")) {
      normalizedGambarUrl = "/" + normalizedGambarUrl;
    }
  }

  const id = Number(idProduk);
  if (!(Number.isInteger(id) && id > 0)) {
    return { error: "ID produk tidak valid" };
  }

  if (!namaProduk.trim()) {
    return { error: "Nama produk tidak boleh kosong" };
  }

  if (!jenisProduk.trim()) {
    return { error: "Jenis produk tidak boleh kosong" };
  }

  const harga = Number(hargaProduk);
  if (!(Number.isInteger(harga) && harga > 0)) {
    return { error: "Harga harus berupa angka positif" };
  }

  const stok = Number(jumlahStok);
  if (!(Number.isInteger(stok) && stok >= 0)) {
    return { error: "Stok harus berupa angka tidak negatif" };
  }

  await getDb()
    .update(produk)
    .set({
      namaProduk,
      jenisProduk,
      hargaProduk: hargaProduk || "0",
      jumlahStok: stok,
      deskripsi: deskripsi || null,
      gambarUrl: normalizedGambarUrl || null,
      berat: berat || null,
    })
    .where(eq(produk.idProduk, id));

  revalidatePath("/admin/produk");
  return { success: true };
}

export async function hapusProduk(formData: FormData) {
  const cek = await requireAdmin();
  if (!cek.ok) {
    return { error: cek.pesan };
  }

  const idProduk = formData.get("idProduk") as string;

  const id = Number(idProduk);
  if (!(Number.isInteger(id) && id > 0)) {
    return { error: "ID produk tidak valid" };
  }

  await getDb().delete(produk).where(eq(produk.idProduk, id));

  revalidatePath("/admin/produk");
  return { success: true };
}
