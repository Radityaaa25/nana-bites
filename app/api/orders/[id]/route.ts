import { createAdminSupabase, verifyAdminSession } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await verifyAdminSession()) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const validStatuses = ['pending', 'processing', 'completed']
    if (!validStatuses.includes(body.status)) {
      return Response.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from('orders')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json(data)
  } catch (error) {
    console.error('PUT order error:', error)
    return Response.json({ error: 'Gagal update pesanan' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await verifyAdminSession()) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminSupabase()
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (error) {
    console.error('DELETE order error:', error)
    return Response.json({ error: 'Gagal hapus pesanan' }, { status: 500 })
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminSupabase()

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (orderErr || !order) {
      return Response.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    const items = Array.isArray(order.items)
      ? order.items
      : []

    return Response.json({
      id: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      totalPrice: order.total_price,
      paymentMethod: order.payment_method,
      deliveryMethod: order.delivery_method,
      notes: order.notes ?? '',
      status: order.status,
      createdAt: order.created_at,
      items: items.map((i: { menuId?: string | null; menu_id?: string | null; name: string; price: number; quantity: number }) => ({
        menuId: i.menuId ?? i.menu_id ?? null,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    })
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error)
    return Response.json(
      { error: (error as Error | undefined)?.message || 'Server error' },
      { status: 500 },
    )
  }
}
