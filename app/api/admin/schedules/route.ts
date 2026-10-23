import { db } from "@/lib/db";
import { jadwal, jadwalJanjian, jadwalRutin, dataLangganan, users, riwayatPengambilan } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(request: Request) {
  // Ensure dynamic rendering
  const h = await headers();
  h.get("x-vercel-ip-city");
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const allJadwal = await db
      .select({
        id: jadwal.idJadwal,
        hariPengambilan: jadwal.hariPengambilan,
        jamPengambilan: jadwal.jamPengambilan,
        jenisJadwal: jadwal.jenisJadwal,
        langgananId: jadwal.langgananId,
      })
      .from(jadwal)
      .orderBy(desc(jadwal.idJadwal));

    // Filter by type if specified
    let filteredJadwal = allJadwal;
    if (type === "rutin") {
      filteredJadwal = allJadwal.filter((j) => j.jenisJadwal === "rutin");
    } else if (type === "janjian") {
      filteredJadwal = allJadwal.filter((j) => j.jenisJadwal === "janjian");
    }

    // Get details for each jadwal
    const schedulesWithDetails = await Promise.all(
      filteredJadwal.map(async (j) => {
        const [subscription] = await db
          .select({
            id: dataLangganan.idLangganan,
            userId: dataLangganan.userId,
            status: dataLangganan.statusLangganan,
          })
          .from(dataLangganan)
          .where(eq(dataLangganan.idLangganan, j.langgananId))
          .limit(1);

        let userInfo = null;
        if (subscription?.userId) {
          const [user] = await db
            .select({
              nama: users.namaPelanggan,
              email: users.email,
            })
            .from(users)
            .where(eq(users.idUser, subscription.userId))
            .limit(1);
          userInfo = user;
        }

        const [janjian] = await db
          .select({
            keterangan: jadwalJanjian.keteranganTujuan,
            status: jadwalJanjian.statusKonfirmasi,
          })
          .from(jadwalJanjian)
          .where(eq(jadwalJanjian.jadwalId, j.id))
          .limit(1);

        const [rutin] = await db
          .select({
            mulai: jadwalRutin.tanggalMulai,
            selesai: jadwalRutin.tanggalSelesai,
          })
          .from(jadwalRutin)
          .where(eq(jadwalRutin.jadwalId, j.id))
          .limit(1);

        // Filter by search if specified
        if (search && userInfo) {
          const searchLower = search.toLowerCase();
          const matchesSearch =
            userInfo.nama.toLowerCase().includes(searchLower) ||
            userInfo.email.toLowerCase().includes(searchLower);
          if (!matchesSearch) return null;
        }

        return {
          id: j.id,
          hariPengambilan: j.hariPengambilan,
          jamPengambilan: j.jamPengambilan,
          jenisJadwal: j.jenisJadwal,
          user: userInfo,
          subscription,
          janjian,
          rutin,
        };
      })
    );

    // Filter out null values from search
    const finalSchedules = schedulesWithDetails.filter((s) => s !== null);

    return NextResponse.json(finalSchedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}