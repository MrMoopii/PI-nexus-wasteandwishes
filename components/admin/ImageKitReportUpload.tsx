"use client";

import { useRef, useState } from "react";

type FotoLaporan = { url: string; fileId: string };

type ImageKitReportUploadProps = {
  foto: FotoLaporan | null;
  onChange: (foto: FotoLaporan | null) => void;
  disabled?: boolean;
};

const JENIS_DIIJINKAN = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const UKURAN_MAKSIMAL = 100 * 1024 * 1024;

async function kompresFoto(
  file: File,
): Promise<{ blob: Blob; namaFile: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.onload = () => {
      const gambar = new Image();
      gambar.onerror = () =>
        reject(new Error("File gambar rusak atau tidak dapat dibaca."));
      gambar.onload = () => {
        const rasio = Math.min(1, 1600 / gambar.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(gambar.width * rasio);
        canvas.height = Math.round(gambar.height * rasio);
        const konteks = canvas.getContext("2d");
        if (!konteks) {
          reject(new Error("Gagal memproses gambar di browser."));
          return;
        }
        konteks.drawImage(gambar, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Gagal mengompresi gambar."));
              return;
            }
            const namaDasar = file.name
              .replace(/\.[^.]+$/, "")
              .replace(/\s+/g, "_");
            resolve({ blob, namaFile: `${namaDasar || "foto-laporan"}.webp` });
          },
          "image/webp",
          0.82,
        );
      };
      gambar.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ImageKitReportUpload({
  foto,
  onChange,
  disabled = false,
}: ImageKitReportUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sedangUpload, setSedangUpload] = useState(false);
  const [sedangDrag, setSedangDrag] = useState(false);
  const [pesanError, setPesanError] = useState("");

  const unggah = async (file: File | undefined) => {
    if (!file) return;
    setPesanError("");
    if (!JENIS_DIIJINKAN.includes(file.type)) {
      setPesanError("Format file harus JPG, JPEG, PNG, atau WEBP.");
      return;
    }
    if (file.size > UKURAN_MAKSIMAL) {
      setPesanError("Ukuran file maksimal 100 MB.");
      return;
    }

    setSedangUpload(true);
    try {
      const { blob, namaFile } = await kompresFoto(file);
      const authResponse = await fetch("/api/admin/imagekit-auth");
      const authData: unknown = await authResponse.json();
      if (
        !authResponse.ok ||
        typeof authData !== "object" ||
        authData === null ||
        !("signature" in authData) ||
        !("expire" in authData) ||
        !("token" in authData) ||
        !("publicKey" in authData)
      ) {
        const error =
          typeof authData === "object" &&
          authData !== null &&
          "error" in authData &&
          typeof authData.error === "string"
            ? authData.error
            : "Gagal mendapatkan izin upload dari server.";
        throw new Error(error);
      }

      const formData = new FormData();
      formData.append("file", blob, namaFile);
      formData.append("fileName", `${Date.now()}_${namaFile}`);
      formData.append("publicKey", String(authData.publicKey));
      formData.append("signature", String(authData.signature));
      formData.append("expire", String(authData.expire));
      formData.append("token", String(authData.token));
      formData.append("folder", "/laporan-pengambilan/");
      formData.append("useUniqueFileName", "true");

      const uploadResponse = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        { method: "POST", body: formData },
      );
      const uploadData: unknown = await uploadResponse.json();
      if (
        !uploadResponse.ok ||
        typeof uploadData !== "object" ||
        uploadData === null ||
        !("url" in uploadData) ||
        typeof uploadData.url !== "string" ||
        !("fileId" in uploadData) ||
        typeof uploadData.fileId !== "string"
      ) {
        const error =
          typeof uploadData === "object" &&
          uploadData !== null &&
          "message" in uploadData &&
          typeof uploadData.message === "string"
            ? uploadData.message
            : "Upload foto ke ImageKit gagal.";
        throw new Error(error);
      }
      onChange({ url: uploadData.url, fileId: uploadData.fileId });
    } catch (error) {
      console.error("Gagal mengunggah foto laporan ke ImageKit:", error);
      setPesanError(
        error instanceof Error ? error.message : "Upload foto gagal.",
      );
    } finally {
      setSedangUpload(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          Foto bukti pengambilan
        </span>
        <span className="text-xs text-slate-500">
          {foto ? "Foto sudah dipilih" : "Belum ada foto"}
        </span>
      </div>
      <button
        type="button"
        disabled={disabled || sedangUpload}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !sedangUpload) setSedangDrag(true);
        }}
        onDragLeave={() => setSedangDrag(false)}
        onDrop={(event) => {
          event.preventDefault();
          setSedangDrag(false);
          void unggah(event.dataTransfer.files[0]);
        }}
        className={`flex min-h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${sedangDrag ? "border-blue-500 bg-blue-50" : "border-slate-400 hover:bg-slate-100"} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          disabled={disabled || sedangUpload}
          onChange={(event) => void unggah(event.target.files?.[0])}
        />
        <span
          className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl"
          aria-hidden="true"
        >
          📁
        </span>
        <span className="text-sm font-semibold text-slate-800">
          {sedangUpload ? (
            "Mengunggah foto..."
          ) : (
            <>
              Seret dan lepaskan foto ke sini, atau{" "}
              <span className="text-blue-600">pilih file</span>
            </>
          )}
        </span>
        <span className="mt-1 text-xs text-slate-500">
          Mendukung JPG, JPEG, PNG, WEBP hingga 5 MB. Otomatis dikompresi ke
          WebP sebelum diupload.
        </span>
      </button>
      {foto && (
        <p className="mt-2 truncate text-xs text-slate-600">{foto.url}</p>
      )}
      {pesanError && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {pesanError}
        </p>
      )}
    </div>
  );
}
