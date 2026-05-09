import { createAdminSupabase } from '@/lib/supabase-admin'
import OrdersTableClient from '@/components/admin/OrdersTableClient'

export const dynamic = 'force-dynamic'

async function getOrders() {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return []
    }

    return (data ?? []).map((o) => ({
      id: o.id,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      totalPrice: o.total_price,
      paymentMethod: o.payment_method,
      deliveryMethod: o.delivery_method,
      notes: o.notes ?? '',
      status: o.status,
      createdAt: o.created_at,
      items: Array.isArray(o.items) ? o.items : [],
    }))
  } catch (error) {
    console.error('getOrders error:', error)
    return []
  }
}

export default async function AdminOrdersPage() {
  const orders = await getOrders()
  return <OrdersTableClient initialOrders={orders} />
}
