"use client";

import { useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Eye, Trash2, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OrdersTableClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  const filteredOrders = orders.filter(o => filter === "all" ? true : o.status === filter);

  // Sort by date descending
  filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus pesanan ini?")) return;
    
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus");
      
      toast.success("Pesanan berhasil dihapus!");
      setOrders(orders.filter(o => o.id !== id));
      router.refresh();
    } catch (error) {
      toast.error("Gagal menghapus pesanan");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Pending</span>;
      case 'processing': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Diproses</span>;
      case 'completed': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3" /> Selesai</span>;
      default: return null;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="font-playfair text-3xl font-bold text-pink-900">Pesanan Masuk 📦</h1>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-pink-100 p-1">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-pink-100 text-pink-700' : 'text-gray-500 hover:bg-pink-50'}`}>Semua</button>
          <button onClick={() => setFilter("pending")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'pending' ? 'bg-pink-100 text-pink-700' : 'text-gray-500 hover:bg-pink-50'}`}>Pending</button>
          <button onClick={() => setFilter("processing")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'processing' ? 'bg-pink-100 text-pink-700' : 'text-gray-500 hover:bg-pink-50'}`}>Diproses</button>
          <button onClick={() => setFilter("completed")} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'completed' ? 'bg-pink-100 text-pink-700' : 'text-gray-500 hover:bg-pink-50'}`}>Selesai</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-pink-50/50 text-pink-900/70 font-medium border-b border-pink-100">
              <tr>
                <th className="p-4">No. Order</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Total</th>
                <th className="p-4">Waktu</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-pink-50/30 transition-colors">
                  <td className="p-4 font-bold text-pink-900">#{order.id}</td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.customerPhone}</p>
                    <p className="text-xs text-pink-500 mt-1">{order.items.length} items</p>
                  </td>
                  <td className="p-4 font-bold text-pink-600">{formatRupiah(order.totalPrice)}</td>
                  <td className="p-4 text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="p-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/orders/${order.id}`} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(order.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Belum ada pesanan dengan status ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
