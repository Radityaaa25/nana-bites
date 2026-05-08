"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { formatRupiah, generateWaLink } from "@/lib/utils";
import { X, CheckCircle2, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function OrderModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, getCartTotal, clearCart } = useCartStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    notes: "",
  });
  const [lastOrderSummary, setLastOrderSummary] = useState<{
    items: Array<{
      menuId?: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    totalPrice: number;
  } | null>(null);

  const resetModalState = () => {
    setStep(1);
    setCreatedOrderId("");
    setFormData({ name: "", phone: "", notes: "" });
    setLastOrderSummary(null);
  };

  const handleNext = () => {
    if (!formData.name.trim()) return toast.error("Nama harus diisi ya! 🥺");
    if (!formData.phone.trim()) return toast.error("Nomor HP jangan lupa! 📱");

    const phoneRegex = /^(08|628)\d{8,12}$/;
    if (!phoneRegex.test(formData.phone)) {
      return toast.error(
        "Format nomor HP kurang tepat, pakai 08xx atau 628xx ya! 😅",
      );
    }

    setStep(2);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const configRes = await fetch("/api/config", { cache: "no-store" });
      const configData = configRes.ok ? await configRes.json() : {};
      const waNumber =
        process.env.NEXT_PUBLIC_WA_NUMBER || configData?.waNumber || "";

      if (!waNumber) {
        throw new Error("Nomor WhatsApp belum dikonfigurasi di server");
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_phone: formData.phone,
          items: items,
          total_price: getCartTotal(),
          payment_method: "cash",
          delivery_method: "pickup",
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal membuat pesanan");
      }

      const { id } = await res.json();

      // Bikin teks WA (format baku)
      let waText = `Halo Nana Bites! 🍫\nSaya mau pesan kak~\n📋 Detail Pesanan #${id}\n`;
      items.forEach((item) => {
        waText += `- ${item.name} x${item.quantity} — ${formatRupiah(item.price * item.quantity)}\n`;
      });
      waText += `💰 Total: ${formatRupiah(getCartTotal())}\n`;
      waText += `👤 Nama: ${formData.name}\n📱 No HP: ${formData.phone}\n💳 Pembayaran: Cash\n🎒 Pengambilan: Ambil Sendiri\n\nMohon dikonfirmasi ya kak! 🙏`;
      if (formData.notes) {
        waText += `\n\n📝 Catatan: ${formData.notes}`;
      }

      const link = generateWaLink(waNumber, waText);

      // Buka WhatsApp
      window.open(link, "_blank");

      // Simpan untuk success screen, lalu reset cart
      setCreatedOrderId(id);
      setLastOrderSummary({
        items: [...items],
        totalPrice: getCartTotal(),
      });
      clearCart();
      setStep(3);

      // Tampilkan toast sukses
      toast.success("Pesanan berhasil dibuat! 🎉");
    } catch (error: unknown) {
      console.error("Order submission error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Waduh, gagal kirim pesanan nih. Coba lagi ya! 😢";
      toast.error(
        message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              resetModalState();
              onClose();
            }}
            className="absolute inset-0 bg-pink-950/30 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Header */}
            <div className="bg-pink-50 p-6 flex items-center justify-between">
              {step === 2 ? (
                <button
                  onClick={() => setStep(1)}
                  className="text-pink-600 hover:text-pink-800">
                  <ChevronLeft className="w-6 h-6" />
                </button>
              ) : (
                <div className="w-6" />
              )}
              <h2 className="font-playfair text-xl font-bold text-pink-900 text-center flex-1">
                {step === 1
                  ? "Detail Pesanan"
                  : step === 2
                    ? "Konfirmasi Pembayaran"
                    : "Pesanan Berhasil"}
              </h2>
              <button
                onClick={() => {
                  resetModalState();
                  onClose();
                }}
                className="text-pink-400 hover:text-pink-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex px-8 py-4 bg-white border-b border-pink-50">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 1
                      ? "bg-pink-500 text-white"
                      : "bg-pink-100 text-pink-400"
                  }`}>
                  1
                </div>
                <span className="text-[10px] font-medium text-pink-900">
                  Data Diri
                </span>
              </div>
              <div className="flex-1 border-t-2 border-pink-100 mt-3 -mx-4 z-0" />
              <div className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 2
                      ? "bg-pink-500 text-white"
                      : "bg-pink-100 text-pink-400"
                  }`}>
                  2
                </div>
                <span className="text-[10px] font-medium text-pink-900">
                  Pembayaran
                </span>
              </div>
              <div className="flex-1 border-t-2 border-pink-100 mt-3 -mx-4 z-0" />
              <div className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step >= 3
                      ? "bg-pink-500 text-white"
                      : "bg-pink-100 text-pink-400"
                  }`}>
                  3
                </div>
                <span className="text-[10px] font-medium text-pink-900">
                  Selesai
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {step === 1 ? (
                <div className="space-y-5">
                  {/* Order Summary */}
                  <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-100">
                    <h3 className="font-bold text-pink-900 mb-3 text-sm">
                      Ringkasan Pesanan
                    </h3>
                    <div className="space-y-2 mb-3">
                      {items.map((item) => (
                        <div
                          key={item.menuId}
                          className="flex justify-between text-sm">
                          <span className="text-pink-800">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium text-pink-600">
                            {formatRupiah(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-pink-200 flex justify-between font-bold text-pink-900">
                      <span>Total</span>
                      <span>{formatRupiah(getCartTotal())}</span>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-pink-900 mb-1">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Cth: Kak Nana"
                        className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-pink-900 mb-1">
                        Nomor HP (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="0812xxxxxx"
                        className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-pink-900 mb-1">
                        Catatan Tambahan
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Cth: Jangan pedas ya kak"
                        className="w-full rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              ) : step === 2 ? (
                <div className="space-y-6">
                  {/* Payment Method */}
                  <div>
                    <h3 className="font-bold text-pink-900 mb-3">
                      Metode Pembayaran
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-xl border-2 border-pink-500 bg-pink-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-4 border-pink-500 bg-white" />
                          <span className="font-medium text-pink-900">
                            💵 Cash (Bayar di tempat)
                          </span>
                        </div>
                        <CheckCircle2 className="text-pink-500 w-5 h-5" />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-60 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          <span className="font-medium text-gray-500">
                            🏦 Transfer Bank
                          </span>
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold">
                          Coming Soon
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-60 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          <span className="font-medium text-gray-500">
                            📱 QRIS
                          </span>
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Method */}
                  <div>
                    <h3 className="font-bold text-pink-900 mb-3">
                      Metode Pengambilan
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-xl border-2 border-pink-500 bg-pink-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-4 border-pink-500 bg-white" />
                          <span className="font-medium text-pink-900">
                            🎒 Ambil Sendiri (Sekolah)
                          </span>
                        </div>
                        <CheckCircle2 className="text-pink-500 w-5 h-5" />
                      </div>

                      <div className="flex items-center justify-between rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-60 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          <span className="font-medium text-gray-500">
                            🛵 Delivery
                          </span>
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-xl font-bold text-pink-900">
                    Pesanan Terkirim
                  </h3>
                  <p className="text-pink-700 text-sm">
                    Nomor order kamu:{" "}
                    <span className="font-bold text-pink-900">{createdOrderId}</span>
                  </p>
                  <div className="bg-pink-50/70 rounded-2xl p-4 border border-pink-100 text-left">
                    <h4 className="font-bold text-pink-900 mb-2 text-sm">
                      Ringkasan Pesanan
                    </h4>
                    <div className="space-y-2 mb-2">
                      {lastOrderSummary?.items.map((item) => (
                        <div
                          key={`${item.name}-${item.menuId || "custom"}`}
                          className="flex justify-between text-sm">
                          <span className="text-pink-800">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium text-pink-700">
                            {formatRupiah(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-pink-200 flex justify-between font-bold text-pink-900">
                      <span>Total</span>
                      <span>{formatRupiah(lastOrderSummary?.totalPrice || 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-pink-50 bg-white">
              {step === 1 ? (
                <button
                  onClick={handleNext}
                  className="w-full rounded-full bg-pink-500 py-3 font-bold text-white shadow-lg transition-all hover:bg-pink-600 active:scale-95">
                  Lanjut Pembayaran →
                </button>
              ) : step === 2 ? (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full rounded-full bg-green-500 py-3 font-bold text-white shadow-lg transition-all hover:bg-green-600 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isLoading ? "Memproses..." : "Konfirmasi & Chat WhatsApp 💬"}
                </button>
              ) : (
                <button
                  onClick={() => {
                    resetModalState();
                    onClose();
                  }}
                  className="w-full rounded-full bg-pink-500 py-3 font-bold text-white shadow-lg transition-all hover:bg-pink-600 active:scale-95">
                  Kembali Belanja
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
