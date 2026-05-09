"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Kalau di halaman login, jangan tampilkan sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/menu", label: "Manajemen Menu", icon: UtensilsCrossed },
    { href: "/admin/orders", label: "Pesanan", icon: Package },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Logout berhasil!");
        router.push("/admin/login");
        router.refresh();
      } else {
        toast.error("Gagal logout");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50/50 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-pink-100 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl">🍫</span>
          <span className="font-playfair text-xl font-bold text-pink-700">
            Admin Bites
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm",
                  isActive
                    ? "bg-pink-100 text-pink-700"
                    : "text-pink-900/60 hover:bg-pink-50 hover:text-pink-900",
                )}>
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium text-sm mt-auto disabled:opacity-50 disabled:cursor-not-allowed">
          <LogOut className="w-5 h-5" />
          {isLoggingOut ? "Logout..." : "Logout"}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Nav Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 flex justify-around p-3 z-50">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                isActive ? "text-pink-600" : "text-pink-900/50",
              )}>
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors text-red-500 disabled:opacity-50">
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-medium">
            {isLoggingOut ? "..." : "Logout"}
          </span>
        </button>
      </div>
    </div>
  );
}
