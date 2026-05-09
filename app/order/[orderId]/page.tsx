import { formatRupiah, formatDate } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle2, Clock, CheckCircle, AlertCircle } from "lucide-react";

async function getOrder(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/orders/${id}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  let order: OrderRow | null;

  try {
    order = await getOrder(orderId);
  } catch (error) {
    console.error("Order page error:", error);
    order = null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "processing":
        return (
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> Diproses
          </span>
        );
      case "completed":
        return (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Selesai
          </span>
        );
      default:
        return null;
    }
  };

  // Jika order tidak ditemukan, tampilkan UI friendly
  if (!order) {
    return (
      <div className="min-h-screen bg-pink-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-pink-50 p-8 text-center border-b border-pink-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="font-playfair text-2xl font-bold text-pink-900 mb-2">
              Pesanan Tidak Ditemukan
            </h1>
            <p className="text-pink-600 text-sm">
              Hmm, pesanan dengan nomor <strong>{orderId}</strong> tidak kami
              temukan.
            </p>
          </div>

          <div className="p-6">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 space-y-2 text-sm text-orange-800">
              <p>
                <strong>Kemungkinan penyebab:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Nomor pesanan salah atau kurang tepat</li>
                <li>Pesanan sedang diproses di server</li>
                <li>Silakan cek kembali nomor pesanan Anda</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER}?text=Halo%20kak%2C%20saya%20mencari%20pesanan%20${orderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-full border-2 border-pink-200 py-3 font-bold text-pink-600 text-center hover:bg-pink-50 transition-colors">
                Chat WhatsApp untuk Bantuan 💬
              </a>
              <Link
                href="/"
                className="w-full rounded-full bg-pink-500 py-3 font-bold text-white text-center shadow-pink hover:bg-pink-600 transition-colors">
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  type OrderStatus = "pending" | "processing" | "completed";

  type OrderItemRow = {
    menuId: string | null;
    name: string;
    price: number;
    quantity: number;
  };

  type OrderRow = {
    id: string;
    customerName: string;
    customerPhone: string;
    totalPrice: number;
    paymentMethod: string;
    deliveryMethod: string;
    notes?: string;
    status: OrderStatus;
    createdAt: string;
    items: OrderItemRow[];
  };

  return (
    <div className="min-h-screen bg-pink-50/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-pink-50 p-8 text-center border-b border-pink-100">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-pink-500" />
          </div>
          <h1 className="font-playfair text-2xl font-bold text-pink-900 mb-2">
            Yay! Pesanan Berhasil 🎉
          </h1>
          <p className="text-pink-600 text-sm">
            Terima kasih kak {order.customerName}!
          </p>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6 bg-pink-50/50 p-4 rounded-xl border border-pink-100">
            <div>
              <p className="text-xs text-pink-500 font-medium mb-1">
                No. Pesanan
              </p>
              <p className="font-bold text-pink-900">{order.id}</p>
            </div>
            {getStatusBadge(order.status)}
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="font-bold text-pink-900 text-sm">Detail Item</h3>
            <div className="space-y-3">
              {order.items.map((item: OrderItemRow, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-pink-800">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium text-pink-900">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-dashed border-pink-200 flex justify-between font-bold text-pink-900">
              <span>Total Bayar</span>
              <span className="text-pink-600">
                {formatRupiah(order.totalPrice)}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-xl mb-8 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Waktu</span>
              <span className="font-medium text-gray-800">
                {formatDate(order.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pembayaran</span>
              <span className="font-medium text-gray-800 uppercase">
                {order.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pengiriman</span>
              <span className="font-medium text-gray-800 uppercase">
                {order.deliveryMethod}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER}?text=Halo%20kak%2C%20mau%20tanya%20pesanan%20${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-full border border-pink-200 py-3 font-bold text-pink-600 text-center hover:bg-pink-50 transition-colors">
              Chat WhatsApp Lagi 💬
            </a>
            <Link
              href="/"
              className="w-full rounded-full bg-pink-500 py-3 font-bold text-white text-center shadow-pink hover:bg-pink-600 transition-colors">
              Pesan Lagi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
