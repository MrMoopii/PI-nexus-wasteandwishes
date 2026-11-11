"use server";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { dataLangganan, jadwal, jadwalRutin } from "@/lib/db/schema";
import { requireLogin } from "@/lib/require-login";

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function tambahHari(tanggal: string, jumlah: number): string {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  const hasil = new Date(Date.UTC(tahun, bulan - 1, hari + jumlah));
  return `${hasil.getUTCFullYear()}-${String(hasil.getUTCMonth() + 1).padStart(2, "0")}-${String(hasil.getUTCDate()).padStart(2, "0")}`;
}

export async function simpanJadwalRutin(formData: FormData) {
  const cek = await requireLogin();
  if (!cek.ok) redirect("/auth/login");

  const hari1 = formData.get("hari1");
  const hari2 = formData.get("hari2");
  const jam1 = formData.get("jam1");
  const jam2 = formData.get("jam2");
  const mode = formData.get("mode");
  const jamValid = (value: FormDataEntryValue | null): value is string =>
    typeof value === "string" && /^(?:0[89]|1[0-4]):(?:00|15|30|45)$|^15:00$/.test(value);

  if (
    typeof hari1 !== "string" || !HARI.includes(hari1) ||
    typeof hari2 !== "string" || !HARI.includes(hari2) || hari1 === hari2 ||
    !jamValid(jam1) || !jamValid(jam2) ||
    (mode !== "baru" && mode !== "ubah")
  ) redirect("/langganan/jadwal?status=input-tidak-valid");

  const db = getDb();
  const hariIni = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const [langgananAktif] = await db.select({ id: dataLangganan.idLangganan })
    .from(dataLangganan)
    .where(and(
      eq(dataLangganan.userId, cek.idUser),
      eq(dataLangganan.statusLangganan, "aktif"),
      sql`${dataLangganan.tanggalAkhirLangganan} >= ${hariIni}::date`,
    )).limit(1);
  if (!langgananAktif) redirect("/langganan?status=langganan-tidak-aktif");

  const milikSaya = await db.select({ id: jadwal.idJadwal, mulai: jadwalRutin.tanggalMulai })
    .from(jadwal).innerJoin(jadwalRutin, eq(jadwalRutin.jadwalId, jadwal.idJadwal))
    .where(and(
      eq(jadwal.langgananId, langgananAktif.id),
      eq(jadwal.jenisJadwal, "rutin"),
      sql`${jadwalRutin.tanggalSelesai} >= ${hariIni}::date`,
    ));

  if (mode === "baru" && milikSaya.length > 0) redirect("/langganan/jadwal?status=sudah-ada");
  if (mode === "ubah" && milikSaya.length !== 2) redirect("/langganan/jadwal?status=jadwal-tidak-lengkap");

  if (mode === "ubah") {
    if (milikSaya.some(({ mulai }) => {
      const mulaiMinggu = tambahHari(mulai, -((new Date(`${mulai}T00:00:00Z`).getUTCDay() + 6) % 7));
      return hariIni < tambahHari(mulaiMinggu, 7);
    })) {
      redirect("/langganan/jadwal?status=belum-boleh-ubah");
    }
  }

  const pilihan = [
    { hari: hari1, jam: jam1 },
    { hari: hari2, jam: jam2 },
  ];
  for (const item of pilihan) {
    const [bentrok] = await db.select({ id: jadwal.idJadwal })
      .from(jadwal)
      .innerJoin(jadwalRutin, eq(jadwalRutin.jadwalId, jadwal.idJadwal))
      .innerJoin(dataLangganan, eq(dataLangganan.idLangganan, jadwal.langgananId))
      .where(and(
        eq(jadwal.jenisJadwal, "rutin"),
        eq(jadwal.hariPengambilan, item.hari),
        eq(jadwal.jamPengambilan, `${item.jam}:00`),
        sql`${jadwal.langgananId} <> ${langgananAktif.id}`,
        eq(dataLangganan.statusLangganan, "aktif"),
        sql`${dataLangganan.tanggalAkhirLangganan} >= ${hariIni}::date`,
        sql`${jadwalRutin.tanggalSelesai} >= ${hariIni}::date`,
      )).limit(1);
    if (bentrok) redirect("/langganan/jadwal?status=slot-terisi");
  }

  const tanggalHariIni = new Date(`${hariIni}T00:00:00Z`);
  const offsetHari = (tanggalHariIni.getUTCDay() + 6) % 7;
  const seninMingguIni = tambahHari(hariIni, -offsetHari);
  const tanggalMulai = mode === "ubah" ? tambahHari(seninMingguIni, 7) : hariIni;
  const selesai = tambahHari(tanggalMulai, 30);

  if (mode === "ubah") {
    await db.update(jadwalRutin)
      .set({ tanggalSelesai: tambahHari(seninMingguIni, 6) })
      .where(sql`${jadwalRutin.jadwalId} IN (${sql.join(milikSaya.map(({ id }) => sql`${id}`), sql`, `)})`);
  }
  for (const [index, item] of pilihan.entries()) {
    const [baru] = await db.insert(jadwal).values({
      langgananId: langgananAktif.id,
      hariPengambilan: item.hari,
      jamPengambilan: `${item.jam}:00`,
      jenisJadwal: "rutin",
    }).returning({ id: jadwal.idJadwal });
    if (!baru) throw new Error(`Jadwal rutin ke-${index + 1} tidak berhasil disimpan.`);
    await db.insert(jadwalRutin).values({ jadwalId: baru.id, tanggalMulai, tanggalSelesai: selesai });
  }

  redirect("/langganan/jadwal?status=tersimpan");
}
