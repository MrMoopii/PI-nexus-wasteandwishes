import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { events as eventsTable, users as usersTable } from "@/lib/db/schema"; // Pastikan usersTable di-import
import { eq } from "drizzle-orm";

export const instant = false;

const DEFAULT_EVENTS: Record<
  number,
  {
    id_event: number;
    nama_event: string;
    gambar: string;
    tanggal_pelaksanaan?: string;
  }
> = {
  1: {
    id_event: 1,
    nama_event: "Pelatihan Budidaya Maggot BSF",
    gambar: "1.jpg",
    tanggal_pelaksanaan: "25 Oktober 2026",
  },
  2: {
    id_event: 2,
    nama_event: "Sosialisasi Pemilahan Limbah Dapur",
    gambar: "2.jpg",
    tanggal_pelaksanaan: "02 November 2026",
  },
  3: {
    id_event: 3,
    nama_event: "Aksi Hijau Gejayan Bersih",
    gambar: "3.jpg",
    tanggal_pelaksanaan: "15 November 2026",
  },
  4: {
    id_event: 4,
    nama_event: "Workshop Kasgot & Pupuk Organik",
    gambar: "4.jpg",
    tanggal_pelaksanaan: "28 November 2026",
  },
  5: {
    id_event: 5,
    nama_event: "Edukasi Sirkular Ekonomi Desa",
    gambar: "5.jpg",
    tanggal_pelaksanaan: "10 Desember 2026",
  },
};

export default async function EventCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  // Jika tidak ada session / belum login, lempar ke halaman login
  if (!session || !session.user?.email) {
    redirect("/auth/login");
  }

  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.id, 10) || 1;

  let event = DEFAULT_EVENTS[eventId] || DEFAULT_EVENTS[1];
  let currentUser = null;

  try {
    // 1. Ambil data Event dari Database
    const [dbEvent] = await getDb()
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.idEvent, eventId))
      .limit(1);

    if (dbEvent) {
      const fallback = DEFAULT_EVENTS[eventId] || DEFAULT_EVENTS[1];
      event = {
        id_event: dbEvent.idEvent,
        nama_event: dbEvent.namaEvent,
        gambar: fallback.gambar,
        tanggal_pelaksanaan: dbEvent.tanggalPelaksanaan,
      };
    }

    // 2. Ambil data User dari Database berdasarkan email dari session
    const [dbUser] = await getDb()
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (dbUser) {
      currentUser = dbUser;
    }
  } catch (error) {
    console.error("Database error:", error);
  }

  if (!event) {
    notFound();
  }

  // Format tanggal lahir untuk input type="date" (YYYY-MM-DD)
  const formatTanggalLahir = currentUser?.tanggalLahir
    ? new Date(currentUser.tanggalLahir).toISOString().split("T")[0]
    : "";

  return (
    <div className="container mx-auto px-4 max-w-6xl py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Kolom Kiri: Informasi Event */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full h-75 md:h- rounded-2xl overflow-hidden shadow-sm bg-gray-100">
            <Image
              src={`/img/event/${event.gambar}`}
              alt={event.nama_event}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {event.nama_event}
            </h2>
            <p className="text-gray-600 flex items-center gap-2 text-sm font-medium">
              📅 {event.tanggal_pelaksanaan || "Tanggal belum ditentukan"}
            </p>
            <hr className="my-4 border-gray-100" />
            <p className="text-gray-500 text-sm">
              Pastikan data diri Anda di samping sudah benar sebelum menekan
              tombol konfirmasi pendaftaran. Tiket dan informasi lanjutan akan
              dikirimkan ke kontak Anda.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Form Pendaftaran (Pre-filled Data) */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 h-fit">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Konfirmasi Pendaftaran
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Data di bawah diambil otomatis dari profil akun Anda.
          </p>

          <form
            action="/api/event/checkout"
            method="POST"
            className="space-y-4"
          >
            <input type="hidden" name="id_event" value={event.id_event} />
            {currentUser && (
              <input type="hidden" name="id_user" value={currentUser.idUser} />
            )}

            <div>
              <label
                htmlFor="nama"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Nama Lengkap
              </label>
              <input
                type="text"
                id="nama"
                name="nama"
                required
                readOnly // Membuat form tidak bisa diubah (opsional, ganti jadi defaultValue jika ingin bisa diubah)
                defaultValue={currentUser?.namaPelanggan || ""}
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="no_hp"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                No. Handphone / WhatsApp
              </label>
              <input
                type="tel"
                id="no_hp"
                name="no_hp"
                required
                readOnly
                defaultValue={currentUser?.nomorTelp || ""}
                placeholder="Contoh: 081234567890"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="tgl_lahir"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Tanggal Lahir
              </label>
              <input
                type="date"
                id="tgl_lahir"
                name="tgl_lahir"
                required
                readOnly
                defaultValue={formatTanggalLahir}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 text-sm focus:outline-none cursor-not-allowed"
              />
            </div>

            <div className="text-center text-3xl py-2">🌿</div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl text-base font-bold text-white bg-waste hover:bg-[#118586] transition-colors shadow-md"
            >
              Konfirmasi & Daftar (Gratis)
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href={`/event/detail/${event.id_event}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-xs"
        >
          ⬅ Kembali ke Detail
        </Link>
      </div>
    </div>
  );
}
