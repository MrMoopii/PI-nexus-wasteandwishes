import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatTanggal } from "@/lib/format-tanggal";
import type { KeadaanLangganan } from "@/lib/langganan";

/** Keadaan yang punya kartu; "belum_berlangganan" tidak ditampilkan. */
type KeadaanTampil = Exclude<KeadaanLangganan, "belum_berlangganan">;

const TAMPILAN: Record<
  KeadaanTampil,
  { label: string; varian: NonNullable<BadgeProps["varian"]> }
> = {
  aktif: { label: "Aktif", varian: "sukses" },
  berakhir: { label: "Berakhir", varian: "peringatan" },
  dihentikan: { label: "Dihentikan", varian: "bahaya" },
};

type KartuKeadaanLanggananProps = {
  /** Hasil keadaanLangganan() dari lib/langganan.ts, bukan status mentah. */
  keadaan: KeadaanTampil;
  tanggalMulai: string | null;
  tanggalAkhir: string | null;
};

/** Kartu langganan yang sudah dibayar: keadaan dan masa berlakunya. */
export function KartuKeadaanLangganan({
  keadaan,
  tanggalMulai,
  tanggalAkhir,
}: KartuKeadaanLanggananProps) {
  const { label, varian } = TAMPILAN[keadaan];

  return (
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Status langganan
        </h2>
        <Badge varian={varian}>{label}</Badge>
      </div>

      {keadaan === "dihentikan" && (
        <p className="text-sm text-slate-600">
          Langganan Anda dihentikan. Hubungi tim Waste and Wishes untuk
          informasi lebih lanjut.
        </p>
      )}

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Mulai
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {tanggalMulai ? formatTanggal(tanggalMulai) : "-"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-500">
            Berakhir
          </dt>
          <dd className="mt-1 text-sm font-medium text-slate-900">
            {tanggalAkhir ? formatTanggal(tanggalAkhir) : "-"}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
