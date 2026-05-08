"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { formatRupiah, generateWaLink, formatDate } from "@/lib/utils";
import { X, CheckCircle2, ChevronLeft, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function OrderModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, getCartTotal, clearCart } = useCartStore();
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || "";

  const handleNext = () => {
    if (!formData.name.trim()) return toast.error("Nama harus diisi ya! 🥺");
    if (!formData.phone.trim()) return toast.error("Nomor HP jangan lupa! 📱");

    // validasi format HP (mulai dari 08 atau 628)
    const phoneRegex = /^(08|628)\d{8,12}$/;
    if (!phoneRegex.test(formData.phone)) {
      return toast.error(
        "Format nomor HP kurang tepat, pakai 08xx atau 628xx ya! 😅",
      );
    }

    setStep("payment");
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          items: items,
          totalPrice: getCartTotal(),
          paymentMethod: "cash",
          deliveryMethod: "pickup",
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal membuat pesanan");
      }

      const { id, order } = await res.json();

      // Bikin teks WA
      let waText = `Halo Nana Bites! 🍫\nSaya mau pesan kak~\n\n📋 Detail Pesanan #${id}\n`;
      items.forEach((item) => {
        waText += `- ${item.name} x${item.quantity} — ${formatRupiah(item.price * item.quantity)}\n`;
      });
      if (formData.notes) waText += `\n📝 Catatan: ${formData.notes}\n`;
      waText += `\n💰 Total: ${formatRupiah(getCartTotal())}\n`;
      waText += `👤 Nama: ${formData.name}\n📱 No HP: ${formData.phone}\n💳 Pembayaran: Cash\n🎒 Pengambilan: Ambil Sendiri\n\nMohon dikonfirmasi ya kak! 🙏`;

      const link = generateWaLink(waNumber, waText);

      // Buka WA
      window.open(link, "_blank");

      // Simpan data untuk success screen
      setSuccessData({ id, order });

      // Tampilkan success screen
      setStep("success");

      // Clear form
      clearCart();
      setFormData({ name: "", phone: "", notes: "" });
    } catch (error: any) {
      console.error("Order submission error:", error);
      toast.error(
        error.message || "Waduh, gagal kirim pesanan nih. Coba lagi ya! 😢",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrder = () => {
    if (successData?.id) {
      onClose();
      setStep("form");
      setSuccessData(null);
      router.push(`/order/${successData.id}`);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-pink-950/30 backdrop-blur-sm"
            style={{ willChange: "opacity" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            style={{
              willChange: "transform, opacity",
              transform: "translateZ(0)",
            }}>
            {step === "success" ? (
              // ===== SUCCESS SCREEN =====
              <>
                <div className="bg-pink-50 p-8 text-center border-b border-pink-100">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 className="w-8 h-8 text-pink-500" />
                  </div>
                  <h2 className="font-playfair text-2xl font-bold text-pink-900 mb-2">
                    Yay! Pesanan Berhasil! 🎉
                  </h2>
                  <p className="text-pink-600 text-sm">
                    Terima kasih kak {successData?.order?.customerName}!
                  </p>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                  <div className="flex justify-between items-center bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                    <div>
                      <p className="text-xs text-pink-500 font-medium mb-1">
                        No. Pesanan
                      </p>
                      <p className="font-bold text-pink-900 text-lg">
                        {successData?.id}
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
                      ⏳ Pending
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-pink-900 text-sm">
                      📋 Ringkasan Pesanan
                    </h3>
                    <div className="bg-pink-50/50 rounded-xl p-4 border border-pink-100 space-y-3">
                      {successData?.order?.items?.map(
                        (item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-pink-800">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-medium text-pink-900">
                              {formatRupiah(item.price * item.quantity)}
                            </span>
                          </div>
                        ),
                      )}
                      <div className="pt-2 border-t border-pink-200 flex justify-between font-bold text-pink-900">
                        <span>Total</span>
                        <span className="text-pink-600">
                          {formatRupiah(successData?.order?.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Waktu</span>
                      <span className="font-medium text-gray-800">
                        {successData?.order?.createdAt
                          ? formatDate(successData.order.createdAt)
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pembayaran</span>
                      <span className="font-medium text-gray-800 uppercase">
                        {successData?.order?.paymentMethod}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pengambilan</span>
                      <span className="font-medium text-gray-800 uppercase">
                        {successData?.order?.deliveryMethod}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-pink-50 bg-white flex flex-col gap-3">
                  <button
                    onClick={handleViewOrder}
                    className="w-full rounded-full bg-pink-500 py-3 font-bold text-white shadow-pink transition-all hover:bg-pink-600 active:scale-95 flex items-center justify-center gap-2">
                    Lihat Status Pesanan <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full rounded-full border-2 border-pink-200 py-3 font-bold text-pink-600 transition-all hover:bg-pink-50 active:scale-95">
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              // ===== FORM & PAYMENT SCREENS =====
              <>
                {/* Header */}
                <div className="bg-pink-50 p-6 flex items-center justify-between">
                  {step === "payment" ? (
                    <button
                      onClick={() => setStep("form")}
                      className="text-pink-600 hover:text-pink-800">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  ) : (
                    <div className="w-6"></div>
                  )}
                  <h2 className="font-playfair text-xl font-bold text-pink-900 text-center flex-1">
                    {step === "form"
                      ? "Detail Pesanan"
                      : "Konfirmasi Pembayaran"}
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-pink-400 hover:text-pink-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Stepper */}
                <div className="flex px-8 py-4 bg-white border-b border-pink-50">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "form" || step === "payment" ? "bg-pink-500 text-white" : "bg-pink-100 text-pink-400"}`}>
                      1
                    </div>
                    <span className="text-[10px] font-medium text-pink-900">
                      Data Diri
                    </span>
                  </div>
                  <div className="flex-1 border-t-2 border-pink-100 mt-3 -mx-4 z-0"></div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === "payment" ? "bg-pink-500 text-white" : "bg-pink-100 text-pink-400"}`}>
                      2
                    </div>
                    <span className="text-[10px] font-medium text-pink-900">
                      Pembayaran
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {step === "form" ? (
                    <div className="space-y-5">
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
                            className="w-full rounded-xl border-pink-200 bg-white px-4 py-2 text-sm focus:border-pink-500 focus:ring-pink-500 border outline-none"
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
                              setFormData({
                                ...formData,
                                phone: e.target.value,
                              })
                            }
                            placeholder="0812xxxxxx"
                            className="w-full rounded-xl border-pink-200 bg-white px-4 py-2 text-sm focus:border-pink-500 focus:ring-pink-500 border outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-pink-900 mb-1">
                            Catatan Tambahan
                          </label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                notes: e.target.value,
                              })
                            }
                            placeholder="Cth: Jangan pedas ya kak"
                            className="w-full rounded-xl border-pink-200 bg-white px-4 py-2 text-sm focus:border-pink-500 focus:ring-pink-500 border outline-none min-h-[80px]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-bold text-pink-900 mb-3">
                          Metode Pembayaran
                        </h3>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between rounded-xl border-2 border-pink-500 bg-pink-50 p-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full border-4 border-pink-500 bg-white"></div>
                              <span className="font-medium text-pink-900">
                                💵 Cash (Bayar di tempat)
                              </span>
                            </div>
                            <CheckCircle2 className="text-pink-500 w-5 h-5" />
                          </label>

                          <label className="flex items-center justify-between rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-60 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                              <span className="font-medium text-gray-500">
                                🏦 Transfer Bank
                              </span>
                            </div>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold">
                              Coming Soon
                            </span>
                          </label>

                          <label className="flex items-center justify-between rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-60 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                              <span className="font-medium text-gray-500">
                                📱 QRIS
                              </span>
                            </div>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold">
                              Coming Soon
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-pink-900 mb-3">
                          Metode Pengambilan
                        </h3>
                        <div className="space-y-2">
                          <label className="flex items-center justify-between rounded-xl border-2 border-pink-500 bg-pink-50 p-4 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full border-4 border-pink-500 bg-white"></div>
                              <span className="font-medium text-pink-900">
                                🎒 Ambil Sendiri (Sekolah)
                              </span>
                            </div>
                            <CheckCircle2 className="text-pink-500 w-5 h-5" />
                          </label>

                          <label className="flex items-center justify-between rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-60 cursor-not-allowed">
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                              <span className="font-medium text-gray-500">
                                🛵 Delivery
                              </span>
                            </div>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold">
                              Coming Soon
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-pink-50 bg-white">
                  {step === "form" ? (
                    <button
                      onClick={handleNext}
                      className="w-full rounded-full bg-pink-500 py-3 font-bold text-white shadow-pink transition-all hover:bg-pink-600 active:scale-95">
                      Lanjut Pembayaran →
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full rounded-full bg-green-500 py-3 font-bold text-white shadow-lg transition-all hover:bg-green-600 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                      {isLoading
                        ? "Memproses..."
                        : "Konfirmasi & Chat WhatsApp 💬"}
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
