"use client";

import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";

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
  item: MenuItem;
  onOpenDetail: (item: MenuItem) => void;
}

export default function ProductCard({ item, onOpenDetail }: Props) {
  const { addItem, updateQuantity, items } = useCartStore();
  const cartItem = items.find((i) => i.menuId === item.id);
  const quantity = cartItem?.quantity ?? 0;
  const isDisabled = !item.isAvailable || !!item.isComingSoon;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // don't open modal when clicking "Tambah"
    if (isDisabled) return;
    addItem({
      menuId: item.id,
      name: item.name,
      price: item.price,
      image:
        item.image ||
        `https://placehold.co/400x300/FDF2F8/BE185D?text=${encodeURIComponent(item.name)}`,
    });
  };

  const handleQtyChange = (e: React.MouseEvent, newQty: number) => {
    e.stopPropagation();
    updateQuantity(item.id, newQty);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 32 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 180, damping: 20 } },
      }}
      whileHover={isDisabled ? {} : { y: -4, boxShadow: "0 20px 40px -8px rgba(244,114,182,0.3)" }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      onClick={() => onOpenDetail(item)}
      className={`group relative overflow-hidden rounded-2xl border bg-white cursor-pointer transition-shadow ${
        isDisabled ? "border-gray-200 opacity-60" : "border-pink-100 hover:border-pink-200"
      } ${!item.isAvailable && !item.isComingSoon ? "grayscale" : ""}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-pink-50">
        <Image
          src={
            item.image ||
            `https://placehold.co/400x300/FDF2F8/BE185D?text=${encodeURIComponent(item.name)}`
          }
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized={!item.image}
        />

        {/* Best Seller ribbon */}
        {item.isBestSeller && !isDisabled && (
          <div className="absolute left-0 top-3">
            <div className="bg-pink-500 text-white text-[10px] font-bold pl-3 pr-4 py-1 rounded-r-full shadow-md">
              ✨ Best Seller
            </div>
          </div>
        )}

        {/* Coming Soon overlay */}
        {item.isComingSoon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-900/50 backdrop-blur-sm gap-2">
            <span className="text-3xl">🔮</span>
            <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">
              Coming Soon
            </span>
          </div>
        )}

        {/* Habis overlay */}
        {!item.isAvailable && !item.isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <span className="bg-gray-800 text-white font-bold px-4 py-2 rounded-full">Habis</span>
          </div>
        )}

        {/* Hover hint */}
        {!isDisabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-pink-900/0 group-hover:bg-pink-900/10 transition-colors duration-300">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-pink-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow">
              Klik untuk detail
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading text-[17px] font-bold text-pink-900 line-clamp-1 mb-1">
          {item.name}
        </h3>
        <p className="text-xs text-pink-700/60 line-clamp-2 min-h-[32px] leading-relaxed">
          {item.description}
        </p>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-pink-50">
          <span className="font-body text-base font-bold text-pink-600">
            {formatRupiah(item.price)}
          </span>

          {/* Qty control or Add button */}
          {quantity > 0 && !isDisabled ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 bg-pink-50 border border-pink-100 rounded-full px-2 py-1"
            >
              <button
                onClick={(e) => handleQtyChange(e, quantity - 1)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-pink-600 shadow-sm hover:bg-pink-100 transition-colors text-sm font-bold"
              >
                −
              </button>
              <span className="w-4 text-center text-sm font-bold text-pink-900">{quantity}</span>
              <button
                onClick={(e) => handleQtyChange(e, quantity + 1)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-pink-500 text-white shadow-sm hover:bg-pink-600 transition-colors text-sm font-bold"
              >
                +
              </button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleAdd}
              disabled={isDisabled}
              className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white disabled:text-gray-400 text-xs font-bold px-4 py-2 rounded-full transition-colors shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {item.isComingSoon ? "Segera" : "Tambah"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
