"use client";

import { useState, useRef } from "react";
import { formatRupiah } from "@/lib/utils";
import {
  Edit2,
  Trash2,
  Plus,
  Star,
  Eye,
  EyeOff,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  image: "", // URL or base64 preview
  imageFile: null as File | null,
  isBestSeller: false,
  isAvailable: true,
  isComingSoon: false,
};

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  isBestSeller: boolean;
  isAvailable: boolean;
  isComingSoon: boolean;
  createdAt?: string;
};

export default function MenuTableClient({
  initialMenu,
}: {
  initialMenu: MenuItem[];
}) {
  const [menu, setMenu] = useState(initialMenu);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const openAddModal = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setImagePreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      image: item.image ?? "",
      imageFile: null,
      isBestSeller: item.isBestSeller,
      isAvailable: item.isAvailable,
      isComingSoon: item.isComingSoon ?? false,
    });
    setImagePreview(item.image ?? "");
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar!");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB ya!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setFormData((prev) => ({ ...prev, imageFile: file, image: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview("");
    setFormData((prev) => ({ ...prev, imageFile: null, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.price) {
      toast.error("Lengkapi semua field yang wajib ya!");
      return;
    }

    setIsLoading(true);
    try {
      const url = editingItem ? `/api/menu/${editingItem.id}` : "/api/menu";
      const method = editingItem ? "PUT" : "POST";

      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        image: formData.image, // base64 or URL
        isBestSeller: formData.isBestSeller,
        isAvailable: formData.isAvailable,
        isComingSoon: formData.isComingSoon,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Gagal simpan");

      toast.success(
        editingItem
          ? "Menu berhasil diupdate! ✅"
          : "Menu berhasil ditambahkan! 🎉",
      );
      setIsModalOpen(false);

      const updatedMenu = await fetch("/api/menu").then((r) => r.json());
      setMenu(updatedMenu);
      router.refresh();
    } catch {
      toast.error("Waduh, gagal simpan data nih!");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (item: MenuItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/menu/${itemToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Menu berhasil dihapus!");
      setMenu(menu.filter((m) => m.id !== itemToDelete.id));
      setIsDeleteModalOpen(false);
      router.refresh();
    } catch {
      toast.error("Gagal menghapus menu");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (
    id: string,
    field: "isAvailable" | "isBestSeller" | "isComingSoon",
    currentValue: boolean,
  ) => {
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      if (!res.ok) throw new Error();
      setMenu(
        menu.map((m) => (m.id === id ? { ...m, [field]: !currentValue } : m)),
      );
      toast.success("Status berhasil diubah!");
      router.refresh();
    } catch {
      toast.error("Gagal merubah status");
    }
  };

  const getStatusBadge = (item: MenuItem) => {
    if (item.isComingSoon)
      return (
        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
          Coming Soon
        </span>
      );
    if (!item.isAvailable)
      return (
        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
          Habis
        </span>
      );
    return (
      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
        Tersedia
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-playfair text-3xl font-bold text-pink-900">
          Manajemen Menu 🍱
        </h1>
        <button
          onClick={openAddModal}
          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Tambah Menu
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-pink-50/50 text-pink-900/70 font-medium border-b border-pink-100">
              <tr>
                <th className="p-4 w-16">Foto</th>
                <th className="p-4">Nama Menu</th>
                <th className="p-4">Harga</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Tersedia</th>
                <th className="p-4 text-center">Best Seller</th>
                <th className="p-4 text-center">Coming Soon</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {menu.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-pink-50/30 transition-colors">
                  <td className="p-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-pink-100 relative">
                      <Image
                        src={
                          item.image ||
                          `https://placehold.co/100x100/FDF2F8/BE185D?text=${item.name[0]}`
                        }
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-pink-900">{item.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 max-w-[180px] mt-0.5">
                      {item.description}
                    </p>
                    <div className="mt-1">{getStatusBadge(item)}</div>
                  </td>
                  <td className="p-4 font-medium text-pink-600">
                    {formatRupiah(item.price)}
                  </td>

                  {/* Tersedia toggle */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        toggleStatus(item.id, "isAvailable", item.isAvailable)
                      }
                      className={`p-2 rounded-lg transition-colors inline-flex ${item.isAvailable ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-gray-400 bg-gray-50 hover:bg-gray-100"}`}
                      title={
                        item.isAvailable
                          ? "Klik untuk tandai habis"
                          : "Klik untuk tandai tersedia"
                      }>
                      {item.isAvailable ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </td>

                  {/* Best Seller toggle */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        toggleStatus(item.id, "isBestSeller", item.isBestSeller)
                      }
                      className={`p-2 rounded-lg transition-colors inline-flex ${item.isBestSeller ? "text-yellow-500 bg-yellow-50 hover:bg-yellow-100" : "text-gray-400 bg-gray-50 hover:bg-gray-100"}`}
                      title="Toggle Best Seller">
                      <Star
                        className={`w-5 h-5 ${item.isBestSeller ? "fill-current" : ""}`}
                      />
                    </button>
                  </td>

                  {/* Coming Soon toggle */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        toggleStatus(
                          item.id,
                          "isComingSoon",
                          item.isComingSoon ?? false,
                        )
                      }
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${item.isComingSoon ? "text-purple-600 bg-purple-50 hover:bg-purple-100" : "text-gray-400 bg-gray-50 hover:bg-gray-100"}`}
                      title="Toggle Coming Soon">
                      {item.isComingSoon ? "✓ CS" : "— CS"}
                    </button>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {menu.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    Belum ada menu. Klik &quot;Tambah Menu&quot; untuk mulai! 🍱
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-pink-950/30 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-pink-50 px-6 py-5 border-b border-pink-100 flex items-center justify-between flex-shrink-0">
              <h2 className="font-playfair text-xl font-bold text-pink-900">
                {editingItem ? "✏️ Edit Menu" : "➕ Tambah Menu Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-pink-400 hover:text-pink-600 p-1 rounded-lg hover:bg-pink-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-5">
                {/* Nama */}
                <div>
                  <label className="block text-sm font-semibold text-pink-900 mb-1.5">
                    Nama Menu <span className="text-pink-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="cth: Cheese Roll"
                    className="w-full rounded-xl border border-pink-200 px-4 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-semibold text-pink-900 mb-1.5">
                    Deskripsi <span className="text-pink-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="cth: Kulit lumpia renyah isi keju leleh yang gurih"
                    className="w-full rounded-xl border border-pink-200 px-4 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 min-h-[80px] resize-none"
                  />
                </div>

                {/* Harga */}
                <div>
                  <label className="block text-sm font-semibold text-pink-900 mb-1.5">
                    Harga (Rp) <span className="text-pink-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="cth: 4000"
                    className="w-full rounded-xl border border-pink-200 px-4 py-2.5 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                {/* Upload Gambar */}
                <div>
                  <label className="block text-sm font-semibold text-pink-900 mb-1.5">
                    Gambar Menu
                  </label>

                  {/* Preview */}
                  {imagePreview ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-pink-50 border border-pink-100 mb-2">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 text-red-500 rounded-full p-1.5 shadow-sm transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors mb-2">
                      <ImageIcon className="w-8 h-8 text-pink-300" />
                      <p className="text-sm text-pink-400 font-medium">
                        Klik untuk upload gambar
                      </p>
                      <p className="text-xs text-pink-300">
                        PNG, JPG, WEBP — maks 2MB
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-pink-600 font-medium hover:text-pink-800 transition-colors">
                    <Upload className="w-4 h-4" />
                    {imagePreview ? "Ganti Gambar" : "Pilih File"}
                  </button>

                  {/* Atau URL */}
                  <div className="mt-3">
                    <p className="text-xs text-gray-400 mb-1.5">
                      atau pakai URL gambar:
                    </p>
                    <input
                      type="text"
                      value={formData.imageFile ? "" : formData.image}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          image: e.target.value,
                          imageFile: null,
                        });
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-pink-100 px-4 py-2 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 bg-pink-50/30"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-100 space-y-3">
                  <p className="text-sm font-semibold text-pink-900 mb-2">
                    Status & Label
                  </p>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Tersedia
                      </p>
                      <p className="text-xs text-gray-500">
                        Menu muncul dan bisa dipesan pelanggan
                      </p>
                    </div>
                    <div
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isAvailable: !formData.isAvailable,
                        })
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${formData.isAvailable ? "bg-green-500" : "bg-gray-300"}`}>
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isAvailable ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Best Seller ⭐
                      </p>
                      <p className="text-xs text-gray-500">
                        Tampilkan badge Best Seller di kartu menu
                      </p>
                    </div>
                    <div
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isBestSeller: !formData.isBestSeller,
                        })
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${formData.isBestSeller ? "bg-yellow-400" : "bg-gray-300"}`}>
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isBestSeller ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Coming Soon 🔮
                      </p>
                      <p className="text-xs text-gray-500">
                        Tampilkan badge Coming Soon, tombol dinonaktifkan
                      </p>
                    </div>
                    <div
                      onClick={() =>
                        setFormData({
                          ...formData,
                          isComingSoon: !formData.isComingSoon,
                        })
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${formData.isComingSoon ? "bg-purple-500" : "bg-gray-300"}`}>
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.isComingSoon ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 pb-6 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-pink-600 font-medium hover:bg-pink-50 transition-colors">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-pink-950/40 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
              Hapus Menu?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Kamu yakin mau menghapus{" "}
              <span className="font-bold text-pink-900">
                &quot;{itemToDelete?.name}&quot;
              </span>
              ? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-gray-500 font-medium hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
