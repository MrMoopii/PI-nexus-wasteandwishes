"use client";

import { useState, useEffect, useRef } from "react";
import {
  tambahProduk,
  updateProduk,
  getFotoProduk,
} from "@/app/admin/produk/actions";
import ImageKitUpload, {
  type FotoItem,
  type ImageKitUploadHandle,
} from "./ImageKitUpload";

type Produk = {
  id: number;
  nama: string;
  harga: number;
  jenis: string;
  waktuDitambahkan: string;
  img?: string;
  deskripsi: string;
  stok: number;
  berat: string;
  fotoList?: FotoItem[];
};

type ProdukFormProps = {
  isOpen: boolean;
  onClose: () => void;
  produk: Produk | null;
};

type FieldErrors = {
  nama?: string;
  harga?: string;
  stok?: string;
  global?: string;
};

export function ProdukForm({ isOpen, onClose, produk }: ProdukFormProps) {
  const [formData, setFormData] = useState({
    nama: produk?.nama ?? "",
    harga: produk ? String(produk.harga) : "",
    jenis: produk?.jenis ?? "Pupuk",
    deskripsi: produk?.deskripsi ?? "",
    stok: produk ? String(produk.stok) : "",
    berat: produk?.berat ?? "",
  });

  const [photos, setPhotos] = useState<FotoItem[]>(() => {
    if (produk?.fotoList && produk.fotoList.length > 0) {
      return produk.fotoList;
    }
    if (produk?.img) {
      return [
        {
          url: produk.img,
          fileId: "",
          isPrimary: true,
          urutan: 0,
        },
      ];
    }
    return [];
  });

  const [deletedFileIds, setDeletedFileIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const uploadRef = useRef<ImageKitUploadHandle>(null);

  // Jika sedang edit produk, muat foto dari tabel foto_produk jika belum disediakan
  useEffect(() => {
    let isMounted = true;
    if (produk?.id && (!produk.fotoList || produk.fotoList.length === 0)) {
      getFotoProduk(produk.id).then((items) => {
        if (!isMounted) return;
        if (items.length > 0) {
          setPhotos(items);
        } else if (produk.img) {
          setPhotos([
            {
              url: produk.img,
              fileId: "",
              isPrimary: true,
              urutan: 0,
            },
          ]);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [produk]);

  const handlePhotosChange = (
    newPhotos: FotoItem[],
    newDeletedIds: string[],
  ) => {
    setPhotos(newPhotos);
    setDeletedFileIds(newDeletedIds);
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.nama.trim()) {
      errors.nama = "Nama produk tidak boleh kosong";
    }

    const hargaNum = parseInt(formData.harga, 10);
    if (!Number.isInteger(hargaNum) || hargaNum <= 0) {
      errors.harga = "Harga harus berupa angka lebih dari 0";
    }

    const stokNum = formData.stok === "" ? 0 : parseInt(formData.stok, 10);
    if (!Number.isInteger(stokNum) || stokNum < 0) {
      errors.stok = "Stok harus berupa angka tidak negatif";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload pending files ke ImageKit (jika ada)
      let uploadedPhotos: FotoItem[] = [];
      const pendingFiles = uploadRef.current?.getPendingFiles() ?? [];
      if (pendingFiles.length > 0) {
        const { results, errors } = await uploadRef.current!.flushPending();
        if (errors.length > 0) {
          setFieldErrors({
            global: `Gagal mengunggah ${errors.length} foto: ${errors.map((e) => e.pesan).join("; ")}`,
          });
          setIsSubmitting(false);
          return;
        }
        uploadedPhotos = results.map((r, idx) => ({
          url: r.url,
          fileId: r.fileId,
          isPrimary: photos.length === 0 && idx === 0,
          urutan: photos.length + idx,
        }));
      }

      const formDataToSend = new FormData();
      if (produk) {
        formDataToSend.append("idProduk", produk.id.toString());
      }
      formDataToSend.append("namaProduk", formData.nama);
      formDataToSend.append("jenisProduk", formData.jenis);
      formDataToSend.append("hargaProduk", formData.harga);
      formDataToSend.append("jumlahStok", formData.stok || "0");
      formDataToSend.append("deskripsi", formData.deskripsi);
      formDataToSend.append("berat", formData.berat);

      // Gabungkan foto yang sudah tersimpan + yang baru diupload
      formDataToSend.append(
        "fotoList",
        JSON.stringify([...photos, ...uploadedPhotos]),
      );
      formDataToSend.append("deletedFileIds", JSON.stringify(deletedFileIds));

      const result = produk
        ? await updateProduk(formDataToSend)
        : await tambahProduk(formDataToSend);

      if (result.error) {
        setFieldErrors({ global: result.error });
      } else {
        uploadRef.current?.clearPending();
        onClose();
        window.location.reload();
      }
    } catch {
      setFieldErrors({
        global: "Terjadi kesalahan saat menyimpan produk. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20">
          <h2 className="text-lg font-bold text-slate-800">
            {produk ? "Edit Produk" : "Tambah Produk Baru"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Global Error (dari server / gagal upload) */}
          {fieldErrors.global && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {fieldErrors.global}
            </div>
          )}

          {/* Upload Foto Produk dengan Drag and Drop */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <ImageKitUpload
              ref={uploadRef}
              existingPhotos={photos}
              onChange={handlePhotosChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Nama Produk */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Produk *
            </label>
            {fieldErrors.nama && (
              <p className="text-xs text-red-600 mb-1">{fieldErrors.nama}</p>
            )}
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => {
                setFormData({ ...formData, nama: e.target.value });
                clearFieldError("nama");
              }}
              placeholder="Contoh: Maggot Segar"
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                fieldErrors.nama
                  ? "border-red-400 ring-1 ring-red-200"
                  : "border-slate-300"
              }`}
            />
          </div>

          {/* Harga */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Harga (Rp) *
            </label>
            {fieldErrors.harga && (
              <p className="text-xs text-red-600 mb-1">
                {fieldErrors.harga}
              </p>
            )}
            <input
              type="number"
              value={formData.harga}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  harga: e.target.value,
                });
                clearFieldError("harga");
              }}
              placeholder="20000"
              min="0"
              step="1"
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                fieldErrors.harga
                  ? "border-red-400 ring-1 ring-red-200"
                  : "border-slate-300"
              }`}
            />
          </div>

          {/* Jenis */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Jenis *
            </label>
            <select
              value={formData.jenis}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  jenis: e.target.value,
                })
              }
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="Pupuk">Pupuk</option>
              <option value="Olahan Maggot">Olahan Maggot</option>
              <option value="Pakan Ternak">Pakan Ternak</option>
            </select>
          </div>

          {/* Stok & Berat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Stok *
              </label>
              {fieldErrors.stok && (
                <p className="text-xs text-red-600 mb-1">
                  {fieldErrors.stok}
                </p>
              )}
              <input
                type="number"
                value={formData.stok}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    stok: e.target.value,
                  });
                  clearFieldError("stok");
                }}
                placeholder="50"
                min="0"
                step="1"
                disabled={isSubmitting}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                  fieldErrors.stok
                    ? "border-red-400 ring-1 ring-red-200"
                    : "border-slate-300"
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Berat
              </label>
              <input
                type="text"
                value={formData.berat}
                onChange={(e) =>
                  setFormData({ ...formData, berat: e.target.value })
                }
                placeholder="1 Kg"
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deskripsi
            </label>
            <textarea
              value={formData.deskripsi}
              onChange={(e) =>
                setFormData({ ...formData, deskripsi: e.target.value })
              }
              placeholder="Deskripsi produk..."
              rows={4}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting
                ? "Menyimpan..."
                : produk
                  ? "Update Produk"
                  : "Tambah Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
