"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { detailKeranjang, keranjang, produk } from "@/lib/db/schema";
import { requireLogin } from "@/lib/require-login";

export type ItemKeranjang = {
  id: number;
  nama: string;
  harga: number;
  jenis: string;
  gambarUrl: string | null;
  jumlah: number;
  stok: number;
  berat: string | null;
};

type HasilGagal = {
  ok: false;
  error: string;
  status: 400 | 401 | 404 | 409;
};

type HasilBerhasil = {
  ok: true;
  item?: ItemKeranjang;
};

export type HasilKeranjang =
  | { ok: true; items: ItemKeranjang[] }
  | HasilGagal;

export type HasilAksiKeranjang = HasilGagal | HasilBerhasil;

async function cariKeranjang(idUser: number): Promise<number | null> {
  const [hasil] = await getDb()
    .select({ idKeranjang: keranjang.idKeranjang })
    .from(keranjang)
    .where(eq(keranjang.userId, idUser))
    .limit(1);

  return hasil?.idKeranjang ?? null;
}

async function buatAtauAmbilKeranjang(idUser: number): Promise<number> {
  const idLama = await cariKeranjang(idUser);
  if (idLama !== null) return idLama;

  await getDb()
    .insert(keranjang)
    .values({ userId: idUser })
    .onConflictDoNothing({ target: keranjang.userId });

  const idBaru = await cariKeranjang(idUser);
  if (idBaru === null) {
    throw new Error("Keranjang pengguna tidak dapat dibuat.");
  }

  return idBaru;
}

export async function ambilKeranjang(): Promise<HasilKeranjang> {
  const cek = await requireLogin();
  if (!cek.ok) {
    return { ok: false, error: cek.pesan, status: cek.status };
  }

  const idKeranjang = await cariKeranjang(cek.idUser);
  if (idKeranjang === null) return { ok: true, items: [] };

  const items = await getDb()
    .select({
      id: produk.idProduk,
      nama: produk.namaProduk,
      harga: produk.hargaProduk,
      jenis: produk.jenisProduk,
      gambarUrl: produk.gambarUrl,
      jumlah: detailKeranjang.jumlahProduk,
      stok: produk.jumlahStok,
      berat: produk.berat,
    })
    .from(detailKeranjang)
    .innerJoin(produk, eq(detailKeranjang.produkId, produk.idProduk))
    .where(eq(detailKeranjang.keranjangId, idKeranjang));

  return {
    ok: true,
    items: items.map((item) => ({ ...item, harga: Number(item.harga) })),
  };
}

export async function tambahKeKeranjang(input: {
  produkId: number;
  jumlah: number;
}): Promise<HasilAksiKeranjang> {
  const cek = await requireLogin();
  if (!cek.ok) {
    return { ok: false, error: cek.pesan, status: cek.status };
  }

  if (
    !(Number.isInteger(input.produkId) && input.produkId > 0) ||
    !(Number.isInteger(input.jumlah) && input.jumlah > 0)
  ) {
    return { ok: false, error: "Produk atau jumlah tidak valid.", status: 400 };
  }

  const [produkDipilih] = await getDb()
    .select({
      id: produk.idProduk,
      nama: produk.namaProduk,
      harga: produk.hargaProduk,
      jenis: produk.jenisProduk,
      gambarUrl: produk.gambarUrl,
      stok: produk.jumlahStok,
      berat: produk.berat,
      status: produk.statusProduk,
    })
    .from(produk)
    .where(eq(produk.idProduk, input.produkId))
    .limit(1);

  if (!produkDipilih || produkDipilih.status !== "aktif") {
    return { ok: false, error: "Produk tidak ditemukan.", status: 404 };
  }

  if (produkDipilih.stok < input.jumlah) {
    return { ok: false, error: "Jumlah melebihi stok yang tersedia.", status: 409 };
  }

  const idKeranjang = await buatAtauAmbilKeranjang(cek.idUser);
  const itemLama = await getDb()
    .select({ jumlah: detailKeranjang.jumlahProduk })
    .from(detailKeranjang)
    .where(
      and(
        eq(detailKeranjang.keranjangId, idKeranjang),
        eq(detailKeranjang.produkId, input.produkId),
      ),
    )
    .limit(1);
  const jumlahBaru = (itemLama[0]?.jumlah ?? 0) + input.jumlah;

  if (jumlahBaru > produkDipilih.stok) {
    return { ok: false, error: "Jumlah melebihi stok yang tersedia.", status: 409 };
  }

  if (itemLama.length > 0) {
    await getDb()
      .update(detailKeranjang)
      .set({ jumlahProduk: jumlahBaru })
      .where(
        and(
          eq(detailKeranjang.keranjangId, idKeranjang),
          eq(detailKeranjang.produkId, input.produkId),
        ),
      );
  } else {
    await getDb().insert(detailKeranjang).values({
      keranjangId: idKeranjang,
      produkId: input.produkId,
      jumlahProduk: input.jumlah,
    });
  }

  revalidatePath("/store/keranjang");
  return {
    ok: true,
    item: {
      id: produkDipilih.id,
      nama: produkDipilih.nama,
      harga: Number(produkDipilih.harga),
      jenis: produkDipilih.jenis,
      gambarUrl: produkDipilih.gambarUrl,
      jumlah: jumlahBaru,
      stok: produkDipilih.stok,
      berat: produkDipilih.berat,
    },
  };
}

export async function ubahJumlahKeranjang(
  produkId: number,
  jumlah: number,
): Promise<HasilAksiKeranjang> {
  const cek = await requireLogin();
  if (!cek.ok) {
    return { ok: false, error: cek.pesan, status: cek.status };
  }

  if (
    !(Number.isInteger(produkId) && produkId > 0) ||
    !(Number.isInteger(jumlah) && jumlah > 0)
  ) {
    return { ok: false, error: "Produk atau jumlah tidak valid.", status: 400 };
  }

  const idKeranjang = await cariKeranjang(cek.idUser);
  if (idKeranjang === null) {
    return { ok: false, error: "Produk tidak ada di keranjang.", status: 404 };
  }

  const [produkDipilih] = await getDb()
    .select({ id: produk.idProduk, stok: produk.jumlahStok, status: produk.statusProduk })
    .from(produk)
    .where(eq(produk.idProduk, produkId))
    .limit(1);

  if (!produkDipilih || produkDipilih.status !== "aktif") {
    return { ok: false, error: "Produk tidak ditemukan.", status: 404 };
  }
  if (jumlah > produkDipilih.stok) {
    return { ok: false, error: "Jumlah melebihi stok yang tersedia.", status: 409 };
  }

  const hasil = await getDb()
    .update(detailKeranjang)
    .set({ jumlahProduk: jumlah })
    .where(
      and(
        eq(detailKeranjang.keranjangId, idKeranjang),
        eq(detailKeranjang.produkId, produkId),
      ),
    )
    .returning({ produkId: detailKeranjang.produkId });

  if (hasil.length === 0) {
    return { ok: false, error: "Produk tidak ada di keranjang.", status: 404 };
  }

  revalidatePath("/store/keranjang");
  return { ok: true };
}

export async function hapusDariKeranjang(
  produkId: number,
): Promise<HasilAksiKeranjang> {
  const cek = await requireLogin();
  if (!cek.ok) {
    return { ok: false, error: cek.pesan, status: cek.status };
  }

  if (!(Number.isInteger(produkId) && produkId > 0)) {
    return { ok: false, error: "ID produk tidak valid.", status: 400 };
  }

  const idKeranjang = await cariKeranjang(cek.idUser);
  if (idKeranjang === null) return { ok: true };

  await getDb()
    .delete(detailKeranjang)
    .where(
      and(
        eq(detailKeranjang.keranjangId, idKeranjang),
        eq(detailKeranjang.produkId, produkId),
      ),
    );

  revalidatePath("/store/keranjang");
  return { ok: true };
}
