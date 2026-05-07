import OrdersTableClient from "@/components/admin/OrdersTableClient";
import { headers } from "next/headers";

import { supabaseAdmin } from "@/lib/supabase";

async function getOrders() {
  try {
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersErr || !orders) throw ordersErr || new Error('No orders found');

    const { data: allItems } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .in('order_id', orders.map(o => o.id));

    return orders.map(order => ({
      id: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      totalPrice: order.total_price,
      paymentMethod: order.payment_method,
      deliveryMethod: order.delivery_method,
      notes: order.notes ?? '',
      status: order.status,
      createdAt: order.created_at,
      items: (allItems || [])
        .filter(i => i.order_id === order.id)
        .map(i => ({
          menuId: i.menu_id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
    }));
  } catch (error) {
    console.error('getOrders error:', error);
    return [];
  }
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();
  
  return <OrdersTableClient initialOrders={orders} />;
}
