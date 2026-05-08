import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function requireAdmin(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader.includes('admin_session=');
}

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [{ data: order, error: orderErr }, { data: items, error: itemsErr }] =
      await Promise.all([
        supabaseAdmin.from('orders').select('*').eq('id', id).single(),
        supabaseAdmin.from('order_items').select('*').eq('order_id', id),
      ]);

    if (orderErr || !order) {
      return Response.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    return Response.json(mapOrder(order, items ?? []));
  } catch (error: any) {
    console.error('GET /api/orders/[id] error:', error);
    return Response.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    const updatePayload: Record<string, unknown> = {};
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.notes !== undefined) updatePayload.notes = data.notes;

    const { data: updated, error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('PUT /api/orders/[id] error:', error);
      return NextResponse.json({ error: 'Gagal mengupdate pesanan' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Request tidak valid' }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // order_items cascade deletes automatically; delete order directly
  const { error } = await supabaseAdmin.from('orders').delete().eq('id', id);

  if (error) {
    console.error('DELETE /api/orders/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pesanan' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
