"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsError(false);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        toast.success("Login berhasil!");
        router.push("/admin");
        router.refresh();
      } else {
        setIsError(true);
        toast.error("Password salah, coba lagi!");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-8 border border-pink-100"
        style={{
          willChange: "transform, opacity",
          transform: "translateZ(0)",
        }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-pink-600" />
          </div>
          <h1 className="font-playfair text-2xl font-bold text-pink-900 mb-2">
            Admin Login
          </h1>
          <p className="text-pink-600/70 text-sm">
            Silakan masukkan password untuk masuk
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <motion.div
            animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password..."
              className="w-full rounded-xl border border-pink-200 bg-pink-50/50 px-4 py-3 text-pink-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none mb-6"
              required
            />
          </motion.div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-pink-500 py-3 font-bold text-white shadow-pink hover:bg-pink-600 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
            {isLoading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
