"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ImageKitEventUpload, {
  type ImageKitEventUploadHandle,
} from "@/components/admin/ImageKitEventUpload";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  tambahEvent,
  ubahEvent,
  type HasilAksiEvent,
} from "@/features/event/actions/admin";
import type { EventTampilan } from "@/features/event/types";
import type { IsianEvent } from "@/features/event/validasi/admin";
import { InputEvent } from "./event-forms/input-field";
import { PilihPeran } from "./event-forms/pilih-peran";
import { StatusSelect } from "./event-forms/status-select";

// Form admin event (kode tugas 3.3). Terpecah ke beberapa subkomponen agar
// tidak melebihi batas 300 baris (CONTRIBUTING 4.2 no. 9).

type PosterItem = {
  url: string;
  fileId: string;
};

type FormEventProps = {
  /** Event yang diubah; kosong berarti form tambah. */
  event?: EventTampilan;
  /** Tab daftar yang menjadi tujuan tombol batal. */
  fromTab: string;
};

/**
 * Form admin untuk menambah event, atau mengubah event jika prop event diisi.
 */
export function FormEvent({ event, fromTab }: FormEventProps) {
  const router = useRouter();
  const [hasil, aksi, sedangMenyimpan] = useActionState<
    HasilAksiEvent | null,
    FormData
  >(event ? ubahEvent : tambahEvent, null);
  const gagal = hasil?.ok === false ? hasil : null;

  // Saat gagal, tampilkan lagi yang diketik; selain itu nilai tersimpan (ubah) atau kosong (tambah).
  const nilai = gagal?.nilai ?? {};
  const nilaiTeks = (nama: IsianEvent, bawaan: string) => nilai[nama] ?? bawaan;

  // Poster yang tersimpan.
  const [poster, setPoster] = useState<PosterItem | null>(() => {
    if (event?.gambarUrl) {
      return { url: event.gambarUrl, fileId: "" };
    }
    return null;
  });
  const [deletedFileId, setDeletedFileId] = useState<string | null>(null);
  const uploadRef = useRef<ImageKitEventUploadHandle>(null);

  // Hitung apakah event di masa lalu supaya status otomatis menjadi "lalu".
  const tanggal = nilaiTeks("tanggalPelaksanaan", event?.tanggalPelaksanaan ?? "");
  const waktuSelesai = nilaiTeks("waktuSelesai", event?.waktuSelesai ?? "");
  let isPastEvent = false;
  if (tanggal) {
    const eventDate = new Date(tanggal);
    if (waktuSelesai) {
      const [hours, minutes] = waktuSelesai.split(":");
      eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    } else {
      eventDate.setHours(23, 59, 59, 999);
    }
    isPastEvent = eventDate < new Date();
  }

  const statusBawaan = isPastEvent
    ? "lalu"
    : (event?.statusEvent === "lalu" ? "draft" : event?.statusEvent ?? "draft");

  const handlePosterChange = (p: PosterItem | null, d: string | null) => {
    setPoster(p);
    setDeletedFileId(d);
  };

  const aksiDenganPoster = async (formData: FormData) => {
    const hasPending = uploadRef.current?.hasPending() ?? false;
    const uploaded = await uploadRef.current?.flushPending();
    if (hasPending && !uploaded) return;

    formData.set("gambarUrl", uploaded?.url ?? poster?.url ?? "");
    formData.set("gambarFileId", uploaded?.fileId ?? poster?.fileId ?? "");
    if (deletedFileId) formData.set("deletedPosterFileId", deletedFileId);
    aksi(formData);
  };

  return (
    <form action={aksiDenganPoster} noValidate className="space-y-6">
      {event && <input type="hidden" name="idEvent" value={event.idEvent} />}
      <div className="flex items-center gap-4 mb-2">
        <Button varian="garis" onClick={() => router.push(`/admin/events?tab=${fromTab}`)}>
          ← Batal
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {event ? "Edit Event" : "Buat Event Baru"}
        </h1>
      </div>

      {gagal && <Alert varian="gagal">{gagal.pesan}</Alert>}
      {hasil?.ok === true && <Alert varian="sukses">{hasil.pesan}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputEvent
          nama="namaEvent"
          label="Nama Event"
          error={gagal?.galat?.namaEvent?.[0]}
          defaultValue={nilaiTeks("namaEvent", event?.namaEvent ?? "")}
          placeholder="Contoh: Workshop Copywriting for Beginners"
          className="md:col-span-2"
        />

        <InputEvent
          nama="jenisEvent"
          label="Jenis / Kategori Event"
          error={gagal?.galat?.jenisEvent?.[0]}
          defaultValue={nilaiTeks("jenisEvent", event?.jenisEvent ?? "")}
          placeholder="Contoh: Workshop & Pelatihan"
        />

        <InputEvent
          nama="penyelenggara"
          label="Penyelenggara"
          error={gagal?.galat?.penyelenggara?.[0]}
          defaultValue={nilaiTeks("penyelenggara", event?.penyelenggara ?? "")}
          placeholder="Contoh: Dinas Lingkungan Hidup"
        />

        <PilihPeran
          error={gagal?.galat?.peranWw?.[0]}
          nilaiPeran={nilaiTeks("peranWw", "")}
          event={event}
        />

        <InputEvent
          nama="tautanInfo"
          label="Tautan Info (opsional, harus https://)"
          tipe="url"
          required={false}
          error={gagal?.galat?.tautanInfo?.[0]}
          defaultValue={nilaiTeks("tautanInfo", event?.tautanInfo ?? "")}
          placeholder="https://contoh.id/acara"
          className="md:col-span-2"
        />

        <InputEvent
          nama="tanggalPelaksanaan"
          label="Tanggal Pelaksanaan"
          tipe="date"
          error={gagal?.galat?.tanggalPelaksanaan?.[0]}
          defaultValue={nilaiTeks("tanggalPelaksanaan", event?.tanggalPelaksanaan ?? "")}
        />

        <div className="grid grid-cols-2 gap-4">
          <InputEvent
            nama="waktuMulai"
            label="Jam Mulai"
            tipe="time"
            required={false}
            error={gagal?.galat?.waktuMulai?.[0]}
            defaultValue={nilaiTeks("waktuMulai", event?.waktuMulai ?? "")}
          />
          <InputEvent
            nama="waktuSelesai"
            label="Jam Selesai"
            tipe="time"
            required={false}
            error={gagal?.galat?.waktuSelesai?.[0]}
            defaultValue={waktuSelesai}
          />
        </div>

        <InputEvent
          nama="lokasi"
          label="Venue & Lokasi"
          maxLength={300}
          error={gagal?.galat?.lokasi?.[0]}
          defaultValue={nilaiTeks("lokasi", event?.lokasi ?? "")}
          placeholder="Contoh: JIExpo Kemayoran, Jakarta Pusat"
          className="md:col-span-2"
        />

        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <ImageKitEventUpload
            ref={uploadRef}
            existingPoster={poster}
            onChange={handlePosterChange}
            disabled={sedangMenyimpan}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
        <StatusSelect
          defaultValue={nilaiTeks("statusEvent", statusBawaan)}
          isPastEvent={isPastEvent}
          error={gagal?.galat?.statusEvent?.[0]}
        />
        <Button type="submit" disabled={sedangMenyimpan}>
          {sedangMenyimpan ? "Menyimpan…" : (event ? "Simpan Perubahan" : "Simpan Event")}
        </Button>
      </div>
    </form>
  );
}
