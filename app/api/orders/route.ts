import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function mapOrder(order: any, items: any[]) {
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
    items: items.map((item: any) => ({
      menuId: item.menu_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  };
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  if (!cookieHeader.includes('admin_session=')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: orders, error: ordersErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (ordersErr) {
    console.error('GET /api/orders error:', ordersErr);
    return NextResponse.json({ error: 'Gagal mengambil pesanan' }, { status: 500 });
  }

  // Fetch all items for all orders in one query
  const orderIds = (orders ?? []).map((o: any) => o.id);
  const { data: allItems } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .in('order_id', orderIds.length > 0 ? orderIds : ['__none__']);

  const mapped = (orders ?? []).map((order: any) => {
    const items = (allItems ?? []).filter((i: any) => i.order_id === order.id);
    return mapOrder(order, items);
  });

  return NextResponse.json(mapped);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, customerPhone, items, totalPrice, paymentMethod, deliveryMethod, notes } = body;

    // Validation
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const phoneRegex = /^(08|628)\d{8,12}$/;
    if (!phoneRegex.test(String(customerPhone).trim())) {
      return Response.json({ error: 'Format nomor HP tidak valid' }, { status: 400 });
    }

    const orderId = `NB-${Date.now()}`;

    const { error: orderErr } = await supabaseAdmin.from('orders').insert({
      id: orderId,
      customer_name: String(customerName).trim(),
      customer_phone: String(customerPhone).trim(),
      total_price: Number(totalPrice),
      payment_method: paymentMethod ?? 'cash',
      delivery_method: deliveryMethod ?? 'pickup',
      notes: notes ? String(notes).trim() : '',
      status: 'pending',
    });

    if (orderErr) {
      console.error('POST /api/orders order insert error:', orderErr);
      return Response.json({ error: 'Gagal membuat pesanan' }, { status: 500 });
    }

    const itemRows = items.map((item: any) => ({
      order_id: orderId,
      menu_id: item.menuId ?? null,
      name: String(item.name).trim(),
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(itemRows);

    if (itemsErr) {
      console.error('POST /api/orders items insert error:', itemsErr);
      // Order is already saved; we still return orderId
    }

    return Response.json({ orderId }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/orders uncaught error:', error);
    return Response.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
