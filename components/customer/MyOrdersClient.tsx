"use client";

import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  useCustomerOrderStore,
  type LocalOrderStatus,
} from "@/lib/customerOrderStore";
import type { PaymentStatus } from "@/lib/payment";
import { formatDate, formatRupiah } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Package,
  ReceiptText,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

const emptySubscribe = () => () => {};

const ORDER_STATUS_LABEL: Record<LocalOrderStatus, string> = {
  pending: "Pending",
  processing: "Diproses",
  completed: "Selesai",
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Belum Bayar",
  review: "Cek Bukti",
  paid: "Lunas",
  rejected: "Ditolak",
};

function OrderStatusBadge({ status }: { status: LocalOrderStatus }) {
  const className =
    status === "completed"
      ? "bg-green-100 text-green-800"
      : status === "processing"
        ? "bg-blue-100 text-blue-800"
        : "bg-yellow-100 text-yellow-800";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const className =
    status === "paid"
      ? "bg-green-100 text-green-800"
      : status === "review"
        ? "bg-blue-100 text-blue-800"
        : status === "rejected"
          ? "bg-red-100 text-red-800"
          : "bg-amber-100 text-amber-800";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${className}`}>
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}

export default function MyOrdersClient() {
  const orders = useCustomerOrderStore((state) => state.orders);
  const removeOrder = useCustomerOrderStore((state) => state.removeOrder);
  const clearOrders = useCustomerOrderStore((state) => state.clearOrders);
  const upsertOrder = useCustomerOrderStore((state) => state.upsertOrder);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] = useState<
    { type: "remove"; orderId: string } | { type: "clear" } | null
  >(null);

  const refreshOrders = useCallback(async () => {
    const currentOrders = useCustomerOrderStore.getState().orders;
    if (currentOrders.length === 0) return;

    setIsRefreshing(true);
    const nextErrors: Record<string, string> = {};

    await Promise.all(
      currentOrders.map(async (localOrder) => {
        try {
          const response = await fetch(`/api/orders/${localOrder.id}`, {
            cache: "no-store",
          });

          if (!response.ok) {
            nextErrors[localOrder.id] =
              response.status === 404
                ? "Pesanan tidak ditemukan di server."
                : "Gagal memuat status terbaru.";
            return;
          }

          const data = (await response.json()) as {
            id: string;
            createdAt: string;
            totalPrice: number;
            paymentMethod: string;
            paymentStatus?: PaymentStatus;
            status: LocalOrderStatus;
            items?: Array<{ name: string; quantity: number }>;
          };

          upsertOrder({
            id: data.id,
            createdAt: data.createdAt,
            totalPrice: data.totalPrice,
            paymentMethod: data.paymentMethod,
            paymentStatus: data.paymentStatus ?? "unpaid",
            orderStatus: data.status,
            items: Array.isArray(data.items)
              ? data.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                }))
              : localOrder.items,
          });
        } catch {
          nextErrors[localOrder.id] = "Tidak bisa menghubungi server.";
        }
      }),
    );

    setErrors(nextErrors);
    setIsRefreshing(false);
  }, [upsertOrder]);

  useEffect(() => {
    const unsubscribe = useCustomerOrderStore.persist.onFinishHydration(() => {
      void refreshOrders();
    });

    const timer = setTimeout(() => {
      if (useCustomerOrderStore.persist.hasHydrated()) {
        void refreshOrders();
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [refreshOrders]);

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const handleRemove = (id: string) => {
    setConfirmAction({ type: "remove", orderId: id });
  };

  const handleClear = () => {
    setConfirmAction({ type: "clear" });
  };

  const executeConfirm = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "remove") {
      removeOrder(confirmAction.orderId);
      toast.success("Pesanan dihapus dari riwayat lokal");
    } else {
      clearOrders();
      setErrors({});
      toast.success("Semua riwayat lokal dihapus");
    }

    setConfirmAction(null);
  };

  return (
    <div className="min-h-screen bg-pink-50/30 px-4 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
              <ReceiptText className="h-3.5 w-3.5" /> Riwayat di browser ini
            </div>
            <h1 className="font-playfair text-3xl font-bold text-pink-900 sm:text-4xl">
              Pesanan Saya 🧾
            </h1>
            <p className="mt-2 max-w-xl text-sm text-pink-600/80">
              Tersimpan tanpa login di perangkat ini. Kalau browser dibersihkan
              atau ganti device, riwayat ini tidak ikut pindah.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void refreshOrders()}
              disabled={isRefreshing || orders.length === 0}
              className="flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-xs font-bold text-pink-600 transition-colors hover:bg-pink-50 disabled:opacity-50">
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
            {orders.length > 0 && (
              <button
                onClick={handleClear}
                className="rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50">
                Hapus Semua
              </button>
            )}
          </div>
        </div>

        {!mounted ? (
          <div className="flex items-center justify-center rounded-3xl border border-pink-100 bg-white py-20">
            <Loader2 className="h-6 w-6 animate-spin text-pink-400" />
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-pink-100 bg-white p-12 text-center">
            <Package className="mx-auto mb-4 h-14 w-14 text-pink-200" />
            <h2 className="font-playfair text-xl font-bold text-pink-900">
              Belum ada pesanan
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-pink-500">
              Pesanan yang kamu buat di browser ini akan muncul otomatis di
              sini.
            </p>
            <Link
              href="/#menu"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-pink-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-pink-600">
              Lihat Menu <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOrders.map((order) => {
              const isQris = order.paymentMethod?.toLowerCase() === "qris";
              const needsPayment =
                isQris &&
                (order.paymentStatus === "unpaid" ||
                  order.paymentStatus === "rejected");

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-pink-900">#{order.id}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <OrderStatusBadge status={order.orderStatus} />
                      {isQris && (
                        <PaymentBadge status={order.paymentStatus} />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 rounded-2xl bg-pink-50/60 p-3 text-sm">
                    {order.items.slice(0, 4).map((item, index) => (
                      <div
                        key={`${order.id}-${item.name}-${index}`}
                        className="flex justify-between gap-3">
                        <span className="truncate text-pink-800">
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <p className="text-xs text-pink-400">
                        +{order.items.length - 4} item lainnya
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                        Total
                      </p>
                      <p className="text-lg font-bold text-pink-700">
                        {formatRupiah(order.totalPrice)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemove(order.id)}
                        className="rounded-full p-2 text-pink-300 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Hapus dari riwayat">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/order/${order.id}`}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-white transition-colors ${
                          needsPayment
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-pink-500 hover:bg-pink-600"
                        }`}>
                        {needsPayment ? (
                          <>
                            <CreditCard className="h-4 w-4" /> Bayar Sekarang
                          </>
                        ) : (
                          <>
                            Lihat Detail <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Link>
                    </div>
                  </div>

                  {errors[order.id] && (
                    <p className="mt-3 flex items-center gap-1 text-[11px] text-amber-600">
                      <Clock className="h-3 w-3" /> {errors[order.id]} Status
                      yang tampil mungkin belum terbaru.
                    </p>
                  )}

                  {isQris && order.paymentStatus === "paid" && (
                    <p className="mt-3 flex items-center gap-1 text-[11px] font-bold text-green-600">
                      <CheckCircle2 className="h-3 w-3" /> Pembayaran sudah
                      dikonfirmasi admin
                    </p>
                  )}

                  {isQris && order.paymentStatus === "rejected" && (
                    <p className="mt-3 flex items-center gap-1 text-[11px] font-bold text-red-500">
                      <XCircle className="h-3 w-3" /> Bukti ditolak, silakan
                      upload ulang
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeConfirm}
        title={
          confirmAction?.type === "clear"
            ? "Hapus Semua Riwayat?"
            : "Hapus Pesanan?"
        }
        message={
          confirmAction?.type === "clear"
            ? "Semua riwayat pesanan di browser ini akan dihapus. Data tidak bisa dikembalikan lho."
            : `Hapus pesanan #${
                confirmAction?.type === "remove" ? confirmAction.orderId : ""
              } dari riwayat lokal? Data tidak bisa dikembalikan lho.`
        }
        confirmText="Ya, Hapus"
      />
    </div>
  );
}
