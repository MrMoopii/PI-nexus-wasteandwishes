"use server";

import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { dataLangganan } from "@/lib/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function ajukanJadwalJanjian(formData: FormData) {
  const session = await auth();
  const idUser = Number(session?.user?.idUser);

  if (!(Number.isInteger(idUser) && idUser > 0)) {
    redirect("/auth/login");
  }

  const hariPengambilan = formData.get("hariPengambilan");
  const jamPengambilan = formData.get("jamPengambilan");
  const keteranganTujuan = formData.get("keteranganTujuan");

  const hariValid =
    typeof hariPengambilan === "string" &&
    ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].includes(
      hariPengambilan,
    );
  const jamValid =
    typeof jamPengambilan === "string" &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(jamPengambilan);
  const tujuanValid =
    typeof keteranganTujuan === "string" &&
    keteranganTujuan.trim().length >= 5 &&
    keteranganTujuan.trim().length <= 500;

  if (!(hariValid && jamValid && tujuanValid)) {
    redirect("/buat-jadwal-janjian?status=input-tidak-valid");
  }

  const [langgananAktif] = await getDb()
    .select({ idLangganan: dataLangganan.idLangganan })
    .from(dataLangganan)
    .where(
      and(
        eq(dataLangganan.userId, idUser),
        eq(dataLangganan.statusLangganan, "aktif"),
      ),
    )
    .limit(1);

  if (!langgananAktif) {
    redirect("/buat-jadwal-janjian?status=langganan-tidak-aktif");
  }

  await getDb().execute(sql`
    WITH jadwal_baru AS (
      INSERT INTO jadwal (langganan_id, hari_pengambilan, jam_pengambilan, jenis_jadwal)
      VALUES (
        ${langgananAktif.idLangganan},
        ${hariPengambilan},
        ${`${jamPengambilan}:00`},
        'janjian'
      )
      RETURNING id_jadwal
    )
    INSERT INTO jadwal_janjian (jadwal_id, keterangan_tujuan, status_konfirmasi)
    SELECT id_jadwal, ${keteranganTujuan.trim()}, 'menunggu'
    FROM jadwal_baru
  `);

  redirect("/buat-jadwal-janjian?status=permintaan-terkirim");
}
