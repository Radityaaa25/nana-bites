"use client";

import { useState } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import type { PaymentAiResult, PaymentStatus } from "@/lib/payment";

import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Truck,
  Phone,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import ConfirmationModal from "@/components/ui/ConfirmationModal";

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
  paymentStatus?: PaymentStatus;
  paymentProofUrl?: string | null;
  paymentAiResult?: PaymentAiResult | null;
  paymentReviewNote?: string | null;
  paymentUploadedAt?: string | null;
  paymentApprovedAt?: string | null;
  paymentUploadCount?: number;
};

export default function OrderDetailClient({ order }: { order: OrderRow }) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    order.paymentStatus ?? "unpaid",
  );
  const [paymentNote, setPaymentNote] = useState(
    order.paymentReviewNote ?? "",
  );
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
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
    } catch {
      toast.error("Gagal mengubah status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal hapus");

      toast.success("Pesanan berhasil dihapus!");
      router.push("/admin/orders");
      router.refresh();
    } catch {
      toast.error("Gagal menghapus pesanan");
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handlePaymentAction = async (action: "approve" | "reject") => {
    setIsUpdatingPayment(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: paymentNote.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal mengubah status pembayaran");
      }

      setPaymentStatus(action === "approve" ? "paid" : "rejected");
      toast.success(
        action === "approve"
          ? "Pembayaran dikonfirmasi lunas!"
          : "Bukti pembayaran ditolak.",
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengubah status pembayaran",
      );
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const getStatusVisual = () => {
    const steps = [
      { id: "pending", label: "Pending", icon: Clock },
      { id: "processing", label: "Diproses", icon: Truck },
      { id: "completed", label: "Selesai", icon: CheckCircle },
    ];

    let currentStepIndex = steps.findIndex((s) => s.id === status);
    if (currentStepIndex === -1) currentStepIndex = 0;

    return (
      <div className="flex items-center justify-between w-full max-w-md mx-auto mb-10 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-pink-100 -translate-y-1/2 z-0"></div>
        <div
          className="absolute top-1/2 left-0 h-1 bg-pink-500 -translate-y-1/2 z-0 transition-all duration-500"
          style={{
            width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
          }}></div>

        {steps.map((step, i) => {
          const isActive = i <= currentStepIndex;
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive ? "bg-pink-500 text-white shadow-pink" : "bg-white border-2 border-pink-200 text-pink-300"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs font-bold ${isActive ? "text-pink-900" : "text-pink-300"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/orders"
          className="p-2 rounded-xl bg-white border border-pink-100 text-pink-600 hover:bg-pink-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-playfair text-3xl font-bold text-pink-900">
          Detail Pesanan #{order.id}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-6">
            <h2 className="font-bold text-pink-900 mb-6">Status Pesanan</h2>
            {getStatusVisual()}

            <div className="flex justify-center mt-8">
              {status === "pending" && (
                <button
                  onClick={() => handleUpdateStatus("processing")}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-70">
                  {isLoading ? "Loading..." : "Proses Pesanan →"}
                </button>
              )}
              {status === "processing" && (
                <button
                  onClick={() => handleUpdateStatus("completed")}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-70 flex items-center gap-2">
                  {isLoading ? (
                    "Loading..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Tandai Selesai
                    </>
                  )}
                </button>
              )}
              {status === "completed" && (
                <div className="bg-green-100 text-green-700 px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Pesanan Selesai
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-6">
            <h2 className="font-bold text-pink-900 mb-4">Daftar Item</h2>
            <div className="space-y-4">
              {order.items.map((item, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl border border-pink-50 bg-pink-50/30">
                  <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center text-2xl">
                    🍱
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-pink-900">{item.name}</h4>
                    <p className="text-sm text-pink-600">
                      {formatRupiah(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                    <p className="font-bold text-pink-900">
                      {formatRupiah(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-pink-100">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-pink-900">Total Harga</span>
                <span className="text-pink-600">
                  {formatRupiah(order.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-6">
            <h2 className="font-bold text-pink-900 mb-4">
              Informasi Pelanggan
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Nama</p>
                <p className="font-bold text-gray-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  No. WhatsApp
                </p>
                <p className="font-bold text-gray-900">{order.customerPhone}</p>
              </div>
              <div className="pt-4">
                <a
                  href={`https://wa.me/${order.customerPhone.startsWith("0") ? "62" + order.customerPhone.slice(1) : order.customerPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-bold transition-colors">
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
                <span className="font-medium">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-pink-50">
                <span className="text-gray-500">Pembayaran</span>
                <span className="font-medium uppercase">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-pink-50">
                <span className="text-gray-500">Pengiriman</span>
                <span className="font-medium uppercase">
                  {order.deliveryMethod}
                </span>
              </div>
              {order.notes && (
                <div className="pt-2">
                  <span className="text-gray-500 block mb-1">Catatan:</span>
                  <p className="bg-pink-50 p-3 rounded-lg text-pink-900">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {order.paymentMethod.toLowerCase() === "qris" && (
            <div className="bg-white rounded-3xl shadow-sm border border-pink-100 p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-bold text-pink-900">Pembayaran QRIS</h2>
                <PaymentBadge status={paymentStatus} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-pink-50">
                  <span className="text-gray-500">Upload ke</span>
                  <span className="font-medium">
                    {order.paymentUploadCount ?? 0}x
                  </span>
                </div>
                {order.paymentUploadedAt && (
                  <div className="flex justify-between py-2 border-b border-pink-50">
                    <span className="text-gray-500">Waktu Upload</span>
                    <span className="font-medium">
                      {formatDate(order.paymentUploadedAt)}
                    </span>
                  </div>
                )}
                {order.paymentApprovedAt && (
                  <div className="flex justify-between py-2 border-b border-pink-50">
                    <span className="text-gray-500">Dikonfirmasi</span>
                    <span className="font-medium">
                      {formatDate(order.paymentApprovedAt)}
                    </span>
                  </div>
                )}
              </div>

              {order.paymentProofUrl ? (
                <a
                  href={order.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block overflow-hidden rounded-xl border border-pink-100 bg-pink-50"
                  title="Buka bukti pembayaran">
                  <Image
                    src={order.paymentProofUrl}
                    alt={`Bukti pembayaran ${order.id}`}
                    width={500}
                    height={650}
                    unoptimized
                    className="h-auto max-h-80 w-full object-contain"
                  />
                  <span className="flex items-center justify-center gap-1 py-2 text-xs font-bold text-pink-600">
                    <ExternalLink className="h-3 w-3" /> Buka ukuran penuh
                  </span>
                </a>
              ) : (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-pink-200 bg-pink-50/50 p-4 text-sm text-pink-500">
                  <ImageIcon className="h-4 w-4" />
                  Belum ada bukti pembayaran.
                </div>
              )}

              {order.paymentAiResult && (
                <AiPaymentResult result={order.paymentAiResult} />
              )}

              <div className="mt-4">
                <label className="mb-1 block text-xs font-bold text-gray-500">
                  Catatan untuk pembeli (opsional)
                </label>
                <textarea
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  placeholder="Contoh: Nominal kurang Rp2.000, mohon dicek lagi."
                  className="min-h-[70px] w-full rounded-xl border border-pink-100 bg-pink-50/30 px-3 py-2 text-sm outline-none focus:border-pink-400"
                />
              </div>

              {paymentStatus !== "paid" ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePaymentAction("reject")}
                    disabled={isUpdatingPayment}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60">
                    <XCircle className="h-4 w-4" /> Tolak
                  </button>
                  <button
                    onClick={() => handlePaymentAction("approve")}
                    disabled={isUpdatingPayment || !order.paymentProofUrl}
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60">
                    <CheckCircle2 className="h-4 w-4" /> Lunas
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> Pembayaran sudah lunas
                </div>
              )}
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full py-3 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-colors border border-red-100">
              Hapus Pesanan Ini
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Pesanan"
        message={`Yakin mau hapus pesanan #${order.id}? Data yang dihapus tidak bisa dikembalikan lho kak. 🥺`}
      />
    </div>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const map: Record<
    PaymentStatus,
    { label: string; className: string; icon: typeof Clock }
  > = {
    unpaid: {
      label: "Belum Bayar",
      className: "bg-amber-100 text-amber-800",
      icon: Clock,
    },
    review: {
      label: "Cek Bukti",
      className: "bg-blue-100 text-blue-800",
      icon: ShieldAlert,
    },
    paid: {
      label: "Lunas",
      className: "bg-green-100 text-green-800",
      icon: CheckCircle,
    },
    rejected: {
      label: "Ditolak",
      className: "bg-red-100 text-red-800",
      icon: XCircle,
    },
  };

  const item = map[status];
  const Icon = item.icon;

  return (
    <span
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${item.className}`}>
      <Icon className="h-3 w-3" /> {item.label}
    </span>
  );
}

function AiPaymentResult({ result }: { result: PaymentAiResult }) {
  const verdictClass =
    result.verdict === "valid"
      ? "border-green-200 bg-green-50 text-green-800"
      : result.verdict === "suspicious"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className={`mt-4 rounded-xl border p-3 text-xs ${verdictClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold uppercase tracking-wide">
          Hasil Pemeriksaan:{" "}
          {result.verdict === "valid"
            ? "Sesuai"
            : result.verdict === "suspicious"
              ? "Perlu Dicek"
              : "Tidak Sesuai"}
        </p>
        <span className="font-bold">
          {Math.round(result.checks.confidence * 100)}%
        </span>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-1.5">
        <p>
          <span className="opacity-60">Nominal: </span>
          <span className="font-bold">
            {result.checks.nominal.detected === null
              ? "Tidak terbaca"
              : formatRupiah(result.checks.nominal.detected)}
          </span>{" "}
          {result.checks.nominal.match ? "(cocok)" : "(tidak cocok)"}
        </p>
        <p>
          <span className="opacity-60">Merchant: </span>
          <span className="font-bold">
            {result.checks.recipient.detected || "Tidak terbaca"}
          </span>
        </p>
        <p>
          <span className="opacity-60">Waktu: </span>
          <span className="font-bold">
            {result.checks.time.detected || "Tidak terbaca"}
          </span>
        </p>
        <p>
          <span className="opacity-60">Pengirim: </span>
          <span className="font-bold">
            {result.extraction.detected_sender || "Tidak terbaca"}
          </span>
        </p>
      </div>

      {result.reasons.filter((reason) => !/\bAI\b/i.test(reason)).length >
        0 && (
        <ul className="mt-2 list-inside list-disc space-y-1">
          {result.reasons
            .filter((reason) => !/\bAI\b/i.test(reason))
            .map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
        </ul>
      )}

      <p className="mt-2 opacity-70">
        Pemeriksaan ini hanya pengecekan awal. Tetap cocokkan dengan mutasi
        DANA sebelum konfirmasi lunas.
      </p>
    </div>
  );
}
