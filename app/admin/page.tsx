import { createAdminSupabase } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
import { UtensilsCrossed, Package, PackageOpen, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatRupiah, formatDate } from '@/lib/utils'

export default async function AdminDashboard() {
  const supabase = createAdminSupabase()

  const [
    { count: totalMenu },
    { count: totalOrders },
    { count: pendingOrders },
    { data: recentOrders }
  ] = await Promise.all([
    supabase.from('menu').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const menuWithCount = await supabase
    .from('menu')
    .select('*')
    .eq('is_available', true)

  const activeMenu = menuWithCount.data?.length ?? 0

  const recentOrdersList = (recentOrders ?? []).map((o) => ({
    id: o.id,
    customerName: o.customer_name,
    totalPrice: o.total_price,
    status: o.status,
    createdAt: o.created_at,
  }))

  return (
    <div>
      <h1 className="font-playfair text-3xl font-bold text-pink-900 mb-8">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Menu Aktif</p>
            <p className="text-2xl font-bold text-pink-900">
              {activeMenu}{' '}
              <span className="text-sm font-normal text-gray-400">
                / {totalMenu ?? 0}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Pesanan</p>
            <p className="text-2xl font-bold text-pink-900">{totalOrders ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <PackageOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pesanan Hari Ini</p>
            <p className="text-2xl font-bold text-pink-900">—</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pesanan Pending</p>
            <p className="text-2xl font-bold text-pink-900">{pendingOrders ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="p-6 border-b border-pink-50 flex justify-between items-center">
          <h2 className="font-playfair text-xl font-bold text-pink-900">
            Pesanan Terbaru
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm font-medium text-pink-600 hover:text-pink-800">
            Lihat Semua →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-pink-50/50 text-pink-900/70 font-medium">
              <tr>
                <th className="p-4">No. Order</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Total</th>
                <th className="p-4">Waktu</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {recentOrdersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Belum ada pesanan nih kak!
                  </td>
                </tr>
              ) : (
                recentOrdersList.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-pink-50/30 transition-colors">
                    <td className="p-4 font-medium text-pink-900">
                      #{order.id}
                    </td>
                    <td className="p-4">{order.customerName}</td>
                    <td className="p-4 font-medium">
                      {formatRupiah(order.totalPrice)}
                    </td>
                    <td className="p-4 text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-4">
                      {order.status === 'pending' && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-bold">
                          Pending
                        </span>
                      )}
                      {order.status === 'processing' && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-bold">
                          Diproses
                        </span>
                      )}
                      {order.status === 'completed' && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-bold">
                          Selesai
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
