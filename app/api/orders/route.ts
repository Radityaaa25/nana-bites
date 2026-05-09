import { createAdminSupabase } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

function requireAdmin(request: NextRequest | Request): boolean {
  const cookieHeader = (request as Request).headers.get('cookie') || ''
  const adminPassword = process.env.ADMIN_PASSWORD

  const cookies = cookieHeader
    .split(';')
    .reduce((acc: Record<string, string>, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) acc[key] = value
      return acc
    }, {})

  const session = cookies['admin_session']
  return Boolean(session && adminPassword && session === adminPassword)
}

type OrderItemRow = {
  menuId?: string | null
  menu_id?: string | null
  order_id?: string
  name: string
  price: number
  quantity: number
}

function normalizeItems(items: OrderItemRow[] = []) {
  return items.map((item) => ({
    menuId: item.menuId ?? item.menu_id ?? null,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }))
}

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminSupabase()
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersErr) {
      console.error('GET /api/orders error:', ordersErr)
      return Response.json({ error: 'Gagal mengambil pesanan' }, { status: 500 })
    }

    const { data: allItems } = await supabase
      .from('order_items')
      .select('*')

    const mapped = (orders ?? []).map((rawOrder) => {
      const items = (allItems ?? []).filter(
        (i) => (i as OrderItemRow).order_id === rawOrder.id,
      ) as OrderItemRow[]
      return {
        id: rawOrder.id,
        customerName: rawOrder.customer_name,
        customerPhone: rawOrder.customer_phone,
        totalPrice: rawOrder.total_price,
        paymentMethod: rawOrder.payment_method,
        deliveryMethod: rawOrder.delivery_method,
        notes: rawOrder.notes ?? '',
        status: rawOrder.status,
        createdAt: rawOrder.created_at,
        items: normalizeItems(Array.isArray(rawOrder.items) ? rawOrder.items : items),
      }
    })

    return Response.json(mapped)
  } catch (error) {
    console.error('GET /api/orders uncaught error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return Response.json(
        {
          error:
            'Konfigurasi Supabase belum lengkap. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY terisi.',
        },
        { status: 500 },
      )
    }

    const body = (await request.json()) as {
      customer_name?: string
      customerName?: string
      customer_phone?: string
      customerPhone?: string
      items?: OrderItemRow[]
      total_price?: number
      totalPrice?: number
      payment_method?: string
      paymentMethod?: string
      delivery_method?: string
      deliveryMethod?: string
      notes?: string
    }

    const customerName = body.customer_name ?? body.customerName
    const customerPhone = body.customer_phone ?? body.customerPhone
    const items = body.items
    const totalPrice = body.total_price ?? body.totalPrice
    const paymentMethod = body.payment_method ?? body.paymentMethod
    const deliveryMethod = body.delivery_method ?? body.deliveryMethod
    const notes = body.notes

    if (
      !customerName ||
      !customerPhone ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return Response.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const nameStr = String(customerName).trim()
    if (!nameStr) {
      return Response.json({ error: 'Nama tidak boleh kosong' }, { status: 400 })
    }

    const phoneRegex = /^(08|628)\d{8,12}$/
    if (!phoneRegex.test(String(customerPhone).trim())) {
      return Response.json(
        { error: 'Format nomor HP tidak valid' },
        { status: 400 },
      )
    }

    const totalPriceNum = Number(totalPrice)
    if (isNaN(totalPriceNum) || totalPriceNum < 0) {
      return Response.json({ error: 'Total harga tidak valid' }, { status: 400 })
    }

    const orderId = `NB-${Date.now()}`
    const orderData = {
      id: orderId,
      customer_name: nameStr,
      customer_phone: String(customerPhone).trim(),
      notes: notes ? String(notes).trim() : '',
      items: normalizeItems(items),
      total_price: totalPriceNum,
      payment_method: paymentMethod ?? 'cash',
      delivery_method: deliveryMethod ?? 'pickup',
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (error) {
      console.error('POST /api/orders insert error:', error)
      return Response.json(
        { error: error.message || 'Gagal menyimpan pesanan ke database Supabase' },
        { status: 500 },
      )
    }

    return Response.json(
      { success: true, id: orderId, order: data ?? null },
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /api/orders uncaught error:', error)
    return Response.json(
      { error: (error as Error | undefined)?.message || 'Server error' },
      { status: 500 },
    )
  }
}
