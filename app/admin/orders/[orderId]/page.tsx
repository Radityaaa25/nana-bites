import OrderDetailClient from "@/components/admin/OrderDetailClient";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

async function getOrder(id: string) {
  const headersList = await headers();
  const cookie = headersList.get('cookie') || '';
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders/${id}`, {
    headers: { cookie },
    cache: 'no-store'
  });
  
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  
  if (!order) {
    notFound();
  }
  
  return <OrderDetailClient order={order} />;
}
