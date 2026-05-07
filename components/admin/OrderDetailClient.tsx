"use client";

import { useState } from "react";
import { formatRupiah, formatDate, generateWaLink } from "@/lib/utils";
import { ArrowLeft, Clock, CheckCircle, Truck, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OrderDetailClient({ order }: { order: any }) {
  const [status, setStatus] = useState(order.status);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdateStatus = async (newStatus: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Gagal update");

      setStatus(newStatus);
      toast.success("Status pesanan berhasil diupdate!");
      router.refresh();
    } catch (error) {
      toast.error("Gagal mengubah status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Yakin mau hapus pesanan ini?")) return;
    
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus");
      
      toast.success("Pesanan berhasil dihapus!");
      router.push("/admin/orders");
    } catch (error) {
      toast.error("Gagal menghapus pesanan");
    }
  };

  const getStatusVisual = () => {
    const steps = [
      { id: 'pending', label: 'Pending', icon: Clock },
      { id: 'processing', label: 'Diproses', icon: Truck },
      { id: 'completed', label: 'Selesai', icon: CheckCircle }
    ];

    let currentStepIndex = steps.findIndex(s => s.id === status);
    if (currentStepIndex === -1) currentStepIndex = 0;

    return (
      <div className="flex items-center justify-between w-full max-w-md mx-auto mb-10 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-pink-100 -translate-y-1/2 z-0"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-pink-500 -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, i) => {
          const isActive = i <= currentStepIndex;
          const Icon = step.icon;
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-pink-500 text-white shadow-pink' : 'bg-white border-2 border-pink-200 text-pink-300'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold ${isActive ? 'text-pink-900' : 'text-pink-300'}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders" className="p-2 rounded-xl bg-white border border-pink-100 text-pink-600 hover:bg-pink-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-playfair text-3xl font-bold text-pink-900">Detail Pesanan #{order.id}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-6">
            <h2 className="font-bold text-pink-900 mb-6">Status Pesanan</h2>
            {getStatusVisual()}

            <div className="flex justify-center mt-8">
              {status === 'pending' && (
                <button 
                  onClick={() => handleUpdateStatus('processing')}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70"
                >
                  {isLoading ? "Loading..." : "Proses Pesanan →"}
                </button>
              )}
              {status === 'processing' && (
                <button 
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2"
                >
                  {isLoading ? "Loading..." : <><CheckCircle2 className="w-5 h-5" /> Tandai Selesai</>}
                </button>
              )}
              {status === 'completed' && (
                <div className="bg-green-100 text-green-700 px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Pesanan Selesai
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-6">
            <h2 className="font-bold text-pink-900 mb-4">Daftar Item</h2>
            <div className="space-y-4">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-pink-50 bg-pink-50/30">
                  <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center text-2xl">🍱</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-pink-900">{item.name}</h4>
                    <p className="text-sm text-pink-600">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    <p className="font-bold text-pink-900">{formatRupiah(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-pink-100">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-pink-900">Total Harga</span>
                <span className="text-pink-600">{formatRupiah(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-6">
            <h2 className="font-bold text-pink-900 mb-4">Informasi Pelanggan</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Nama</p>
                <p className="font-bold text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">No. WhatsApp</p>
                <p className="font-bold text-gray-900">{order.customerPhone}</p>
              </div>
              <div className="pt-4">
                <a 
                  href={`https://wa.me/${order.customerPhone.startsWith('0') ? '62' + order.customerPhone.slice(1) : order.customerPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-bold transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Hubungi via WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-6">
            <h2 className="font-bold text-pink-900 mb-4">Detail Tambahan</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-pink-50">
                <span className="text-gray-500">Waktu Order</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-pink-50">
                <span className="text-gray-500">Pembayaran</span>
                <span className="font-medium uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-pink-50">
                <span className="text-gray-500">Pengiriman</span>
                <span className="font-medium uppercase">{order.deliveryMethod}</span>
              </div>
              {order.notes && (
                <div className="pt-2">
                  <span className="text-gray-500 block mb-1">Catatan:</span>
                  <p className="bg-pink-50 p-3 rounded-lg text-pink-900">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleDelete}
              className="w-full py-3 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-colors border border-red-100"
            >
              Hapus Pesanan Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
