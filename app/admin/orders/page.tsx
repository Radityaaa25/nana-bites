import OrdersTableClient from "@/components/admin/OrdersTableClient";
import { headers } from "next/headers";

async function getOrders() {
  const headersList = await headers();
  const cookie = headersList.get('cookie') || '';
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders`, {
    headers: { cookie },
    cache: 'no-store'
  });
  
  if (!res.ok) return [];
  return res.json();
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  
  return <OrdersTableClient initialOrders={orders} />;
}
