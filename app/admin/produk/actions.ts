"use server";

import { requireAdmin } from "@/lib/require-admin";
import { getDb } from "@/lib/db";
import { produk, fotoProduk } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { deleteImageKitFiles } from "@/lib/imagekit";

export type FotoData = {
  idFoto?: number;
  url: string;
  fileId: string;
  urutan: number;
  isPrimary: boolean;
};

export async function getFotoProduk(productId: number): Promise<FotoData[]> {
  const cek = await requireAdmin();
  if (!cek.ok) return [];

  const rows = await getDb()
    .select()
    .from(fotoProduk)
    .where(eq(fotoProduk.productId, productId))
    .orderBy(asc(fotoProduk.urutan));

  return rows.map((r) => ({
    idFoto: r.idFoto,
    url: r.url,
    fileId: r.fileId,
    urutan: r.urutan,
    isPrimary: r.isPrimary,
  }));
}

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
  const berat = formData.get("berat") as string;
  const fotoListRaw = formData.get("fotoList") as string;
  const deletedFileIdsRaw = formData.get("deletedFileIds") as string;

  let fotoList: FotoData[] = [];
  try {
    if (fotoListRaw) {
      fotoList = JSON.parse(fotoListRaw);
    }
  } catch {}

  let deletedFileIds: string[] = [];
  try {
    if (deletedFileIdsRaw) {
      deletedFileIds = JSON.parse(deletedFileIdsRaw);
    }
  } catch {}

  // Hapus file dari ImageKit jika ada yang dihapus saat form dibuka
  if (deletedFileIds.length > 0) {
    await deleteImageKitFiles(deletedFileIds);
  }

  if (!namaProduk?.trim()) {
    return { error: "Nama produk tidak boleh kosong" };
  }

  if (!jenisProduk?.trim()) {
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

  // Tentukan URL foto utama untuk kolom gambarUrl tabel produk
  const primaryFoto = fotoList.find((f) => f.isPrimary) || fotoList[0];
  const gambarUtamaUrl = primaryFoto ? primaryFoto.url : null;

  const [inserted] = await getDb()
    .insert(produk)
    .values({
      namaProduk: namaProduk.trim(),
      jenisProduk: jenisProduk.trim(),
      hargaProduk: hargaProduk || "0",
      jumlahStok: stok,
      deskripsi: deskripsi?.trim() || null,
      gambarUrl: gambarUtamaUrl,
      berat: berat?.trim() || null,
      statusProduk: "aktif",
    })
    .returning({ idProduk: produk.idProduk });

  if (inserted && fotoList.length > 0) {
    await getDb()
      .insert(fotoProduk)
      .values(
        fotoList.map((f, idx) => ({
          productId: inserted.idProduk,
          url: f.url,
          fileId: f.fileId,
          urutan: idx,
          isPrimary:
            f.isPrimary || (idx === 0 && !fotoList.some((x) => x.isPrimary)),
        })),
      );
  }

  revalidatePath("/admin/produk");
  revalidatePath("/store");
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
  const berat = formData.get("berat") as string;
  const fotoListRaw = formData.get("fotoList") as string;
  const deletedFileIdsRaw = formData.get("deletedFileIds") as string;

  const id = Number(idProduk);
  if (!(Number.isInteger(id) && id > 0)) {
    return { error: "ID produk tidak valid" };
  }

  if (!namaProduk?.trim()) {
    return { error: "Nama produk tidak boleh kosong" };
  }

  if (!jenisProduk?.trim()) {
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

  let fotoList: FotoData[] = [];
  try {
    if (fotoListRaw) {
      fotoList = JSON.parse(fotoListRaw);
    }
  } catch {}

  let deletedFileIds: string[] = [];
  try {
    if (deletedFileIdsRaw) {
      deletedFileIds = JSON.parse(deletedFileIdsRaw);
    }
  } catch {}

  // 1. Hapus file di ImageKit jika ada yang dihapus
  if (deletedFileIds.length > 0) {
    await deleteImageKitFiles(deletedFileIds);
  }

  // 2. Tentukan foto utama
  const primaryFoto = fotoList.find((f) => f.isPrimary) || fotoList[0];
  const gambarUtamaUrl = primaryFoto ? primaryFoto.url : null;

  // 3. Update tabel produk
  await getDb()
    .update(produk)
    .set({
      namaProduk: namaProduk.trim(),
      jenisProduk: jenisProduk.trim(),
      hargaProduk: hargaProduk || "0",
      jumlahStok: stok,
      deskripsi: deskripsi?.trim() || null,
      gambarUrl: gambarUtamaUrl,
      berat: berat?.trim() || null,
    })
    .where(eq(produk.idProduk, id));

  // 4. Sinkronisasi tabel fotoProduk
  await getDb().delete(fotoProduk).where(eq(fotoProduk.productId, id));

  if (fotoList.length > 0) {
    await getDb()
      .insert(fotoProduk)
      .values(
        fotoList.map((f, idx) => ({
          productId: id,
          url: f.url,
          fileId: f.fileId,
          urutan: idx,
          isPrimary:
            f.isPrimary || (idx === 0 && !fotoList.some((x) => x.isPrimary)),
        })),
      );
  }

  revalidatePath("/admin/produk");
  revalidatePath("/store");
  revalidatePath(`/store/detail/${id}`);
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

  // 1. Ambil semua fileId dari fotoProduk untuk dihapus di ImageKit
  const photos = await getDb()
    .select({ fileId: fotoProduk.fileId })
    .from(fotoProduk)
    .where(eq(fotoProduk.productId, id));

  const fileIds = photos.map((p) => p.fileId).filter(Boolean);
  if (fileIds.length > 0) {
    await deleteImageKitFiles(fileIds);
  }

  // 2. Hapus produk (foto_produk akan terhapus otomatis via CASCADE di Postgres)
  await getDb().delete(produk).where(eq(produk.idProduk, id));

  revalidatePath("/admin/produk");
  revalidatePath("/store");
  return { success: true };
}
