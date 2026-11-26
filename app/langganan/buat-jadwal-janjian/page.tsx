import { redirect } from "next/navigation";

/** Halaman lama pembuatan jadwal janjian; jadwal janjian sudah tidak dipakai lagi (1.7). */
export default function BuatJadwalJanjian() {
  redirect("/langganan");
}
