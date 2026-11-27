import "server-only";

import { redirect } from "next/navigation";
import { and, asc, desc, eq, isNotNull, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db";
import {
  dataLangganan,
  hariLibur,
  kunjunganPengambilan,
  laporanKendala,
  pengajuanLangganan,
} from "@/lib/db/schema";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { kondisiLanggananAktif } from "@/lib/langganan";
import { requireAdmin } from "@/lib/require-admin";
import {
  isJenisLaporan,
  isStatusKunjungan,
  type LaporanKendalaTampilan,
  type StatusKunjungan,
} from "../types";

// Query halaman admin laporan kendala (kode tugas 2.6). getHalamanKendala() dipakai
// halaman dan memanggil requireAdmin() sendiri. bacaLaporanPengganti() dan
// bacaBentrokTanggal() dipakai putuskanPengganti() SETELAH requireAdmin(), jadi jangan
// dipanggil dari tempat lain tanpa cek admin.

/** Riwayat "Terakhir ditanggapi" paling banyak sekian laporan (keputusan 2.6). */
const BATAS_DITANGGAPI = 20;

/**
 * Satu laporan di halaman admin. Hanya kolom yang dipakai tampilan
 * (CONTRIBUTING 7.2 no. 7); id pelanggan tidak ikut.
 */
export type LaporanAdmin = Pick<
  LaporanKendalaTampilan,
  | "idLaporan"
  | "jenis"
  | "pesan"
  | "tanggalPengganti"
  | "tanggapanAdmin"
  | "dibuatPada"
> & {
  namaInstansi: string;
  namaPic: string;
  telpPic: string;
  tanggalKunjungan: string;
  statusKunjungan: StatusKunjungan;
  /** Tanggal kunjungan pengganti yang dibuat admin, atau null. */
  tanggalPenggantiDisetujui: string | null;
  /** Tanggal akhir langganan jika masih aktif; null jika tidak aktif. */
  akhirLanggananAktif: string | null;
};

/** Permintaan lewati yang membawa usulan tanggal pengganti dari pelanggan. */
export type LaporanUsulan = LaporanAdmin & { tanggalPengganti: string };

/** Isi halaman /admin/kendala: kotak masuk per kelompok dan riwayat tanggapan. */
export type HalamanKendala = {
  hariIni: string;
  menunggu: {
    usulan: LaporanUsulan[];
    kendala: LaporanAdmin[];
    lewati: LaporanAdmin[];
  };
  ditanggapi: LaporanAdmin[];
};

/** Data laporan yang dibutuhkan putuskanPengganti(). */
export type LaporanPengganti = {
  idUser: number;
  tanggalUsulan: string;
  tanggalDilewati: string;
  /** Tanggal akhir langganan jika masih aktif; null jika tidak aktif. */
  akhirLanggananAktif: string | null;
};

/** Lewati dengan usulan tanggal, untuk memisahkan kotak masuk tanpa "as". */
function adaUsulan(laporan: LaporanAdmin): laporan is LaporanUsulan {
  return laporan.jenis === "lewati" && laporan.tanggalPengganti !== null;
}

/**
 * Syarat join langganan pelapor: hanya baris yang aktif menurut lib/langganan.ts
 * (CONTRIBUTING 9.7), jadi kolom langganan bernilai null berarti tidak aktif.
 */
function langgananAktifPelapor(): SQL | undefined {
  return and(
    eq(dataLangganan.userId, laporanKendala.idUser),
    kondisiLanggananAktif(),
  );
}

/**
 * Laporan yang memenuhi `syarat` beserta instansi, PIC, kunjungan yang dilaporkan,
 * kunjungan pengganti, dan langganan aktif pelapor. `batas` null berarti semua.
 * Jenis atau status asing berarti data rusak, jadi dilempar ke error.tsx.
 */
async function bacaDaftar(
  syarat: SQL,
  urutan: SQL[],
  batas: number | null,
): Promise<LaporanAdmin[]> {
  const db = getDb();
  const k = kunjunganPengambilan;
  // Kunjungan baru dengan pengganti_dari = kunjungan yang dilaporkan (dibuat 2.6).
  const pengganti = alias(kunjunganPengambilan, "pengganti");
  const penggantiDisetujui = db
    .select({ tanggal: sql<string>`min(${pengganti.tanggal})` })
    .from(pengganti)
    .where(eq(pengganti.penggantiDari, laporanKendala.kunjunganId));

  const kueri = db
    .select({
      idLaporan: laporanKendala.idLaporan,
      jenis: laporanKendala.jenis,
      pesan: laporanKendala.pesan,
      tanggalPengganti: laporanKendala.tanggalPengganti,
      tanggapanAdmin: laporanKendala.tanggapanAdmin,
      dibuatPada: laporanKendala.dibuatPada,
      namaInstansi: pengajuanLangganan.namaInstansi,
      namaPic: pengajuanLangganan.namaPic,
      telpPic: pengajuanLangganan.telpPic,
      tanggalKunjungan: k.tanggal,
      statusKunjungan: k.status,
      tanggalPenggantiDisetujui: sql<string | null>`(${penggantiDisetujui})`,
      akhirLanggananAktif: dataLangganan.tanggalAkhirLangganan,
    })
    .from(laporanKendala)
    .innerJoin(k, eq(k.idKunjungan, laporanKendala.kunjunganId))
    .innerJoin(
      pengajuanLangganan,
      eq(pengajuanLangganan.idPengajuan, k.pengajuanId),
    )
    .leftJoin(dataLangganan, langgananAktifPelapor())
    .where(syarat)
    .orderBy(...urutan)
    .$dynamic();
  const daftar = await (batas === null ? kueri : kueri.limit(batas));

  return daftar.map((baris) => {
    if (
      !isJenisLaporan(baris.jenis) ||
      !isStatusKunjungan(baris.statusKunjungan)
    ) {
      throw new Error(
        `Laporan tidak dikenal: jenis ${baris.jenis}, status kunjungan ${baris.statusKunjungan}`,
      );
    }
    return {
      ...baris,
      jenis: baris.jenis,
      statusKunjungan: baris.statusKunjungan,
    };
  });
}

/**
 * Isi halaman admin laporan kendala: semua laporan yang menunggu (terlama dulu) dalam
 * tiga kelompok, dan 20 laporan terbaru yang sudah ditanggapi. Riwayat diurut menurut
 * waktu kirim, karena tabel tidak menyimpan waktu ditanggapi.
 * Hanya admin; belum login dialihkan ke login, bukan admin ke beranda.
 */
export async function getHalamanKendala(): Promise<HalamanKendala> {
  // 1. Cek admin sebelum membaca data (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");

  // 2. Kotak masuk (semua yang menunggu) dan riwayat dibaca bersamaan.
  const [menunggu, ditanggapi] = await Promise.all([
    bacaDaftar(
      eq(laporanKendala.status, "menunggu"),
      [asc(laporanKendala.dibuatPada), asc(laporanKendala.idLaporan)],
      null,
    ),
    bacaDaftar(
      eq(laporanKendala.status, "ditanggapi"),
      [desc(laporanKendala.dibuatPada), desc(laporanKendala.idLaporan)],
      BATAS_DITANGGAPI,
    ),
  ]);

  // 3. Kelompokkan kotak masuk. Kendala tidak pernah punya tanggal pengganti
  //    (CHECK laporan_kendala_tanggal_pengganti_hanya_lewati).
  return {
    hariIni: tanggalHariIniJakarta(),
    menunggu: {
      usulan: menunggu.filter(adaUsulan),
      kendala: menunggu.filter((laporan) => laporan.jenis === "kendala"),
      lewati: menunggu.filter(
        (laporan) =>
          laporan.jenis === "lewati" && laporan.tanggalPengganti === null,
      ),
    },
    ditanggapi,
  };
}

/**
 * Laporan lewati dengan usulan tanggal yang masih menunggu, beserta tanggal kunjungan
 * yang dilewati dan langganan aktif pelapor. Null jika laporan tidak ada, sudah
 * ditanggapi, atau bukan lewati dengan usulan. Hanya untuk aksi admin setelah requireAdmin().
 */
export async function bacaLaporanPengganti(
  idLaporan: number,
): Promise<LaporanPengganti | null> {
  const [baris] = await getDb()
    .select({
      idUser: laporanKendala.idUser,
      tanggalUsulan: laporanKendala.tanggalPengganti,
      tanggalDilewati: kunjunganPengambilan.tanggal,
      akhirLanggananAktif: dataLangganan.tanggalAkhirLangganan,
    })
    .from(laporanKendala)
    .innerJoin(
      kunjunganPengambilan,
      eq(kunjunganPengambilan.idKunjungan, laporanKendala.kunjunganId),
    )
    .leftJoin(dataLangganan, langgananAktifPelapor())
    .where(
      and(
        eq(laporanKendala.idLaporan, idLaporan),
        eq(laporanKendala.status, "menunggu"),
        eq(laporanKendala.jenis, "lewati"),
        isNotNull(laporanKendala.tanggalPengganti),
      ),
    )
    .limit(1);

  // isNotNull() tidak mempersempit tipe, jadi usulan kosong tetap dicek di sini.
  if (!baris || baris.tanggalUsulan === null) return null;
  return { ...baris, tanggalUsulan: baris.tanggalUsulan };
}

/**
 * Keterangan hari libur pada `tanggal`, dan apakah pelanggan sudah punya kunjungan di
 * tanggal itu. Semua status dihitung, karena unique (id_user, tanggal) berlaku untuk
 * semua status. Hanya untuk aksi admin setelah requireAdmin().
 */
export async function bacaBentrokTanggal(
  idUser: number,
  tanggal: string,
): Promise<{ libur: string | null; adaKunjungan: boolean }> {
  const db = getDb();
  const k = kunjunganPengambilan;
  const [[libur], [kunjungan]] = await Promise.all([
    db
      .select({ keterangan: hariLibur.keterangan })
      .from(hariLibur)
      .where(eq(hariLibur.tanggal, tanggal))
      .limit(1),
    db
      .select({ idKunjungan: k.idKunjungan })
      .from(k)
      .where(and(eq(k.idUser, idUser), eq(k.tanggal, tanggal)))
      .limit(1),
  ]);
  return {
    libur: libur ? libur.keterangan : null,
    adaKunjungan: kunjungan !== undefined,
  };
}
