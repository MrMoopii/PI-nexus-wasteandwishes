import Link from "next/link";
import { confirmEventRegistration } from "@/app/event/actions";
import { events as eventsTable, users as usersTable } from "@/lib/db/schema";

type Event = typeof eventsTable.$inferSelect;
type User = typeof usersTable.$inferSelect;

export default function FormKonfirmasi({
  event,
  currentUser,
  formatTanggalLahir,
  errorMessage,
  bannerMessage,
  proofId,
}: {
  event: Event;
  currentUser: User | null;
  formatTanggalLahir: string;
  errorMessage: string;
  bannerMessage: string;
  proofId: string;
}) {
  return (
    <div className="lg:col-span-7">
      <div className="rounded-3xl border border-(--hx-pastel)/60 bg-white/95 p-8 sm:p-10 shadow-[0_12px_40px_rgb(27,34,51,0.06)] backdrop-blur-md">
        <div className="border-b border-(--hx-sunk)/80 pb-5 mb-6">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase block mb-1">
            Verifikasi Identitas
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
            Konfirmasi Pendaftaran
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-(--hx-ink-2) font-light">
            Data peserta di bawah diambil secara otomatis dari profil akun
            terdaftar Anda.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {!errorMessage && !bannerMessage && proofId && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Sudah terdaftar
                </p>
                <p className="mt-1 text-sm">
                  Anda sudah terdaftar pada event ini.
                </p>
              </div>

              <Link
                href={`/event/bukti/${proofId}`}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                Lihat Bukti
              </Link>
            </div>
          </div>
        )}

        <form action={confirmEventRegistration} className="space-y-5">
          <input
            type="hidden"
            name="id_event"
            value={event.idEvent}
          />

          <div>
            <label
              htmlFor="nama"
              className="block text-xs font-semibold text-(--hx-ink) uppercase tracking-wider mb-2"
            >
              Nama Lengkap Peserta
            </label>
            <input
              type="text"
              id="nama"
              name="nama"
              required
              readOnly
              defaultValue={currentUser?.namaPelanggan || ""}
              placeholder="Masukkan nama lengkap"
              className="hx-input-readonly"
            />
            <span className="mt-1 block text-[11px] text-(--hx-ink-3)">
              Nama sesuai profil akun pengguna
            </span>
          </div>

          <div>
            <label
              htmlFor="no_hp"
              className="block text-xs font-semibold text-(--hx-ink) uppercase tracking-wider mb-2"
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
              className="hx-input-readonly"
            />
            <span className="mt-1 block text-[11px] text-(--hx-ink-3)">
              Untuk pengiriman informasi lokasi &amp; pengingat acara
            </span>
          </div>

          <div>
            <label
              htmlFor="tgl_lahir"
              className="block text-xs font-semibold text-(--hx-ink) uppercase tracking-wider mb-2"
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
              className="hx-input-readonly"
            />
          </div>

          {/* Summary Box */}
          <div className="rounded-xl border border-(--hx-sunk) bg-(--hx-canvas)/80 p-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-(--hx-ink-3) block">
                Total Biaya Pendaftaran
              </span>
              <strong className="text-sm text-(--hx-accent) font-(family-name:--font-plus-jakarta-sans)">
                Rp 0 (Gratis Penuh)
              </strong>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-(--hx-accent)/15 text-(--hx-accent)">
              Terkonfirmasi
            </span>
          </div>

          <div className="pt-2">
            <button type="submit" className="hx-btn-primary w-full">
              Konfirmasi &amp; Amankan Slot (Gratis)
            </button>
          </div>

          <p className="text-center text-[11px] text-(--hx-ink-3)">
            Dengan menekan tombol di atas, Anda menyetujui komitmen kehadiran
            untuk agenda ini.
          </p>
        </form>
      </div>
    </div>
  );
}
