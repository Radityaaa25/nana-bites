"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function FloatingNavbar() {
  const { getCartCount, toggleCart } = useCartStore();
  const cartCount = getCartCount();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50 flex w-[90%] max-w-2xl items-center justify-between rounded-full border border-pink-100 px-6 py-3 transition-colors duration-300",
        scrolled
          ? "bg-white/85 shadow-lg shadow-pink-100/50"
          : "bg-white/60",
      )}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        willChange: "transform, opacity",
      }}>
      <Link href="/" className="flex items-center">
        <Image
          src="/Logo.png"
          alt="Nana Bites"
          width={120}
          height={40}
          className="h-10 w-auto object-contain"
          priority
        />
      </Link>

      <div className="hidden md:flex gap-6 font-medium text-pink-900/70">
        <a href="#menu" className="hover:text-pink-600 transition-colors">
          Menu
        </a>
        <a href="#cara-pesan" className="hover:text-pink-600 transition-colors">
          Cara Pesan
        </a>
      </div>

      <button
        onClick={toggleCart}
        className="relative flex items-center justify-center rounded-full bg-pink-100 p-2 text-pink-700 hover:bg-pink-200 transition-colors">
        <ShoppingCart className="h-5 w-5" />
        {mounted && cartCount > 0 && (
          <span
            key={cartCount}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white">
            {cartCount}
          </span>
        )}
      </button>
    </nav>
  );
}
