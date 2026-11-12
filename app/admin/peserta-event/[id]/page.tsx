import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import GambarEvent from "@/components/GambarEvent";
import { getDb } from "@/lib/db";
import { events, pendaftaranEvent, users } from "@/lib/db/schema";
import { formatTanggal, formatWaktu } from "@/lib/format-tanggal";
import HapusPesertaButton from "../hapus-peserta-button";

export default function DetailPesertaEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<DetailKerangka />}>
      <DetailPesertaEvent params={params} />
    </Suspense>
  );
}

async function DetailPesertaEvent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idEvent = Number(id);

  if (!(Number.isInteger(idEvent) && idEvent > 0)) {
    notFound();
  }

  await connection();

  const [eventDipilih] = await getDb()
    .select()
    .from(events)
    .where(and(eq(events.idEvent, idEvent), eq(events.statusEvent, "aktif")))
    .limit(1);

  if (!eventDipilih) {
    notFound();
  }

  const peserta = await getDb()
    .select({
      idPendaftaran: pendaftaranEvent.idPendaftaran,
      eventId: pendaftaranEvent.eventId,
      userId: pendaftaranEvent.userId,
      tanggalDaftar: pendaftaranEvent.tanggalDaftar,
      nama: users.namaPelanggan,
      email: users.email,
      nomorTelp: users.nomorTelp,
    })
    .from(pendaftaranEvent)
    .innerJoin(users, eq(users.idUser, pendaftaranEvent.userId))
    .where(eq(pendaftaranEvent.eventId, eventDipilih.idEvent))
    .orderBy(asc(pendaftaranEvent.tanggalDaftar));

  const biaya = Number(eventDipilih.biayaEvent);
  const plateNo = String(eventDipilih.idEvent).padStart(2, "0");

  return (
    <div className="relative min-h-screen bg-(--hx-canvas) text-(--hx-ink) font-(family-name:--font-plus-jakarta-sans)">
      <div aria-hidden="true" className="hx-ambient-wash">
        <div className="hx-ambient-blob-1" />
        <div className="hx-ambient-blob-2" />
        <div className="hx-ambient-blob-3" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin/peserta-event"
            className="inline-flex items-center gap-2 text-xs font-semibold text-(--hx-ink-2) hover:text-(--hx-accent)"
          >
            <span aria-hidden="true">←</span>
            <span>Kembali ke Peserta Event</span>
          </Link>
          <span className="text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase">
            Plate {plateNo}
          </span>
        </div>

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="relative aspect-16/11 w-full overflow-hidden rounded-2xl border border-(--hx-pastel)/60 bg-(--hx-sunk) shadow-[0_16px_40px_rgb(27,34,51,0.08)]">
              <GambarEvent
                src={eventDipilih.gambarUrl}
                alt={eventDipilih.namaEvent}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
                preload
              />
              <div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-wider text-(--hx-accent) uppercase shadow-sm">
                {eventDipilih.jenisEvent}
              </div>
            </div>

            <div className="rounded-2xl border border-(--hx-pastel)/50 bg-white/90 p-6 shadow-[0_8px_30px_rgb(27,34,51,0.04)]">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-xs font-semibold tracking-wider text-(--hx-ink-3) uppercase">
                  Biaya Kepesertaan
                </span>
                <span className="text-2xl font-bold text-(--hx-accent)">
                  {biaya === 0
                    ? "Gratis"
                    : `Rp ${biaya.toLocaleString("id-ID")}`}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-(--hx-ink-2)">
                {peserta.length} peserta sudah mendaftar pada event ini.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-7">
            <div>
              <span className="mb-2 inline-block text-[11px] font-semibold tracking-[0.2em] text-(--hx-accent) uppercase">
                {eventDipilih.jenisEvent}
              </span>
              <h1 className="text-3xl leading-tight font-semibold tracking-tight text-(--hx-ink) sm:text-4xl">
                {eventDipilih.namaEvent}
              </h1>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-(--hx-pastel)/40 bg-(--hx-pastel)/40 shadow-sm sm:grid-cols-2">
              <Fakta label="Tanggal Pelaksanaan">
                {formatTanggal(eventDipilih.tanggalPelaksanaan)}
              </Fakta>
              <Fakta label="Waktu & Sesi">
                {formatWaktu(eventDipilih.waktuMulai, eventDipilih.waktuSelesai)}
              </Fakta>
              <Fakta label="Lokasi Pertemuan">
                {eventDipilih.lokasi || "Lokasi acara menyusul"}
              </Fakta>
              <Fakta label="Kuota Peserta">
                {eventDipilih.kuotaPeserta || "Tidak ada batasan kuota"}
              </Fakta>
            </div>

            <div className="rounded-2xl border border-(--hx-pastel)/50 bg-white/80 p-6 shadow-[0_8px_30px_rgb(27,34,51,0.04)] sm:p-7">
              <span className="mb-3 block text-[11px] font-semibold tracking-[0.2em] text-(--hx-ink-3) uppercase">
                Deskripsi & Gambaran Acara
              </span>
              <p className="text-sm leading-relaxed font-light text-(--hx-ink-2) sm:text-base">
                {eventDipilih.deskripsi || "Tidak ada deskripsi acara"}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-(--hx-ink)">
            Peserta terdaftar
          </h2>
          {peserta.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white">
              <p className="text-center font-medium text-gray-500">
                Belum ada peserta yang mendaftar pada event ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs tracking-wide text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nomor</th>
                    <th className="px-4 py-3 font-semibold">Nama user</th>
                    <th className="px-4 py-3 font-semibold">ID pendaftaran</th>
                    <th className="px-4 py-3 font-semibold">Email user</th>
                    <th className="px-4 py-3 font-semibold">Nomor telepon</th>
                    <th className="px-4 py-3 font-semibold">ID user</th>
                    <th className="px-4 py-3 font-semibold">Tanggal daftar</th>
                    <th className="px-4 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {peserta.map((baris, index) => (
                    <tr
                      key={baris.idPendaftaran}
                      className="border-t border-gray-100"
                    >
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3">
                        {baris.nama || "Nama belum diisi"}
                      </td>
                      <td className="px-4 py-3">{baris.idPendaftaran}</td>
                      <td className="px-4 py-3">{baris.email}</td>
                      <td className="px-4 py-3">
                        {baris.nomorTelp || "Nomor belum diisi"}
                      </td>
                      <td className="px-4 py-3">{baris.userId}</td>
                      <td className="px-4 py-3">
                        {baris.tanggalDaftar.toLocaleString("id-ID", {
                          dateStyle: "long",
                          timeStyle: "short",
                          timeZone: "Asia/Jakarta",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <HapusPesertaButton
                          idPendaftaran={baris.idPendaftaran}
                          eventId={baris.eventId}
                          nama={baris.nama || "peserta ini"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Fakta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-(--hx-canvas)/90 p-4">
      <span className="mb-1 block text-[10px] font-semibold tracking-wider text-(--hx-ink-3) uppercase">
        {label}
      </span>
      <p className="text-sm font-semibold text-(--hx-ink) sm:text-base">
        {children}
      </p>
    </div>
  );
}

function DetailKerangka() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 h-4 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="h-80 animate-pulse rounded-2xl bg-gray-100 lg:col-span-5" />
        <div className="h-80 animate-pulse rounded-2xl bg-gray-100 lg:col-span-7" />
      </div>
      <div className="mt-12 h-48 animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}
