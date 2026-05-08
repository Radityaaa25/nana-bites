"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Hapus",
  cancelText = "Batal",
  variant = "danger",
  isLoading = false,
}: Props) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          bg: "bg-red-50",
          icon: "text-red-600",
          button: "bg-red-600 hover:bg-red-700 shadow-red-100",
        };
      case "warning":
        return {
          bg: "bg-yellow-50",
          icon: "text-yellow-600",
          button: "bg-yellow-600 hover:bg-yellow-700 shadow-yellow-100",
        };
      default:
        return {
          bg: "bg-pink-50",
          icon: "text-pink-600",
          button: "bg-pink-600 hover:bg-pink-700 shadow-pink-100",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ willChange: "opacity" }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            style={{ willChange: "transform, opacity", transform: "translateZ(0)" }}
          >
            <div className={`p-6 ${styles.bg} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                <h3 className="font-bold text-gray-900">{title}</h3>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 text-sm leading-relaxed mb-8">
                {message}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-70 ${styles.button}`}
                >
                  {isLoading ? "Memproses..." : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
