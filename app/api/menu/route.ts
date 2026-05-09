import { createAdminSupabase, verifyAdminSession } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export async function GET() {
  try {
    const supabase = createAdminSupabase()
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('GET /api/menu error:', error)
      return Response.json({ error: 'Gagal mengambil data menu' }, { status: 500 })
    }

    const mapped = (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image ?? '',
      isBestSeller: item.is_best_seller,
      isAvailable: item.is_available,
      isComingSoon: item.is_coming_soon ?? false,
      createdAt: item.created_at,
    }))

    return Response.json(mapped)
  } catch (error) {
    console.error('GET /api/menu uncaught error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await verifyAdminSession()) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const name = data.name ? String(data.name).trim() : ''
    const description = data.description ? String(data.description).trim() : ''
    const price = data.price != null ? Number(data.price) : null

    if (!name || !description || price === null || isNaN(price) || price < 0) {
      return Response.json({ error: 'Data tidak lengkap atau tidak valid' }, { status: 400 })
    }

    const supabase = createAdminSupabase()
    const { data: inserted, error } = await supabase
      .from('menu')
      .insert({
        name,
        description,
        price,
        image: data.image ? String(data.image).trim() : '',
        is_best_seller: Boolean(data.isBestSeller),
        is_available: Boolean(data.isAvailable),
        is_coming_soon: Boolean(data.isComingSoon),
      })
      .select()
      .single()

    if (error) {
      console.error('POST /api/menu error:', error)
      return Response.json({ error: 'Gagal menambah menu' }, { status: 500 })
    }

    return Response.json(
      {
        id: inserted.id,
        name: inserted.name,
        description: inserted.description,
        price: inserted.price,
        image: inserted.image ?? '',
        isBestSeller: inserted.is_best_seller,
        isAvailable: inserted.is_available,
        isComingSoon: inserted.is_coming_soon ?? false,
        createdAt: inserted.created_at,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /api/menu uncaught error:', error)
    return Response.json({ error: 'Request tidak valid' }, { status: 400 })
  }
}
