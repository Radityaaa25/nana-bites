"use client";

import { useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Eye, Trash2, Clock, CheckCircle, FileDown, ChevronRight, BarChart3, List } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import ConfirmationModal from "./ConfirmationModal";

export default function OrdersTableClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"list" | "report">("list");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const filteredOrders = orders.filter(o => filter === "all" ? true : o.status === filter);

  // Sort by date descending
  filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDelete = async () => {
    if (!selectedOrderId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus");
      
      toast.success("Pesanan berhasil dihapus!");
      setOrders(orders.filter(o => o.id !== selectedOrderId));
      setIsDeleteModalOpen(false);
      setSelectedOrderId(null);
      router.refresh();
    } catch (error) {
      toast.error("Gagal menghapus pesanan");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setSelectedOrderId(id);
    setIsDeleteModalOpen(true);
  };

  // Group orders by month
  const groupedByMonth = orders.reduce((acc: any, order) => {
    const date = new Date(order.createdAt);
    const monthYear = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) {
      acc[monthYear] = {
        name: monthYear,
        orders: [],
        total: 0,
      };
    }
    acc[monthYear].orders.push(order);
    acc[monthYear].total += order.totalPrice;
    return acc;
  }, {});

  const reportData = Object.values(groupedByMonth).sort((a: any, b: any) => {
    // Sort by month/year descending
    const dateA = new Date(a.orders[0].createdAt);
    const dateB = new Date(b.orders[0].createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  const exportToExcel = (monthData: any) => {
    const data = monthData.orders.map((order: any) => ({
      "No. Order": order.id,
      "Pelanggan": order.customerName,
      "WhatsApp": order.customerPhone,
      "Status": order.status,
      "Total": order.totalPrice,
      "Waktu": formatDate(order.createdAt),
      "Metode Bayar": order.paymentMethod,
      "Catatan": order.notes
    }));

    // Add total row
    data.push({
      "No. Order": "TOTAL",
      "Pelanggan": "",
      "WhatsApp": "",
      "Status": "",
      "Total": monthData.total,
      "Waktu": "",
      "Metode Bayar": "",
      "Catatan": ""
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Pesanan");
    
    // Save file
    XLSX.writeFile(workbook, `Laporan-NanaBites-${monthData.name.replace(' ', '-')}.xlsx`);
    toast.success(`Berhasil ekspor laporan ${monthData.name}`);
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
    <div className="pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h1 className="font-playfair text-4xl font-bold text-pink-900 mb-2">Manajemen Pesanan 🍱</h1>
          <p className="text-pink-600/60 font-medium">Kelola pesanan masuk dan pantau omzet kamu kak.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-pink-100">
          <button 
            onClick={() => setView("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'list' ? 'bg-pink-500 text-white shadow-pink' : 'text-pink-400 hover:bg-pink-50'}`}
          >
            <List className="w-4 h-4" />
            Daftar Pesanan
          </button>
          <button 
            onClick={() => setView("report")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === 'report' ? 'bg-pink-500 text-white shadow-pink' : 'text-pink-400 hover:bg-pink-50'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Laporan Bulanan
          </button>
        </div>
      </div>

      {view === "list" ? (
        <>
          <div className="flex bg-white rounded-2xl shadow-sm border border-pink-100 p-1 mb-6 w-max">
            <button onClick={() => setFilter("all")} className={`px-5 py-2 text-xs font-bold rounded-xl transition-colors ${filter === 'all' ? 'bg-pink-100 text-pink-700' : 'text-gray-400 hover:bg-pink-50'}`}>Semua</button>
            <button onClick={() => setFilter("pending")} className={`px-5 py-2 text-xs font-bold rounded-xl transition-colors ${filter === 'pending' ? 'bg-pink-100 text-pink-700' : 'text-gray-400 hover:bg-pink-50'}`}>Pending</button>
            <button onClick={() => setFilter("processing")} className={`px-5 py-2 text-xs font-bold rounded-xl transition-colors ${filter === 'processing' ? 'bg-pink-100 text-pink-700' : 'text-gray-400 hover:bg-pink-50'}`}>Diproses</button>
            <button onClick={() => setFilter("completed")} className={`px-5 py-2 text-xs font-bold rounded-xl transition-colors ${filter === 'completed' ? 'bg-pink-100 text-pink-700' : 'text-gray-400 hover:bg-pink-50'}`}>Selesai</button>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-pink-50/50 text-pink-900/60 font-bold border-b border-pink-100 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-5">No. Order</th>
                    <th className="p-5">Pelanggan</th>
                    <th className="p-5">Total</th>
                    <th className="p-5">Waktu</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-pink-50/30 transition-colors group">
                      <td className="p-5 font-bold text-pink-900">#{order.id}</td>
                      <td className="p-5">
                        <p className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors">{order.customerName}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{order.customerPhone}</p>
                      </td>
                      <td className="p-5 font-bold text-pink-600">{formatRupiah(order.totalPrice)}</td>
                      <td className="p-5 text-gray-500 font-medium">{formatDate(order.createdAt)}</td>
                      <td className="p-5">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/orders/${order.id}`} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors" title="Lihat Detail">
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button onClick={() => openDeleteModal(order.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors" title="Hapus">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-4xl opacity-50">🍱</span>
                          <p className="text-gray-400 font-medium">Belum ada pesanan nih kak.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {reportData.map((month: any) => (
            <div key={month.name} className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
              <div className="p-6 bg-pink-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-pink-900 text-lg flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-pink-400" />
                    {month.name}
                  </h3>
                  <p className="text-pink-600/70 text-sm font-medium">{month.orders.length} Pesanan Berhasil</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex-1 md:flex-initial bg-white px-6 py-2.5 rounded-2xl border border-pink-200">
                    <p className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Total Penghasilan</p>
                    <p className="text-xl font-bold text-pink-600">{formatRupiah(month.total)}</p>
                  </div>
                  <button 
                    onClick={() => exportToExcel(month)}
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-green-100 active:scale-95"
                  >
                    <FileDown className="w-4 h-4" />
                    Ekspor Excel
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-pink-900/40 font-bold uppercase tracking-wider text-[10px] border-b border-pink-50">
                    <tr>
                      <th className="p-5">Waktu</th>
                      <th className="p-5">No. Order</th>
                      <th className="p-5">Pelanggan</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50">
                    {month.orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-pink-50/20 transition-colors">
                        <td className="p-5 text-gray-500 font-medium whitespace-nowrap">{formatDate(order.createdAt).split(',')[0]}</td>
                        <td className="p-5 font-bold text-pink-900">#{order.id}</td>
                        <td className="p-5">
                          <p className="font-bold text-gray-800">{order.customerName}</p>
                        </td>
                        <td className="p-5">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="p-5 text-right font-bold text-pink-600">{formatRupiah(order.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {reportData.length === 0 && (
            <div className="bg-white rounded-3xl border-2 border-dashed border-pink-100 p-20 text-center">
              <BarChart3 className="w-16 h-16 text-pink-100 mx-auto mb-4" />
              <p className="text-pink-300 font-bold">Belum ada data laporan tersedia.</p>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Pesanan"
        message="Hapus data pesanan ini kak? Data tidak bisa dikembalikan lho. 🥺"
      />
    </div>
  );
}
