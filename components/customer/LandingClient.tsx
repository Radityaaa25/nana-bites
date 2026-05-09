"use client";

import {
  motion,
  useInView,
  type Variants,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import ProductCard from "./ProductCard";
import ProductDetailModal from "./ProductDetailModal";
import CartDrawer from "./CartDrawer";
import FloatingCartBar from "./FloatingCartBar";
import FloatingNavbar from "@/components/layout/FloatingNavbar";
import { useCartStore } from "@/lib/store";

// ─── Animation Variants (typed to fix TS ease error) ──────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Animated Section Wrapper ──────────────────────────────────────────────
function AnimatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
      style={{ willChange: "transform, opacity" }}>
      {children}
    </motion.div>
  );
}

// ─── Step Card ─────────────────────────────────────────────────────────────
function StepCard({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col items-center text-center p-6 rounded-3xl bg-pink-50/50 border border-pink-100 hover:border-pink-200 hover:bg-pink-50 transition-colors"
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}>
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-4">
        {emoji}
      </div>
      <h3 className="font-heading font-bold text-pink-900 text-xl mb-2">
        {title}
      </h3>
      <p className="text-pink-700/70 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ─── Main Landing Client Component ────────────────────────────────────────
type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isBestSeller: boolean;
  isAvailable: boolean;
  isComingSoon?: boolean;
};

type SelectedItem = MenuItem | null;

export default function LandingClient({
  menuItems,
}: {
  menuItems: MenuItem[];
}) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const { setCartOpen, items } = useCartStore();

  const menuRef = useRef(null);
  const menuInView = useInView(menuRef, { once: true, margin: "-60px" });

  // Reset scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const hasItems = items.length > 0;

  return (
    <div className={hasItems ? "pb-24 md:pb-0" : ""}>
      <FloatingNavbar />

      {/* ── Preorder Announcement Banner ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" as const }}
        className="fixed top-[72px] left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-xl"
        style={{
          willChange: "transform, opacity",
          transform: "translateZ(0)",
        }}></motion.div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 via-white to-pink-100 pt-24">
        {/* Animated blobs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
          className="absolute top-20 left-10 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], y: [0, -30, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: 2,
          }}
          className="absolute top-40 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, -20, 0] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay: 4,
          }}
          className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"
        />

        <div className="container px-4 mx-auto relative z-10 text-center max-w-3xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            style={{
              transform: "translateZ(0)",
              willChange: "transform, opacity",
            }}>
            <motion.p
              variants={fadeUp}
              className="text-pink-500 font-semibold text-sm tracking-widest uppercase mb-4">
              🍫 Jajanan Kekinian Nana Bites
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="font-heading text-5xl md:text-7xl font-bold text-pink-900 leading-tight mb-6">
              Cemilan Enak,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-700">
                Bikin Hari Makin 🩷 Pink
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-pink-700/70 mb-10 font-body leading-relaxed">
              Jajanan manis &amp; gurih spesial buat nemenin waktu santai kamu.
              Yuk pesan sekarang sebelum kehabisan! ✨
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="#menu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-pink-500 text-white font-bold text-lg shadow-pink hover:bg-pink-600 transition-colors"
                style={{ willChange: "transform" }}>
                Lihat Menu 🍫
              </motion.a>
              <motion.a
                href="#cara-pesan"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-pink-600 font-bold text-lg shadow-sm border border-pink-100 hover:bg-pink-50 transition-colors"
                style={{ willChange: "transform" }}>
                Cara Pesan
              </motion.a>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-pink-400">scroll</span>
          <div className="w-0.5 h-6 bg-gradient-to-b from-pink-300 to-transparent rounded-full" />
        </motion.div>
      </section>

      {/* ── Cara Pesan ────────────────────────────────────────────────────── */}
      <section id="cara-pesan" className="py-24 bg-white">
        <div className="container px-4 mx-auto max-w-5xl">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-pink-900 mb-4">
                Gampang Banget Pesannya! 🎉
              </h2>
              <p className="text-pink-600/80 text-lg">
                Cuma 3 langkah buat nikmatin Nana Bites
              </p>
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2 mt-2.5 rounded-full">
                <span>📦</span>
                <span className="text-amber-800">
                  <span className="font-bold">Pre-Order</span>
                  {" — "}
                  Pesanan diproses &amp; siap diambil besok atau sesuai jadwal.
                  Konfirmasi via WhatsApp ya! 🙏
                </span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StepCard
                emoji="🛒"
                title="1. Pilih Menu"
                desc="Pilih jajanan favorit kamu, klik untuk lihat detail, dan masukkan ke keranjang."
              />
              <StepCard
                emoji="📝"
                title="2. Isi Data"
                desc="Isi nama & nomor HP untuk konfirmasi pesanan kamu."
              />
              <StepCard
                emoji="💬"
                title="3. Chat WhatsApp"
                desc="Kirim detail pesanan lewat WA biar langsung diproses!"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />

      {/* ── Menu Section ──────────────────────────────────────────────────── */}
      <section id="menu" className="py-24 bg-pink-50/30">
        <div className="container px-4 mx-auto max-w-6xl">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-pink-900 mb-4">
                Menu Pilihan 🍱
              </h2>
              <p className="text-pink-600/80 text-lg mb-4">
                Awas ngiler lihat yang manis-manis! Klik menu untuk lihat
                detail.
              </p>
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2 rounded-full">
                <span>📦</span>
                <span className="text-amber-800">
                  <span className="font-bold">Pre-Order</span>
                  {" — "}
                  Pesanan diproses &amp; siap diambil besok atau sesuai jadwal.
                  Konfirmasi via WhatsApp ya! 🙏
                </span>
              </div>
            </motion.div>
          </AnimatedSection>

          <motion.div
            ref={menuRef}
            initial="hidden"
            animate={menuInView ? "visible" : "hidden"}
            variants={cardStagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            style={{ willChange: "transform, opacity" }}>
            {menuItems.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onOpenDetail={setSelectedItem}
              />
            ))}
          </motion.div>

          {menuItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20">
              <p className="text-5xl mb-4">🍱</p>
              <p className="font-heading text-xl text-pink-400">
                Menu sedang disiapkan, ditunggu ya!
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-pink-100 py-12">
        <div className="container px-6 mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo + Tagline Group */}
            <div className="flex items-center md:items-start md:mt-3 text-center md:text-left space-y-3">
              <Image
                src="/Logo.png"
                alt="Nana Bites"
                width={120}
                height={40}
                className="h-10 w-auto object-contain brightness-105"
              />
              <p className="text-pink-400 text-sm font-medium tracking-tight md:mt-2.5 ml-2 -mt-2">
                Cemilan enak, harga bersahabat{" "}
                <span className="text-pink-500">🩷</span>
              </p>
            </div>

            {/* Middle: Socials */}
            <div className="flex items-center">
              <a
                href="https://instagram.com/na_nyemill"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3 rounded-full border border-pink-100 bg-pink-50/50 hover:bg-pink-100/70 hover:border-pink-200 hover:shadow-sm transition-all duration-300 group">
                <div className="p-1.5 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-pink-500">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.01" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-pink-600 -ml-3 group-hover:text-pink-700">
                  @nanabites
                </span>
              </a>
            </div>

            {/* Right: Info */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-1">
              <p className="text-pink-400 text-xs font-semibold tracking-wide uppercase">
                Made with 🩷
              </p>
              <p className="text-pink-300 text-[10px] font-bold">
                &copy; {new Date().getFullYear()} Nana Bites. All Rights
                Reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Cart Bar - appears when items in cart */}
      <FloatingCartBar onOpenCart={() => setCartOpen(true)} />

      {/* Modals & Drawer */}
      <AnimatePresence mode="wait">
        {selectedItem && (
          <ProductDetailModal
            key="product-detail"
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
      <CartDrawer />
    </div>
  );
}
