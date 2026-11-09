"use client";

import { useState, useMemo } from "react";
import { ProdukForm } from "@/components/admin/ProdukForm";
import { DeleteProdukDialog } from "@/components/admin/DeleteProdukDialog";

type ProdukFromDB = {
  idProduk: number;
  namaProduk: string;
  jenisProduk: string;
  hargaProduk: string;
  jumlahStok: number;
  deskripsi: string | null;
  gambarUrl: string | null;
  berat: string | null;
  statusProduk: string;
  createdAt: Date;
};

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
};

const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

export function ProdukContent({ produkList }: { produkList: ProdukFromDB[] }) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterWaktu, setFilterWaktu] = useState<string>("Semua");
  const [filterJenis, setFilterJenis] = useState<string>("Semua");
  const [filterKategoriStok, setFilterKategoriStok] = useState<string>("Semua");
  const [showEtalase, setShowEtalase] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduk, setEditingProduk] = useState<Produk | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduk, setDeletingProduk] = useState<Produk | null>(null);

  // Konversi data dari database ke format yang dipakai component
  const produkConverted: Produk[] = produkList.map((p) => ({
    id: p.idProduk,
    nama: p.namaProduk,
    harga: Number(p.hargaProduk),
    jenis: p.jenisProduk,
    waktuDitambahkan: p.createdAt.toISOString(),
    img: p.gambarUrl || undefined,
    deskripsi: p.deskripsi || "",
    stok: p.jumlahStok,
    berat: p.berat || "",
  }));

  // Filter produk berdasarkan kriteria
  const filteredProduk = useMemo(() => {
    return produkConverted.filter((produk) => {
      // Filter keyword
      if (searchKeyword && !produk.nama.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }

      // Filter waktu berdasarkan tanggal ditambahkan
      if (filterWaktu !== "Semua") {
        const tanggalDitambahkan = new Date(produk.waktuDitambahkan);
        const sekarang = new Date();

        if (filterWaktu === "Terbaru") {
          const hariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
          if (tanggalDitambahkan < hariIni) return false;
        } else if (filterWaktu === "Minggu ini") {
          const tujuhHariLalu = new Date(sekarang);
          tujuhHariLalu.setDate(sekarang.getDate() - 7);
          if (tanggalDitambahkan < tujuhHariLalu) return false;
        } else if (filterWaktu === "Bulan ini") {
          const tigapuluhHariLalu = new Date(sekarang);
          tigapuluhHariLalu.setDate(sekarang.getDate() - 30);
          if (tanggalDitambahkan < tigapuluhHariLalu) return false;
        }
      }

      // Filter jenis
      if (filterJenis !== "Semua" && produk.jenis !== filterJenis) {
        return false;
      }

      // Filter kategori stok berdasarkan jumlah stok
      if (filterKategoriStok !== "Semua") {
        if (filterKategoriStok === "Satuan" && (produk.stok < 1 || produk.stok > 9)) {
          return false;
        }
        if (filterKategoriStok === "Puluhan" && (produk.stok < 10 || produk.stok > 99)) {
          return false;
        }
        if (filterKategoriStok === "Ratusan" && produk.stok < 100) {
          return false;
        }
      }

      return true;
    });
  }, [produkConverted, searchKeyword, filterWaktu, filterJenis, filterKategoriStok]);

  // Produk yang ditampilkan (dengan toggle etalase)
  const displayedProduk = showEtalase ? filteredProduk : [];

  const handleAddProduk = () => {
    setEditingProduk(null);
    setIsFormOpen(true);
  };

  const handleEditProduk = (produk: Produk) => {
    setEditingProduk(produk);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (produk: Produk) => {
    setDeletingProduk(produk);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div>
      {/* Header & Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola Produk</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola produk yang ditampilkan di halaman toko
          </p>
        </div>
        <button
          onClick={handleAddProduk}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cari Produk
            </label>
            <input
              type="text"
              placeholder="Nama produk..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Waktu */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Waktu
            </label>
            <select
              value={filterWaktu}
              onChange={(e) => setFilterWaktu(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Semua">Semua</option>
              <option value="Terbaru">Terbaru</option>
              <option value="Minggu ini">Minggu ini</option>
              <option value="Bulan ini">Bulan ini</option>
            </select>
          </div>

          {/* Filter Jenis */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Jenis
            </label>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Semua">Semua</option>
              <option value="Pupuk">Pupuk</option>
              <option value="Olahan Maggot">Olahan Maggot</option>
              <option value="Pakan Ternak">Pakan Ternak</option>
            </select>
          </div>

          {/* Filter Kategori Stok */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Kategori Stok
            </label>
            <select
              value={filterKategoriStok}
              onChange={(e) => setFilterKategoriStok(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Semua">Semua</option>
              <option value="Satuan">Satuan (1-9)</option>
              <option value="Puluhan">Puluhan (10-99)</option>
              <option value="Ratusan">Ratusan (100+)</option>
            </select>
          </div>
        </div>

        {/* Toggle Etalase */}
        <div className="mt-4 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showEtalase}
              onChange={(e) => setShowEtalase(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Tampilkan Etalase Toko
            </span>
          </label>
          <span className="text-sm text-slate-500">
            ({filteredProduk.length} produk)
          </span>
        </div>
      </div>

      {/* Product Grid */}
      {showEtalase ? (
        displayedProduk.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedProduk.map((produk) => (
              <div
                key={produk.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-slate-100">
                  {produk.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={produk.img}
                      alt={produk.nama}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-800 mb-1">
                    {produk.nama}
                  </h3>
                  <p className="text-blue-600 font-bold mb-2">
                    {rupiah(produk.harga)}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {produk.jenis}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Stok: {produk.stok}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 mb-3">
                    <p>Berat: {produk.berat || "-"}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProduk(produk)}
                      className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(produk)}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-slate-500">Tidak ada produk yang sesuai dengan filter</p>
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-slate-500">Etalase toko disembunyikan</p>
        </div>
      )}

      {/* Modals */}
      {isFormOpen && (
        <ProdukForm
          key={editingProduk ? `edit-${editingProduk.id}` : "new"}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          produk={editingProduk}
        />
      )}

      <DeleteProdukDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        produkId={deletingProduk?.id || 0}
        produkNama={deletingProduk?.nama || ""}
      />
    </div>
  );
}
