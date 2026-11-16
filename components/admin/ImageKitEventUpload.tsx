"use client";

import { useState, useRef } from "react";

// Komponen khusus untuk mengunggah satu poster event ke ImageKit.
// Mengikuti pola ImageKitUpload produk, tetapi untuk satu gambar saja
// sehingga cocok dengan kolom events.gambar_url / events.gambar_file_id.

type PosterItem = {
  url: string;
  fileId: string;
};

type UploadQueueItem = {
  tempId: string;
  file: File;
  progress: number;
  status: "compressing" | "uploading" | "error";
  errorPesan?: string;
};

type ImageKitEventUploadProps = {
  existingPoster: PosterItem | null;
  onChange: (poster: PosterItem | null, deletedFileId: string | null) => void;
  disabled?: boolean;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Kompresi & resize di sisi browser agar upload ringan.
async function compressImage(
  file: File,
  maxWidth = 1600,
  quality = 0.82,
): Promise<{ blob: Blob; fileName: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Gagal memproses gambar di browser."));
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const baseName =
                file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
              resolve({
                blob,
                fileName: `${baseName.replace(/\s+/g, "_")}.webp`,
              });
            } else {
              resolve({ blob: file, fileName: file.name });
            }
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = () =>
        reject(new Error("File gambar rusak atau tidak dapat dibaca."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
    reader.readAsDataURL(file);
  });
}

function uploadToImageKit({
  blob,
  fileName,
  authData,
  publicKey,
  folder,
  onProgress,
  onXhrCreated,
}: {
  blob: Blob;
  fileName: string;
  authData: { signature: string; expire: number; token: string };
  publicKey: string;
  folder: string;
  onProgress: (percent: number) => void;
  onXhrCreated: (xhr: XMLHttpRequest) => void;
}): Promise<{ url: string; fileId: string }> {
  return new Promise((resolve, reject) => {
    const uniqueFileName = `${Math.floor(Date.now() / 1000)}_${fileName}`;
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("fileName", uniqueFileName);
    formData.append("publicKey", publicKey);
    formData.append("signature", authData.signature);
    formData.append("expire", authData.expire.toString());
    formData.append("token", authData.token);
    formData.append("folder", folder);
    formData.append("useUniqueFileName", "true");

    const xhr = new XMLHttpRequest();
    onXhrCreated(xhr);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve({ url: res.url, fileId: res.fileId });
        } catch {
          reject(new Error("Format respons ImageKit tidak dikenali."));
        }
      } else {
        let errorMsg = `Upload gagal (${xhr.status})`;
        try {
          const errObj = JSON.parse(xhr.responseText);
          if (errObj.message) errorMsg = errObj.message;
        } catch {}
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Koneksi jaringan terputus saat mengunggah."));
    };

    xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");
    xhr.send(formData);
  });
}

export function ImageKitEventUpload({
  existingPoster,
  onChange,
  disabled = false,
}: ImageKitEventUploadProps) {
  const [poster, setPoster] = useState<PosterItem | null>(existingPoster);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeXhrMap = useRef<Map<string, XMLHttpRequest>>(new Map());

  const handleUploadFile = async (file: File, tempId: string) => {
    try {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.tempId === tempId ? { ...item, status: "compressing" } : item,
        ),
      );

      const { blob, fileName } = await compressImage(file);

      const authRes = await fetch("/api/admin/imagekit-auth");
      if (!authRes.ok) {
        const errorData = await authRes.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Gagal mendapatkan izin upload dari server.",
        );
      }
      const authData = await authRes.json();

      const publicKey =
        authData.publicKey ||
        process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
        process.env.NEXT_PUBLIC_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error(
          "Public key ImageKit belum disetel di environment variables.",
        );
      }

      setUploadQueue((prev) =>
        prev.map((item) =>
          item.tempId === tempId
            ? { ...item, status: "uploading", progress: 0 }
            : item,
        ),
      );

      const result = await uploadToImageKit({
        blob,
        fileName,
        authData,
        publicKey,
        folder: "/event/",
        onProgress: (percent) => {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.tempId === tempId ? { ...item, progress: percent } : item,
            ),
          );
        },
        onXhrCreated: (xhr) => {
          activeXhrMap.current.set(tempId, xhr);
        },
      });

      activeXhrMap.current.delete(tempId);

      const newPoster: PosterItem = {
        url: result.url,
        fileId: result.fileId,
      };

      setUploadQueue((prev) =>
        prev.filter((item) => item.tempId !== tempId),
      );

      // Ganti poster lama (fileId lama ikut dihapus dari ImageKit)
      const deletedFileId =
        poster && poster.fileId !== newPoster.fileId ? poster.fileId : null;
      setPoster(newPoster);
      onChange(newPoster, deletedFileId);
    } catch (err: unknown) {
      activeXhrMap.current.delete(tempId);
      const pesan =
        err instanceof Error ? err.message : "Terjadi kesalahan saat upload.";
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.tempId === tempId
            ? { ...item, status: "error", errorPesan: pesan }
            : item,
        ),
      );
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setValidationError(null);

    // Hanya ambil file pertama; poster event bersifat tunggal
    const file = files[0];

    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError(
        `Format file "${file.name}" tidak didukung. Hanya file JPG, JPEG, PNG, dan WEBP yang diizinkan.`,
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(
        `Ukuran file "${file.name}" melebihi batas maksimal 5 MB.`,
      );
      return;
    }

    const tempId = `upload-${crypto.randomUUID()}`;
    setUploadQueue((prev) => [
      ...prev,
      {
        tempId,
        file,
        progress: 0,
        status: "compressing",
      },
    ]);

    handleUploadFile(file, tempId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDeletePoster = () => {
    const deletedFileId = poster?.fileId || null;
    setPoster(null);
    onChange(null, deletedFileId);
  };

  const handleRetryUpload = (item: UploadQueueItem) => {
    setUploadQueue((prev) =>
      prev.map((q) =>
        q.tempId === item.tempId
          ? {
              ...q,
              status: "compressing",
              errorPesan: undefined,
              progress: 0,
            }
          : q,
      ),
    );
    handleUploadFile(item.file, item.tempId);
  };

  const handleCancelUpload = (tempId: string) => {
    const xhr = activeXhrMap.current.get(tempId);
    if (xhr) {
      xhr.abort();
      activeXhrMap.current.delete(tempId);
    }
    setUploadQueue((prev) => prev.filter((q) => q.tempId !== tempId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          Poster Event
        </label>
        <span className="text-xs text-slate-500">
          {poster ? "1 poster tersimpan" : "Belum ada poster"}
        </span>
      </div>

      {/* Area Drag and Drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50/50"
            : "border-slate-300 hover:border-slate-400 bg-slate-50/60"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
          accept=".jpg,.jpeg,.png,.webp"
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
            📁
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Seret dan lepaskan poster ke sini, atau{" "}
              <span className="text-blue-600 hover:underline">pilih file</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Mendukung JPG, JPEG, PNG, WEBP hingga 5 MB. Otomatis dikompresi
              ke WebP sebelum diupload.
            </p>
          </div>
        </div>
      </div>

      {/* Error Validasi Klien */}
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center justify-between">
          <span>{validationError}</span>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Proses Upload
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {uploadQueue.map((item) => (
              <div
                key={item.tempId}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-xs"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 text-xs shrink-0 overflow-hidden">
                  {item.file.name.slice(-4)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {item.file.name}
                  </p>

                  {item.status === "compressing" && (
                    <p className="text-[11px] text-amber-600">
                      Mengompresi gambar...
                    </p>
                  )}

                  {item.status === "uploading" && (
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Mengunggah...</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-200"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {item.status === "error" && (
                    <p className="text-[11px] text-red-600 mt-1 truncate">
                      {item.errorPesan || "Gagal mengunggah"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {item.status === "error" && (
                    <button
                      type="button"
                      onClick={() => handleRetryUpload(item)}
                      title="Coba lagi"
                      className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      Ulangi
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCancelUpload(item.tempId)}
                    title="Batal"
                    className="p-1 text-slate-400 hover:text-slate-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Poster Tersimpan */}
      {poster && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Poster Saat Ini
            </h4>
            <button
              type="button"
              onClick={handleDeletePoster}
              disabled={disabled}
              className="text-xs text-red-500 hover:underline disabled:opacity-50"
            >
              Hapus Poster
            </button>
          </div>

          <div className="relative bg-white border-2 border-blue-500 ring-2 ring-blue-200 rounded-xl overflow-hidden">
            <div className="aspect-video bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poster.url}
                alt="Poster event"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
