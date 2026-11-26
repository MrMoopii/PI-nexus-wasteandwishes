import { redirect } from "next/navigation";

/** Halaman lama pembuatan jadwal rutin; pelanggan tidak lagi membuat jadwal sendiri (1.7). */
export default function BuatJadwalRutin() {
  redirect("/langganan");
}
