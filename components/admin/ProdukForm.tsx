"use client";

import { useState } from "react";

type Produk = {
  id: number;
  nama: string;
  harga: number;
  jenis: "Pupuk" | "Olahan Maggot" | "Pakan Ternak";
  waktuDitambahkan: string;
  img?: string;
  deskripsi: string;
  stok: number;
  berat: string;
};

const createInitialFormData = (
  produk: Produk | null,
): Omit<Produk, "id"> => ({
  nama: produk?.nama ?? "",
  harga: produk?.harga ?? 0,
  jenis: produk?.jenis ?? "Pupuk",
  waktuDitambahkan: produk?.waktuDitambahkan ?? new Date().toISOString(),
  img: produk?.img ?? "",
  deskripsi: produk?.deskripsi ?? "",
  stok: produk?.stok ?? 0,
  berat: produk?.berat ?? "",
});

type ProdukFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (produk: Produk) => void;
  produk: Produk | null;
};

export function ProdukForm({ isOpen, onClose, onSave, produk }: ProdukFormProps) {
  const [formData, setFormData] = useState<Omit<Produk, "id">>(() =>
    createInitialFormData(produk),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      alert("Nama produk tidak boleh kosong");
      return;
    }

    if (formData.harga <= 0) {
      alert("Harga harus lebih dari 0");
      return;
    }

    if (formData.stok < 0) {
      alert("Stok tidak boleh negatif");
      return;
    }

    if (!formData.berat.trim()) {
      alert("Berat tidak boleh kosong");
      return;
    }

    const newProduk: Produk = {
      id: produk?.id || 0,
      ...formData,
      waktuDitambahkan: produk ? formData.waktuDitambahkan : new Date().toISOString(),
    };

    onSave(newProduk);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            {produk ? "Edit Produk" : "Tambah Produk Baru"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Produk *
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) =>
                setFormData({ ...formData, nama: e.target.value })
              }
              placeholder="Contoh: Magot Segar"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Harga */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Harga (Rp) *
            </label>
            <input
              type="number"
              value={formData.harga}
              onChange={(e) =>
                setFormData({ ...formData, harga: parseInt(e.target.value) || 0 })
              }
              placeholder="20000"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  jenis: e.target.value as "Pupuk" | "Olahan Maggot" | "Pakan Ternak",
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <input
                type="number"
                value={formData.stok}
                onChange={(e) =>
                  setFormData({ ...formData, stok: parseInt(e.target.value) || 0 })
                }
                placeholder="50"
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Berat *
              </label>
              <input
                type="text"
                value={formData.berat}
                onChange={(e) =>
                  setFormData({ ...formData, berat: e.target.value })
                }
                placeholder="1 Kg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Gambar URL */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL Gambar
            </label>
            <input
              type="text"
              value={formData.img}
              onChange={(e) =>
                setFormData({ ...formData, img: e.target.value })
              }
              placeholder="/img/produk/1.png"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Gunakan URL dari direktori public atau biarkan kosong untuk tidak ada gambar
            </p>
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {produk ? "Update Produk" : "Tambah Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
