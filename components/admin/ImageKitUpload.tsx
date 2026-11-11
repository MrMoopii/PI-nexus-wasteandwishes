"use client";

import { useState, useRef, useCallback } from "react";

export type FotoItem = {
  idFoto?: number;
  url: string;
  fileId: string;
  isPrimary: boolean;
  urutan: number;
};

type UploadQueueItem = {
  tempId: string;
  file: File;
  progress: number;
  status: "compressing" | "uploading" | "error";
  errorPesan?: string;
};

type ImageKitUploadProps = {
  existingPhotos: FotoItem[];
  onChange: (photos: FotoItem[], deletedFileIds: string[]) => void;
  disabled?: boolean;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Helper untuk kompresi dan resize di sisi browser
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
  onProgress,
  onXhrCreated,
}: {
  blob: Blob;
  fileName: string;
  authData: { signature: string; expire: number; token: string };
  publicKey: string;
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
    formData.append("folder", "/produk/");
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

export function ImageKitUpload({
  existingPhotos,
  onChange,
  disabled = false,
}: ImageKitUploadProps) {
  const [photos, setPhotos] = useState<FotoItem[]>(existingPhotos);
  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeXhrMap = useRef<Map<string, XMLHttpRequest>>(new Map());

  const updatePhotos = useCallback(
    (newPhotos: FotoItem[], newDeletedIds: string[]) => {
      const normalized = newPhotos.map((p, idx) => ({
        ...p,
        urutan: idx,
        isPrimary: idx === 0 || p.isPrimary,
      }));

      const hasPrimary = normalized.some((p) => p.isPrimary);
      if (!hasPrimary && normalized.length > 0) {
        normalized[0].isPrimary = true;
      }

      setPhotos(normalized);
      onChange(normalized, newDeletedIds);
    },
    [onChange],
  );

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

      const newPhoto: FotoItem = {
        url: result.url,
        fileId: result.fileId,
        isPrimary: photos.length === 0,
        urutan: photos.length,
      };

      setUploadQueue((prev) => prev.filter((item) => item.tempId !== tempId));

      setPhotos((prev) => {
        const nextPhotos = [...prev, newPhoto];
        updatePhotos(nextPhotos, deletedFileIds);
        return nextPhotos;
      });
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

    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!ALLOWED_TYPES.includes(file.type)) {
        setValidationError(
          `Format file "${file.name}" tidak didukung. Hanya file JPG, JPEG, PNG, dan WEBP yang diizinkan.`,
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setValidationError(
          `Ukuran file "${file.name}" melebihi batas maksimal 5 MB.`,
        );
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const newQueueItems: UploadQueueItem[] = validFiles.map((file, idx) => ({
      tempId: `upload-${idx}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      progress: 0,
      status: "compressing",
    }));

    setUploadQueue((prev) => [...prev, ...newQueueItems]);

    newQueueItems.forEach((item) => {
      handleUploadFile(item.file, item.tempId);
    });
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

  const handleDeletePhoto = (indexToDelete: number) => {
    const photoToDelete = photos[indexToDelete];
    const newDeleted = photoToDelete.fileId
      ? [...deletedFileIds, photoToDelete.fileId]
      : deletedFileIds;

    setDeletedFileIds(newDeleted);

    const remainingPhotos = photos.filter((_, idx) => idx !== indexToDelete);
    updatePhotos(remainingPhotos, newDeleted);
  };

  const handleSetPrimary = (targetIndex: number) => {
    const updated = photos.map((p, idx) => ({
      ...p,
      isPrimary: idx === targetIndex,
    }));

    const primaryPhoto = updated[targetIndex];
    const rest = updated.filter((_, idx) => idx !== targetIndex);
    const reordered = [primaryPhoto, ...rest].map((p, idx) => ({
      ...p,
      urutan: idx,
    }));

    updatePhotos(reordered, deletedFileIds);
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const newIndex = direction === "left" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const list = [...photos];
    const [moved] = list.splice(index, 1);
    list.splice(newIndex, 0, moved);

    const reordered = list.map((p, idx) => ({
      ...p,
      urutan: idx,
      isPrimary: idx === 0,
    }));

    updatePhotos(reordered, deletedFileIds);
  };

  const handleRetryUpload = (item: UploadQueueItem) => {
    setUploadQueue((prev) =>
      prev.map((q) =>
        q.tempId === item.tempId
          ? { ...q, status: "compressing", errorPesan: undefined, progress: 0 }
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          Foto Produk
        </label>
        <span className="text-xs text-slate-500">
          {photos.length} foto tersimpan
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
          multiple
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
              Seret dan lepaskan foto ke sini, atau{" "}
              <span className="text-blue-600 hover:underline">pilih file</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Mendukung JPG, JPEG, PNG, WEBP hingga 5 MB per foto. Otomatis
              dikompresi ke WebP sebelum diupload.
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

      {/* Upload Queue (Sedang diupload / Error) */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Proses Upload
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Grid Foto Tersimpan */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Daftar Foto (Foto pertama adalah foto utama)
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo, idx) => (
              <div
                key={photo.fileId || photo.url || idx}
                className={`relative group bg-white border-2 rounded-xl overflow-hidden shadow-xs transition-all ${
                  photo.isPrimary
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Badge Foto Utama */}
                {photo.isPrimary && (
                  <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    Foto Utama
                  </div>
                )}

                {/* Thumbnail */}
                <div className="relative aspect-square bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Action Toolbar */}
                <div className="p-2 bg-white flex items-center justify-between border-t border-slate-100 gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "left")}
                      disabled={idx === 0 || disabled}
                      title="Geser ke kiri"
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, "right")}
                      disabled={idx === photos.length - 1 || disabled}
                      title="Geser ke kanan"
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                    >
                      →
                    </button>
                  </div>

                  {!photo.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      disabled={disabled}
                      className="text-[10px] text-blue-600 hover:underline px-1"
                    >
                      Jadikan Utama
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(idx)}
                    disabled={disabled}
                    title="Hapus foto"
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
