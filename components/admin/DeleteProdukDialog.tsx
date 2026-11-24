"use client";

import { useState } from "react";
import { hapusProduk } from "@/app/admin/produk/actions";

type DeleteProdukDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  produkId: number;
  produkNama: string;
};

export function DeleteProdukDialog({
  isOpen,
  onClose,
  produkId,
  produkNama,
}: DeleteProdukDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      const formData = new FormData();
      formData.append("idProduk", produkId.toString());

      const result = await hapusProduk(formData);

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
        window.location.reload();
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-background">
          <h3 className="text-lg font-bold text-slate-800">Hapus Produk</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus produk{" "}
            <span className="font-semibold text-slate-800">{produkNama}</span>?
          </p>
          <p className="text-sm text-red-600 mt-2">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            {isDeleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
