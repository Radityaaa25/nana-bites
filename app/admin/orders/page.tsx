import OrdersTableClient from "@/components/admin/OrdersTableClient";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getOrders() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const headerStore = await headers();
    const cookieHeader = headerStore.get("cookie") || "";
    const res = await fetch(`${baseUrl}/api/orders`, {
      cache: "no-store",
      headers: {
        cookie: cookieHeader,
      },
    });

    if (!res.ok) throw new Error("Gagal mengambil pesanan dari API");
    const orders = await res.json();
    return Array.isArray(orders) ? orders : [];
  } catch (error) {
    console.error('getOrders error:', error);
    return [];
  }
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  
  return <OrdersTableClient initialOrders={orders} />;
}
