import OrderDetailClient from "@/components/admin/OrderDetailClient";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase";

async function getOrder(id: string) {
  try {
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderErr || !order) throw orderErr || new Error('Order not found');

    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    return {
      id: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      totalPrice: order.total_price,
      paymentMethod: order.payment_method,
      deliveryMethod: order.delivery_method,
      notes: order.notes ?? '',
      status: order.status,
      createdAt: order.created_at,
      items: (items || []).map(i => ({
        menuId: i.menu_id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    };
  } catch (error) {
    console.error('getOrder error:', error);
    return null;
  }
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  
  if (!order) {
    notFound();
  }
  
  return <OrderDetailClient order={order} />;
}
