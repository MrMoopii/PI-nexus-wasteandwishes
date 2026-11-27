import type { ReactNode } from "react";
import type { HalamanKendala } from "@/features/kunjungan/queries/kendala";
import { FormPengganti } from "./form-pengganti";
import { FormTanggapan } from "./form-tanggapan";
import { KartuLaporan } from "./kartu-laporan";

type KelompokProps = {
  judul: string;
  keterangan: string;
  jumlah: number;
  /** Kartu laporan kelompok ini. */
  children: ReactNode;
};

/** Satu kelompok laporan di kotak masuk; tidak dirender jika kosong. */
function Kelompok({ judul, keterangan, jumlah, children }: KelompokProps) {
  if (jumlah === 0) return null;
  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900">
        {judul} ({jumlah})
      </h3>
      <p className="mt-0.5 text-xs text-gray-500">{keterangan}</p>
      <ul className="divide-y divide-gray-100">{children}</ul>
    </div>
  );
}

/**
 * Kotak masuk admin: semua laporan yang menunggu tanggapan, terlama dulu, dalam tiga
 * kelompok. Setiap laporan punya form tanggapan sesuai jenisnya. Hanya menerima props.
 */
export function KotakMasuk({
  menunggu,
  hariIni,
}: Pick<HalamanKendala, "menunggu" | "hariIni">) {
  const jumlah =
    menunggu.usulan.length + menunggu.kendala.length + menunggu.lewati.length;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400">
        Menunggu tanggapan ({jumlah})
      </h2>
      {jumlah === 0 ? (
        <p className="py-10 text-center text-sm font-medium text-gray-500">
          Tidak ada laporan yang menunggu tanggapan.
        </p>
      ) : (
        <div className="mt-4 space-y-8">
          <Kelompok
            judul="Lewati dengan usulan tanggal pengganti"
            keterangan="Kunjungan asal sudah dilewati. Setujui usulan, pilih tanggal lain, atau tolak."
            jumlah={menunggu.usulan.length}
          >
            {menunggu.usulan.map((laporan) => (
              <KartuLaporan key={laporan.idLaporan} laporan={laporan}>
                <FormPengganti
                  idLaporan={laporan.idLaporan}
                  tanggalDilewati={laporan.tanggalKunjungan}
                  tanggalUsulan={laporan.tanggalPengganti}
                  hariIni={hariIni}
                  akhirLanggananAktif={laporan.akhirLanggananAktif}
                />
              </KartuLaporan>
            ))}
          </Kelompok>

          <Kelompok
            judul="Laporan kendala"
            keterangan="Pelanggan melaporkan kendala pada satu kunjungan."
            jumlah={menunggu.kendala.length}
          >
            {menunggu.kendala.map((laporan) => (
              <KartuLaporan key={laporan.idLaporan} laporan={laporan}>
                <FormTanggapan
                  idLaporan={laporan.idLaporan}
                  contoh="Contoh: Maaf atas kendalanya. Ember akan kami antar besok pagi."
                />
              </KartuLaporan>
            ))}
          </Kelompok>

          <Kelompok
            judul="Lewati tanpa tanggal pengganti"
            keterangan="Sudah berlaku: kunjungan langsung dilewati saat pelanggan mengirim alasannya."
            jumlah={menunggu.lewati.length}
          >
            {menunggu.lewati.map((laporan) => (
              <KartuLaporan key={laporan.idLaporan} laporan={laporan}>
                <FormTanggapan
                  idLaporan={laporan.idLaporan}
                  contoh="Contoh: Baik, pengambilan tanggal itu kami lewati. Terima kasih infonya."
                />
              </KartuLaporan>
            ))}
          </Kelompok>
        </div>
      )}
    </section>
  );
}
