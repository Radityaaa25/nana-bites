"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { formatRupiah, generateWaLink } from "@/lib/utils";
import { X, CheckCircle2, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function OrderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { items, getCartTotal, clearCart } = useCartStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
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
      return toast.error("Format nomor HP kurang tepat, pakai 08xx atau 628xx ya! 😅");
    }

    setStep(2);
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

      if (!res.ok) throw new Error("Gagal membuat pesanan");
      
      const { orderId } = await res.json();
      
      // Bikin teks WA
      let waText = `Halo Nana Bites! 🍫\nSaya mau pesan kak~\n\n📋 Detail Pesanan #${orderId}\n`;
      items.forEach(item => {
        waText += `- ${item.name} x${item.quantity} — ${formatRupiah(item.price * item.quantity)}\n`;
      });
      if (formData.notes) waText += `\n📝 Catatan: ${formData.notes}\n`;
      waText += `\n💰 Total: ${formatRupiah(getCartTotal())}\n`;
      waText += `👤 Nama: ${formData.name}\n📱 No HP: ${formData.phone}\n💳 Pembayaran: Cash\n🎒 Pengambilan: Ambil Sendiri\n\nMohon dikonfirmasi ya kak! 🙏`;

      const link = generateWaLink(waNumber, waText);
      
      clearCart();
      setFormData({ name: "", phone: "", notes: "" });
      setStep(1);
      onClose();
      
      // Redirect ke /order/[id]
      router.push(`/order/${orderId}`);
      
      // Buka WA
      window.open(link, "_blank");

    } catch (error) {
      toast.error("Waduh, gagal kirim pesanan nih. Coba lagi ya! 😢");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-pink-950/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="bg-pink-50 p-6 flex items-center justify-between">
              {step === 2 ? (
                <button onClick={() => setStep(1)} className="text-pink-600 hover:text-pink-800">
                  <ChevronLeft className="w-6 h-6" />
                </button>
              ) : (
                <div className="w-6"></div> // spacer
              )}
              <h2 className="font-playfair text-xl font-bold text-pink-900 text-center flex-1">
                {step === 1 ? "Detail Pesanan" : "Konfirmasi Pembayaran"}
              </h2>
              <button onClick={onClose} className="text-pink-400 hover:text-pink-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex px-8 py-4 bg-white border-b border-pink-50">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-400'}`}>1</div>
                <span className="text-[10px] font-medium text-pink-900">Data Diri</span>
              </div>
              <div className="flex-1 border-t-2 border-pink-100 mt-3 -mx-4 z-0"></div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-400'}`}>2</div>
                <span className="text-[10px] font-medium text-pink-900">Pembayaran</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {step === 1 ? (
                <div className="space-y-5">
                  <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-100">
                    <h3 className="font-bold text-pink-900 mb-3 text-sm">Ringkasan Pesanan</h3>
                    <div className="space-y-2 mb-3">
                      {items.map(item => (
                        <div key={item.menuId} className="flex justify-between text-sm">
                          <span className="text-pink-800">{item.quantity}x {item.name}</span>
                          <span className="font-medium text-pink-600">{formatRupiah(item.price * item.quantity)}</span>
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
                      <label className="block text-sm font-medium text-pink-900 mb-1">Nama Lengkap *</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Cth: Kak Nana"
                        className="w-full rounded-xl border-pink-200 bg-white px-4 py-2 text-sm focus:border-pink-500 focus:ring-pink-500 border outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-pink-900 mb-1">Nomor HP (WhatsApp) *</label>
                      <input 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="0812xxxxxx"
                        className="w-full rounded-xl border-pink-200 bg-white px-4 py-2 text-sm focus:border-pink-500 focus:ring-pink-500 border outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-pink-900 mb-1">Catatan Tambahan</label>
                      <textarea 
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Cth: Jangan pedas ya kak"
                        className="w-full rounded-xl border-pink-200 bg-white px-4 py-2 text-sm focus:border-pink-500 focus:ring-pink-500 border outline-none min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-pink-900 mb-3">Metode Pembayaran</h3>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between rounded-xl border-2 border-pink-500 bg-pink-50 p-4 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-4 border-pink-500 bg-white"></div>
                          <span className="font-medium text-pink-900">💵 Cash (Bayar di tempat)</span>
                        </div>
                        <CheckCircle2 className="text-pink-500 w-5 h-5" />
                      </label>
                      
                      <label className="flex items-center justify-between rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-60 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                          <span className="font-medium text-gray-500">🏦 Transfer Bank</span>
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold">Coming Soon</span>
                      </label>

                      <label className="flex items-center justify-between rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-60 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                          <span className="font-medium text-gray-500">📱 QRIS</span>
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold">Coming Soon</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-pink-900 mb-3">Metode Pengambilan</h3>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between rounded-xl border-2 border-pink-500 bg-pink-50 p-4 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-4 border-pink-500 bg-white"></div>
                          <span className="font-medium text-pink-900">🎒 Ambil Sendiri (Sekolah)</span>
                        </div>
                        <CheckCircle2 className="text-pink-500 w-5 h-5" />
                      </label>

                      <label className="flex items-center justify-between rounded-xl border-2 border-gray-100 bg-gray-50 p-4 opacity-60 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                          <span className="font-medium text-gray-500">🛵 Delivery</span>
                        </div>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold">Coming Soon</span>
                      </label>
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
                  className="w-full rounded-full bg-pink-500 py-3 font-bold text-white shadow-pink transition-all hover:bg-pink-600 active:scale-95"
                >
                  Lanjut Pembayaran →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full rounded-full bg-green-500 py-3 font-bold text-white shadow-lg transition-all hover:bg-green-600 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Memproses..." : "Konfirmasi & Chat WhatsApp 💬"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
