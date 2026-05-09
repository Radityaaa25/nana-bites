"use client";
import { useCartStore } from "@/lib/store";
import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah } from "@/lib/utils";

export default function FloatingCartBar({
  onOpenCart,
}: {
  onOpenCart: () => void;
}) {
  const { items, getCartTotal } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-40 md:left-auto 
                     md:right-6 md:w-80">
          <button
            onClick={onOpenCart}
            className="w-full flex items-center justify-between 
                       bg-pink-500 hover:bg-pink-600 text-white 
                       rounded-2xl px-4 py-3 shadow-lg 
                       shadow-pink-200 transition-all duration-200
                       active:scale-95">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-1.5">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">
                {totalItems} item di keranjang
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">
                {formatRupiah(getCartTotal())}
              </span>
              <span className="text-white/80 text-sm">›</span>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
