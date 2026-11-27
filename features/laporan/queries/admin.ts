import "server-only";

import { and, asc, eq, exists, sql } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { kunjunganPengambilan, pengajuanLangganan } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { tanggalHariIniJakarta } from "@/lib/format-tanggal";
import { skemaFilterLaporan } from "../validasi/admin";
import type {
  BarisLaporan,
  HasilLaporanBulanan,
  PilihanInstansi,
  RekapInstansi,
} from "../types";

/**
 * Laporan bulanan per instansi (kode tugas 2.5): kunjungan berstatus
 * "ditimbang" dalam satu bulan, dikelompokkan per instansi beserta total
 * ember dan beratnya, ditambah filter yang dipakai. Hanya admin; belum login
 * dialihkan ke halaman login, bukan admin ke beranda. Bulan kosong (tidak
 * dikirim atau "") memakai bulan ini (WIB); instansi kosong berarti semua;
 * diisi tetapi tidak valid menjadi 404.
 */
export async function getLaporanBulanan(
  bulanMentah: string | undefined,
  instansiMentah: string | undefined,
): Promise<HasilLaporanBulanan> {
  // 1. Cek admin sebelum membaca URL atau data (CONTRIBUTING 7.2 dan 9.8).
  const cek = await requireAdmin();
  if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");

  // 2. Validasi filter URL. Bulan kosong berarti bulan ini (WIB); instansi
  //    kosong berarti semua instansi (CONTRIBUTING 9.8).
  const hasil = skemaFilterLaporan.safeParse({
    bulan: bulanMentah,
    instansi: instansiMentah,
  });
  if (!hasil.success) notFound();
  const { instansi } = hasil.data;
  const bulan = hasil.data.bulan ?? tanggalHariIniJakarta().slice(0, 7);

  // 3. Batas bulan: tanggal di antara tanggal pertama dan terakhir bulan itu
  //    (kolom date, perbandingan teks sesuai CONTRIBUTING 9.2).
  const [tahunTeks, bulanTeks] = bulan.split("-");
  const tahun = Number(tahunTeks);
  const bulanAngka = Number(bulanTeks);
  const hariTerakhir = new Date(Date.UTC(tahun, bulanAngka, 0)).getUTCDate();
  const mulaiBulan = `${tahunTeks}-${bulanTeks}-01`;
  const selesaiBulan = `${tahunTeks}-${bulanTeks}-${String(hariTerakhir).padStart(2, "0")}`;

  // 4. Baca hanya kunjungan yang sudah ditimbang, urut tanggal dan jam (9.2).
  const daftarMentah = await getDb()
    .select({
      idPengajuan: pengajuanLangganan.idPengajuan,
      namaInstansi: pengajuanLangganan.namaInstansi,
      tanggal: kunjunganPengambilan.tanggal,
      jamMulai: kunjunganPengambilan.jamMulai,
      jamSelesai: kunjunganPengambilan.jamSelesai,
      jumlahEmber: kunjunganPengambilan.jumlahEmber,
      beratKg: kunjunganPengambilan.beratKg,
    })
    .from(kunjunganPengambilan)
    .innerJoin(
      pengajuanLangganan,
      eq(pengajuanLangganan.idPengajuan, kunjunganPengambilan.pengajuanId),
    )
    .where(
      and(
        eq(kunjunganPengambilan.status, "ditimbang"),
        // Batas bulan langsung: tanggal di antara tanggal pertama dan terakhir
        // bulan yang difilter (9.2).
        sql`(${kunjunganPengambilan.tanggal} >= ${mulaiBulan} AND ${kunjunganPengambilan.tanggal} <= ${selesaiBulan})`,
        instansi === undefined ? undefined : eq(pengajuanLangganan.idPengajuan, instansi),
      ),
    )
    .orderBy(
      asc(kunjunganPengambilan.tanggal),
      asc(kunjunganPengambilan.jamMulai),
      asc(kunjunganPengambilan.idKunjungan),
    );

  // 5. Kelompokkan per instansi dan hitung total (berat numeric ke number, 9.2).
  const peta = new Map<number, RekapInstansi>();
  let totalEmber = 0;
  let totalBeratKg = 0;
  for (const baris of daftarMentah) {
    // Berat wajib terisi untuk status ditimbang (CHECK di skema),
    // jadi null di sini berarti data rusak: lempar error (CONTRIBUTING 8 no. 4).
    if (baris.beratKg === null) {
      throw new Error(
        `Kunjungan berstatus ditimbang tanpa berat di ${baris.tanggal}`,
      );
    }
    const berat = Number(baris.beratKg);
    const ember = baris.jumlahEmber;
    totalBeratKg += berat;
    totalEmber += ember ?? 0;

    let rekap = peta.get(baris.idPengajuan);
    if (!rekap) {
      rekap = {
        idPengajuan: baris.idPengajuan,
        namaInstansi: baris.namaInstansi,
        daftar: [],
        totalEmber: 0,
        totalBeratKg: 0,
      };
      peta.set(baris.idPengajuan, rekap);
    }
    rekap.totalEmber += ember ?? 0;
    rekap.totalBeratKg += berat;
    const barisLaporan: BarisLaporan = {
      tanggal: baris.tanggal,
      jamMulai: baris.jamMulai,
      jamSelesai: baris.jamSelesai,
      jumlahEmber: ember,
      beratKg: berat,
    };
    rekap.daftar.push(barisLaporan);
  }

  return {
    bulan,
    instansi: instansi ?? null,
    daftar: [...peta.values()],
    totalEmber,
    totalBeratKg,
  };
}

/**
 * Pilihan dropdown instansi laporan bulanan (kode tugas 2.5, #185): pengajuan
 * yang pernah punya kunjungan "ditimbang" di bulan mana pun, urut nama. Tidak
 * bergantung pada filter, supaya pilihannya tetap lengkap setelah difilter dan
 * di bulan tanpa data. Hanya admin; belum login ke login, bukan admin ke beranda.
 */
export async function getPilihanInstansi(): Promise<PilihanInstansi[]> {
  // 1. Cek admin sebelum membaca data (CONTRIBUTING 7.2).
  const cek = await requireAdmin();
  if (!cek.ok) redirect(cek.status === 401 ? "/auth/login" : "/");

  // 2. Hanya pengajuan yang punya kunjungan ditimbang, karena hanya kunjungan
  //    itu yang masuk laporan (keputusan #185). Urutan id menjaga urutan tetap
  //    jika dua pelanggan memakai nama instansi yang sama.
  const db = getDb();
  return db
    .select({
      idPengajuan: pengajuanLangganan.idPengajuan,
      namaInstansi: pengajuanLangganan.namaInstansi,
    })
    .from(pengajuanLangganan)
    .where(
      exists(
        db
          .select({ idKunjungan: kunjunganPengambilan.idKunjungan })
          .from(kunjunganPengambilan)
          .where(
            and(
              eq(
                kunjunganPengambilan.pengajuanId,
                pengajuanLangganan.idPengajuan,
              ),
              eq(kunjunganPengambilan.status, "ditimbang"),
            ),
          ),
      ),
    )
    .orderBy(
      asc(pengajuanLangganan.namaInstansi),
      asc(pengajuanLangganan.idPengajuan),
    );
}
