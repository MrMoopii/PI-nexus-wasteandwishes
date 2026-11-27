import "server-only";

import { redirect } from "next/navigation";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lt,
  ne,
  sql,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  dataLangganan,
  kunjunganPengambilan,
  pengajuanLangganan,
} from "@/lib/db/schema";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { kondisiLanggananAktif } from "@/lib/langganan";
import { requireLogin } from "@/lib/require-login";
import { batasMintaLewati, bolehMintaLewati } from "../jadwal";
import {
  isStatusKunjungan,
  type DataTracker,
  type KunjunganTracker,
  type PilihanKunjungan,
  type StatusKunjungan,
} from "../types";
import { bacaPemberitahuan } from "./pemberitahuan";

// Query tracker pelanggan (kode tugas 2.4). Batas tampilan disepakati di 2.4 dan
// dicatat di README fitur: 20 jadwal mendatang dan 20 riwayat terakhir. Total
// ember dan kg tetap dihitung dari seluruh riwayat.
const BATAS_MENDATANG = 20;
const BATAS_RIWAYAT = 20;

// Status yang jumlah embernya sudah dicatat admin (CHECK kunjungan_pengambilan_ember_tercatat).
const STATUS_BERISI_EMBER: StatusKunjungan[] = ["diambil", "ditimbang"];

const k = kunjunganPengambilan;

// Kolom kunjungan yang boleh dilihat pelanggan (CONTRIBUTING 7.2 no. 7).
const KOLOM_KUNJUNGAN = {
  idKunjungan: k.idKunjungan,
  tanggal: k.tanggal,
  // Nomor hari ISO dihitung Postgres, sama dengan CHECK tanggal_hari_kerja (1 = Senin).
  hari: sql<number>`extract(isodow from ${k.tanggal})::int`.mapWith(Number),
  jamMulai: k.jamMulai,
  jamSelesai: k.jamSelesai,
  status: k.status,
  jumlahEmber: k.jumlahEmber,
  beratKg: k.beratKg,
  alasanKendala: k.alasanKendala,
  tanggalPalingLambat: k.tanggalPalingLambat,
  penggantiDari: k.penggantiDari,
};

/**
 * Langganan aktif akun ini (lib/langganan.ts, CONTRIBUTING 9.7) beserta tanggal akhir
 * dan kesepakatan siap_bayar-nya, atau null jika tidak aktif. `kesepakatan` null untuk
 * pelanggan aktif tanpa pengajuan siap_bayar, misalnya dari alur langganan lama.
 */
async function bacaLanggananAktif(idUser: number) {
  const [baris] = await getDb()
    .select({
      tanggalAkhir: dataLangganan.tanggalAkhirLangganan,
      kesepakatan: {
        idPengajuan: pengajuanLangganan.idPengajuan,
        namaInstansi: pengajuanLangganan.namaInstansi,
        hariPengambilan: pengajuanLangganan.hariPengambilan,
        jamMulai: pengajuanLangganan.jamMulai,
        jamSelesai: pengajuanLangganan.jamSelesai,
      },
    })
    .from(dataLangganan)
    .leftJoin(
      pengajuanLangganan,
      and(
        eq(pengajuanLangganan.idUser, dataLangganan.userId),
        eq(pengajuanLangganan.status, "siap_bayar"),
      ),
    )
    .where(and(eq(dataLangganan.userId, idUser), kondisiLanggananAktif()))
    .limit(1);
  return baris ?? null;
}

/**
 * Apakah akun ini punya langganan aktif. Dipakai aksi lapor-kendala, supaya syarat
 * aktif tracker hanya ditulis di sini. idUser harus dari sesi (requireLogin()).
 */
export async function isLanggananAktif(idUser: number): Promise<boolean> {
  return (await bacaLanggananAktif(idUser)) !== null;
}

/**
 * Tanggal akhir langganan aktif akun ini, atau null jika tidak aktif. Dipakai
 * mintaLewati(): usulan tanggal pengganti tidak boleh setelah tanggal ini (keputusan
 * 2.6). idUser harus dari sesi (requireLogin()).
 */
export async function akhirLanggananAktif(
  idUser: number,
): Promise<string | null> {
  const langganan = await bacaLanggananAktif(idUser);
  return langganan ? langganan.tanggalAkhir : null;
}

/**
 * Kunjungan milik akun ini yang memenuhi `syarat`, dalam bentuk tracker.
 * `batas` null berarti semua baris. Status asing berarti data rusak, jadi dilempar.
 */
async function bacaKunjungan(
  idUser: number,
  syarat: SQL | undefined,
  urutan: SQL,
  batas: number | null,
): Promise<KunjunganTracker[]> {
  const kueri = getDb()
    .select(KOLOM_KUNJUNGAN)
    .from(k)
    .where(and(eq(k.idUser, idUser), syarat))
    .orderBy(urutan)
    .$dynamic();
  const daftar = await (batas === null ? kueri : kueri.limit(batas));

  return daftar.map((baris) => {
    if (!isStatusKunjungan(baris.status)) {
      throw new Error(`Status kunjungan tidak dikenal: ${baris.status}`);
    }
    return {
      ...baris,
      status: baris.status,
      // Kolom numeric dikembalikan sebagai string (CONTRIBUTING 9.2).
      beratKg: baris.beratKg === null ? null : Number(baris.beratKg),
    };
  });
}

/** Total ember (diambil dan ditimbang) dan berat (ditimbang) dari seluruh riwayat akun ini. */
async function bacaTotal(
  idUser: number,
): Promise<{ ember: number; kg: number }> {
  const [total] = await getDb()
    .select({
      ember:
        sql<number>`coalesce(sum(${k.jumlahEmber}) filter (where ${inArray(k.status, STATUS_BERISI_EMBER)}), 0)`.mapWith(
          Number,
        ),
      kg: sql<number>`coalesce(sum(${k.beratKg}) filter (where ${eq(k.status, "ditimbang")}), 0)`.mapWith(
        Number,
      ),
    })
    .from(k)
    .where(eq(k.idUser, idUser));

  // Agregat tanpa GROUP BY selalu menghasilkan satu baris; tanpa baris berarti query rusak.
  if (!total) throw new Error("Total kunjungan tidak terbaca.");
  return total;
}

/** Bagian kunjungan yang dibutuhkan pilihan di form laporan. */
function kePilihan(kunjungan: KunjunganTracker): PilihanKunjungan {
  const { idKunjungan, tanggal, hari, status } = kunjungan;
  return { idKunjungan, tanggal, hari, status };
}

/** Batas lewati dalam WIB, diformat di server supaya teksnya sama di server dan browser. */
function formatBatas(batas: Date): string {
  const teks = batas.toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return `${teks} WIB`;
}

/**
 * Isi halaman /tracker untuk pelanggan yang login: kunjungan hari ini, jadwal
 * mendatang, riwayat, total, pemberitahuan, dan pilihan untuk form laporan.
 * Belum login dialihkan ke login. Akun tanpa langganan aktif (termasuk admin)
 * mendapat { aktif: false } tanpa data apa pun. Gagal (dilempar) jika data rusak.
 */
export async function getTrackerSaya(): Promise<DataTracker> {
  // 1. Pastikan login. idUser diambil dari sesi, bukan dari URL (CONTRIBUTING 7.2).
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");
  const idUser = cek.idUser;

  // 2. Tracker hanya untuk langganan aktif (CONTRIBUTING 9.7). Langganan aktif selalu
  //    punya tanggal akhir; tanpa tanggal akhir dianggap tidak aktif, sama seperti
  //    keadaanLangganan().
  const langganan = await bacaLanggananAktif(idUser);
  if (!langganan || langganan.tanggalAkhir === null) return { aktif: false };
  const { kesepakatan } = langganan;
  const akhirLangganan = langganan.tanggalAkhir;
  const hariPengambilan = kesepakatan?.hariPengambilan ?? [];

  // 3. Baca semua bagian bersamaan. Kolom date dibandingkan sebagai teks (CONTRIBUTING 9.2).
  //    Kunjungan mulai hari ini diambil satu lebih banyak, karena baris pertama bisa hari ini.
  const hariIni = tanggalHariIniJakarta();
  const [mulaiHariIni, riwayat, tertunda, total, pemberitahuan] =
    await Promise.all([
      bacaKunjungan(
        idUser,
        gte(k.tanggal, hariIni),
        asc(k.tanggal),
        BATAS_MENDATANG + 1,
      ),
      bacaKunjungan(idUser, lt(k.tanggal, hariIni), desc(k.tanggal), BATAS_RIWAYAT),
      // Tertunda hari ini sudah tampil di kartu "Hari ini", jadi tidak diulang di pemberitahuan.
      bacaKunjungan(
        idUser,
        and(eq(k.status, "tertunda"), ne(k.tanggal, hariIni)),
        asc(k.tanggal),
        null,
      ),
      bacaTotal(idUser),
      bacaPemberitahuan({
        idUser,
        idPengajuan: kesepakatan?.idPengajuan ?? null,
        hariPengambilan,
        hariIni,
      }),
    ]);

  // 4. Pisahkan kunjungan hari ini dari jadwal mendatang.
  const pertama = mulaiHariIni[0];
  const kunjunganHariIni = pertama?.tanggal === hariIni ? pertama : null;
  const mendatang = mulaiHariIni
    .slice(kunjunganHariIni ? 1 : 0)
    .slice(0, BATAS_MENDATANG);

  // 5. Pilihan lewati: hanya kunjungan dijadwalkan yang masih sebelum batas H-1
  //    pukul 17.00 WIB (bolehMintaLewati() dari 2.2). mintaLewati() mengecek ulang.
  const sekarang = new Date();
  const pilihanLewati = mendatang
    .filter(
      (kunjungan) =>
        kunjungan.status === "dijadwalkan" &&
        bolehMintaLewati(kunjungan.tanggal, sekarang),
    )
    .map((kunjungan) => ({
      ...kePilihan(kunjungan),
      batas: formatBatas(batasMintaLewati(kunjungan.tanggal)),
    }));

  return {
    aktif: true,
    hariIni,
    jadwalTetap: kesepakatan
      ? {
          namaInstansi: kesepakatan.namaInstansi,
          hariPengambilan,
          jamMulai: kesepakatan.jamMulai,
          jamSelesai: kesepakatan.jamSelesai,
        }
      : null,
    kunjunganHariIni,
    mendatang,
    riwayat,
    total,
    tertunda,
    ...pemberitahuan,
    // Kendala boleh untuk kunjungan mana pun yang tampil di tracker (keputusan 2.4).
    pilihanKendala: {
      hariIni: kunjunganHariIni ? kePilihan(kunjunganHariIni) : null,
      mendatang: mendatang.map(kePilihan),
      riwayat: riwayat.map(kePilihan),
    },
    pilihanLewati,
    akhirLangganan,
  };
}
