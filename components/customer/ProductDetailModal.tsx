"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Star, Clock } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isBestSeller: boolean;
  isAvailable: boolean;
  isComingSoon?: boolean;
}

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

export default function ProductDetailModal({ item, onClose }: Props) {
  const { addItem, updateQuantity, items } = useCartStore();
  const cartItem = items.find((i) => i.menuId === item?.id);
  const quantity = cartItem?.quantity ?? 0;
  const isDisabled = !item?.isAvailable || item?.isComingSoon;

  const handleAdd = () => {
    if (!item || isDisabled) return;
    addItem({
      menuId: item.id,
      name: item.name,
      price: item.price,
      image:
        item.image ||
        `https://placehold.co/400x300/FDF2F8/BE185D?text=${encodeURIComponent(item.name)}`,
    });
  };

  return (
    <AnimatePresence mode="wait">
      {item && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-pink-950/40 backdrop-blur-sm"
            style={{ willChange: "opacity" }}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 bg-white/90 hover:bg-pink-50 text-pink-600 rounded-full p-2 shadow-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image */}
            <div className="relative w-full aspect-video bg-pink-50">
              <Image
                src={
                  item.image ||
                  `https://placehold.co/800x450/FDF2F8/BE185D?text=${encodeURIComponent(item.name)}`
                }
                alt={item.name}
                fill
                className="object-cover"
                unoptimized={!item.image}
              />

              {/* Overlay badges */}
              <div className="absolute bottom-3 left-3 flex gap-2">
                {item.isBestSeller && item.isAvailable && !item.isComingSoon && (
                  <span className="flex items-center gap-1 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    <Star className="w-3 h-3 fill-current" /> Best Seller
                  </span>
                )}
                {item.isComingSoon && (
                  <span className="flex items-center gap-1 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    <Clock className="w-3 h-3" /> Coming Soon
                  </span>
                )}
                {!item.isAvailable && !item.isComingSoon && (
                  <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    Habis
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h2 className="font-heading text-2xl font-bold text-pink-900 mb-2 leading-tight">
                {item.name}
              </h2>
              <p className="text-pink-700/70 text-sm leading-relaxed mb-5">
                {item.description}
              </p>

              {/* Price + Actions */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-pink-600 font-body">
                  {formatRupiah(item.price)}
                </span>

                {quantity > 0 && !isDisabled ? (
                  <div className="flex items-center gap-3 bg-pink-50 border border-pink-100 rounded-full px-4 py-2">
                    <button
                      onClick={() => updateQuantity(item.id, quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-pink-600 shadow-sm hover:bg-pink-100 transition-colors font-bold text-lg"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-pink-900">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-pink-500 text-white shadow-sm hover:bg-pink-600 transition-colors font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleAdd}
                    disabled={!!isDisabled}
                    className="flex items-center gap-1 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-3 py-3 rounded-full shadow-pink transition-all"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    {item.isComingSoon ? "Segera Hadir" : !item.isAvailable ? "Habis" : "Tambah ke Keranjang"}
                  </motion.button>
                )}
              </div>

              {/* Quantity hint */}
              {quantity > 0 && !isDisabled && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-xs text-pink-400 mt-3"
                >
                  {quantity} item sudah di keranjang kamu 🛒
                </motion.p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
