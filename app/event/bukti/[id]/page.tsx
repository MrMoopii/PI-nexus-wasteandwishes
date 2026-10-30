import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRegistrationProof } from "@/app/event/actions";
import PrintProofButton from "@/components/PrintProofButton";

export const instant = false;

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function EventRegistrationProofPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.idUser) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const result = await getRegistrationProof(id);

  if (!result.ok || !result.registration) {
    notFound();
  }

  const registration = result.registration;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 print-proof-page">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm print-proof-shell">
        <div className="border-b border-gray-200 bg-teal-600 px-6 py-5 text-white print-proof-header">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-100">
            Bukti Pendaftaran
          </p>
          <h1 className="mt-2 text-2xl font-bold">Event Waste & Wishes</h1>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Data Pendaftar
            </p>
            <div>
              <p className="text-sm text-gray-500">Nomor pendaftaran</p>
              <p className="text-lg font-bold text-gray-900">
                #{registration.idPendaftaran}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nama</p>
              <p className="text-lg font-semibold text-gray-900">
                {registration.namaPelanggan}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{registration.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nomor telepon</p>
              <p className="text-gray-900">{registration.nomorTelp}</p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              Data Event
            </p>
            <div>
              <p className="text-sm text-gray-500">Nama event</p>
              <p className="text-lg font-bold text-gray-900">
                {registration.namaEvent}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jenis event</p>
              <p className="text-gray-900">{registration.jenisEvent}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tanggal pelaksanaan</p>
              <p className="text-gray-900">
                {formatDate(registration.tanggalPelaksanaan)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Biaya</p>
              <p className="text-gray-900">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(Number(registration.biayaEvent ?? 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-5">
          <div className="flex flex-col gap-2 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <p>
              Tanggal daftar:{" "}
              <span className="font-semibold text-gray-900">
                {formatDate(registration.tanggalDaftar)}
              </span>
            </p>
            <p>
              Status:{" "}
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] text-green-700">
                Berhasil
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PrintProofButton />
      </div>
    </main>
  );
}
