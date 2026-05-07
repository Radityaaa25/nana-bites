"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";
import { X, Trash2, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import OrderModal from "./OrderModal";

export default function CartDrawer() {
  const { isCartOpen, setCartOpen, items, updateQuantity, removeItem, getCartTotal } = useCartStore();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-50 bg-pink-900/20 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-pink-100 p-6">
                <h2 className="font-playfair text-2xl font-bold text-pink-900">Keranjang Kamu 🛒</h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="rounded-full p-2 text-pink-400 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-4 text-center text-pink-300">
                    <ShoppingBag className="h-20 w-20 opacity-50" />
                    <p className="font-poppins text-lg font-medium text-pink-800">Yahh, keranjangnya masih kosong 🥺</p>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="rounded-full bg-pink-100 px-6 py-2 text-sm font-medium text-pink-700 hover:bg-pink-200"
                    >
                      Mulai Belanja
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {items.map((item) => (
                      <div key={item.menuId} className="flex items-center gap-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-pink-50 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            unoptimized={item.image.includes('placehold')}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-pink-900 line-clamp-1">{item.name}</h4>
                          <p className="text-sm font-medium text-pink-500">{formatRupiah(item.price)}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center rounded-full bg-pink-50 border border-pink-100">
                              <button
                                onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-l-full text-pink-600 hover:bg-pink-200"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-pink-900">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-r-full text-pink-600 hover:bg-pink-200"
                              >
                                +
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.menuId)}
                              className="text-pink-300 hover:text-pink-600 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-pink-100 bg-pink-50/50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-lg font-medium text-pink-900">Subtotal</span>
                    <span className="font-poppins text-xl font-bold text-pink-600">
                      {formatRupiah(getCartTotal())}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setCartOpen(false);
                      setIsOrderModalOpen(true);
                    }}
                    className="w-full rounded-full bg-pink-500 py-4 font-bold text-white shadow-pink transition-all hover:bg-pink-600 active:scale-95"
                  >
                    Beli Sekarang →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} />
    </>
  );
}
