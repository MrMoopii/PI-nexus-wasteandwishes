"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

export type FotoItem = {
  idFoto?: number;
  url: string;
  fileId: string;
  isPrimary: boolean;
  urutan: number;
};

export type ImageKitUploadHandle = {
  /** File-file yang masih di-staging (belum diupload). */
  getPendingFiles: () => { file: File; tempId: string }[];
  /**
   * Upload semua pending file ke ImageKit. Dipanggil oleh form parent
   * saat tombol submit, setelah validasi lolos. Mengembalikan daftar
   * hasil upload (url + fileId) dan daftar error per file.
   */
  flushPending: () => Promise<
    {
      results: { url: string; fileId: string; tempId: string }[];
      errors: { tempId: string; pesan: string }[];
    }
  >;
  /** Set upload progress untuk satu tempId (dipakai form untuk render UI). */
  setProgress: (
    tempId: string,
    percent: number,
    status: "compressing" | "uploading" | "error",
    pesan?: string,
  ) => void;
  /** Bersihkan pending setelah flush sukses (hapus object URL). */
  clearPending: () => void;
};

type UploadQueueItem = {
  tempId: string;
  file: File;
  progress: number;
  status: "compressing" | "uploading" | "error";
  errorPesan?: string;
};

type PendingFile = {
  tempId: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
  urutan: number;
};

type ImageKitUploadProps = {
  existingPhotos: FotoItem[];
  onChange: (photos: FotoItem[], deletedFileIds: string[]) => void;
  disabled?: boolean;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

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
}: {
  blob: Blob;
  fileName: string;
  authData: { signature: string; expire: number; token: string };
  publicKey: string;
  onProgress: (percent: number) => void;
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

const ImageKitUpload = forwardRef<ImageKitUploadHandle, ImageKitUploadProps>(
  function ImageKitUpload({ existingPhotos, onChange, disabled = false }, ref) {
    const [photos, setPhotos] = useState<FotoItem[]>(existingPhotos);
    const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);
    const [pending, setPending] = useState<PendingFile[]>([]);
    const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingRef = useRef<PendingFile[]>([]);
    pendingRef.current = pending;

    // Bersihkan preview object URL saat unmount
    useEffect(() => {
      return () => {
        pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      };
    }, []);

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

    // EKSPOSE VIA REF — dipanggil form parent
    useImperativeHandle(
      ref,
      () => ({
        getPendingFiles: () =>
          pendingRef.current.map((p) => ({ file: p.file, tempId: p.tempId })),

        flushPending: async () => {
          const results: { url: string; fileId: string; tempId: string }[] = [];
          const errors: { tempId: string; pesan: string }[] = [];

          for (const p of pendingRef.current) {
            // Tambahkan ke queue untuk ditampilkan
            setUploadQueue((prev) => [
              ...prev,
              {
                tempId: p.tempId,
                file: p.file,
                progress: 0,
                status: "compressing",
              },
            ]);

            try {
              const { blob, fileName } = await compressImage(p.file);

              const authRes = await fetch("/api/admin/imagekit-auth");
              if (!authRes.ok) {
                const errorData = await authRes.json().catch(() => ({}));
                const pesan =
                  errorData.error ||
                  "Gagal mendapatkan izin upload dari server.";
                setUploadQueue((prev) =>
                  prev.map((q) =>
                    q.tempId === p.tempId
                      ? { ...q, status: "error", errorPesan: pesan }
                      : q,
                  ),
                );
                errors.push({ tempId: p.tempId, pesan });
                continue;
              }
              const authData = await authRes.json();

              const publicKey =
                authData.publicKey ||
                process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
                process.env.NEXT_PUBLIC_PUBLIC_KEY;
              if (!publicKey) {
                const pesan =
                  "Public key ImageKit belum disetel di environment variables.";
                setUploadQueue((prev) =>
                  prev.map((q) =>
                    q.tempId === p.tempId
                      ? { ...q, status: "error", errorPesan: pesan }
                      : q,
                  ),
                );
                errors.push({ tempId: p.tempId, pesan });
                continue;
              }

              setUploadQueue((prev) =>
                prev.map((q) =>
                  q.tempId === p.tempId
                    ? { ...q, status: "uploading", progress: 0 }
                    : q,
                ),
              );

              const { url, fileId } = await uploadToImageKit({
                blob,
                fileName,
                authData,
                publicKey,
                onProgress: (percent) => {
                  setUploadQueue((prev) =>
                    prev.map((q) =>
                      q.tempId === p.tempId
                        ? { ...q, progress: percent }
                        : q,
                    ),
                  );
                },
              });

              results.push({ url, fileId, tempId: p.tempId });
            } catch (err: unknown) {
              const pesan =
                err instanceof Error
                  ? err.message
                  : "Terjadi kesalahan saat upload.";
              setUploadQueue((prev) =>
                prev.map((q) =>
                  q.tempId === p.tempId
                    ? { ...q, status: "error", errorPesan: pesan }
                    : q,
                ),
              );
              errors.push({ tempId: p.tempId, pesan });
            }
          }

          return { results, errors };
        },

        setProgress: (tempId, percent, status, pesan) => {
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.tempId === tempId
                ? { ...q, progress: percent, status, errorPesan: pesan }
                : q,
            ),
          );
        },

        clearPending: () => {
          pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
          setPending([]);
          setUploadQueue([]);
        },
      }),
      [],
    );

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
            `Ukuran file "${file.name}" melebihi batas maksimal 20 MB.`,
          );
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Staging: buat object URL untuk preview, belum upload ke ImageKit
      const newPending: PendingFile[] = validFiles.map((file, idx) => ({
        tempId: `pending-${idx}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary:
          photos.length === 0 && pending.length === 0 && idx === 0,
        urutan: photos.length + pending.length + idx,
      }));

      setPending((prev) => [...prev, ...newPending]);
    };

    const handleRemovePending = (tempId: string) => {
      setPending((prev) => {
        const item = prev.find((p) => p.tempId === tempId);
        if (item) URL.revokeObjectURL(item.previewUrl);
        return prev.filter((p) => p.tempId !== tempId);
      });
    };

    const handleSetPendingPrimary = (targetIndex: number) => {
      setPending((prev) =>
        prev.map((p, idx) => ({
          ...p,
          isPrimary: idx === targetIndex,
        })),
      );
    };

    const handleMovePending = (index: number, direction: "left" | "right") => {
      const newIndex = direction === "left" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= pending.length) return;

      setPending((prev) => {
        const list = [...prev];
        const [moved] = list.splice(index, 1);
        list.splice(newIndex, 0, moved);
        return list.map((p, idx) => ({
          ...p,
          urutan: idx,
          isPrimary: idx === 0,
        }));
      });
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

    const handleCancelUpload = (tempId: string) => {
      setUploadQueue((prev) => prev.filter((q) => q.tempId !== tempId));
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            Foto Produk
          </label>
          <span className="text-xs text-slate-500">
            {photos.length + pending.length} foto
            {pending.length > 0 && (
              <span className="text-amber-600">
                {" "}({pending.length} menunggu)
              </span>
            )}
          </span>
        </div>

        {/* Area Drag and Drop */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (disabled) return;
            handleFiles(e.dataTransfer.files);
          }}
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
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
            multiple
            accept=".jpg,.jpeg,.png,.webp"
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <svg
              className="w-9 h-9 text-blue-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7.5 4.5 6h3.75L10.5 8h4.5A1.5 1.5 0 0 1 16.5 9.5V17a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 17V7.5Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 13.25h4m-4 2.5h2.5"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Seret dan lepaskan foto ke sini, atau{" "}
                <span className="text-blue-600 hover:underline">
                  pilih file
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Mendukung JPG, JPEG, PNG, WEBP hingga 20 MB per foto. Foto
                akan diunggah ke server setelah produk disimpan.
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

        {/* Upload Queue (sedang di-upload / error, dari flushPending) */}
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

        {/* Pending Files (staging, belum diupload) */}
        {pending.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Menunggu Unggah ({pending.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Akan diunggah saat produk disimpan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pending.map((photo, idx) => (
                <div
                  key={photo.tempId}
                  className={`relative group bg-white border-2 rounded-xl overflow-hidden shadow-xs transition-all ${
                    photo.isPrimary
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {photo.isPrimary && (
                    <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      Foto Utama
                    </div>
                  )}

                  <div className="relative aspect-square bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.previewUrl}
                      alt={`Foto pending ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-2 bg-white flex items-center justify-between border-t border-slate-100 gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMovePending(idx, "left")}
                        disabled={idx === 0 || disabled}
                        title="Geser ke kiri"
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePending(idx, "right")}
                        disabled={idx === pending.length - 1 || disabled}
                        title="Geser ke kanan"
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-600"
                      >
                        →
                      </button>
                    </div>

                    {!photo.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPendingPrimary(idx)}
                        disabled={disabled}
                        className="text-[10px] text-blue-600 hover:underline px-1"
                      >
                        Jadikan Utama
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemovePending(photo.tempId)}
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

        {/* Grid Foto Tersimpan (sudah di ImageKit) */}
        {photos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Daftar Foto Tersimpan
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
                  {photo.isPrimary && (
                    <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      Foto Utama
                    </div>
                  )}

                  <div className="relative aspect-square bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

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
  },
);

export default ImageKitUpload;
