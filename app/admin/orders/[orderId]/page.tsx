import OrderDetailClient from "@/components/admin/OrderDetailClient";
import { notFound } from "next/navigation";
import { createAdminSupabase } from "@/lib/supabase-admin";

async function getOrder(id: string) {
  try {
    const supabase = createAdminSupabase();
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderErr || !order) throw orderErr || new Error("Order not found");

    let items = [];
    if (Array.isArray(order.items) && order.items.length > 0) {
      items = order.items;
    } else {
      const { data: legacyItems } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);
      items = legacyItems ?? [];
    }

    return {
      id: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      totalPrice: order.total_price,
      paymentMethod: order.payment_method,
      deliveryMethod: order.delivery_method,
      notes: order.notes ?? "",
      status: order.status,
      createdAt: order.created_at,
      items: items.map((i: { menuId?: string | null; menu_id?: string | null; name: string; price: number; quantity: number }) => ({
        menuId: i.menuId ?? i.menu_id ?? null,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    };
  } catch (error) {
    console.error("getOrder error:", error);
    return null;
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order} />;
}
