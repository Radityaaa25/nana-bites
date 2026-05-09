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
    const data = await request.json()

    const updatePayload: Record<string, unknown> = {}
    if (data.name !== undefined) updatePayload.name = String(data.name).trim()
    if (data.description !== undefined) updatePayload.description = String(data.description).trim()
    if (data.price !== undefined) {
      const price = Number(data.price)
      if (isNaN(price) || price < 0) {
        return Response.json({ error: 'Harga tidak valid' }, { status: 400 })
      }
      updatePayload.price = price
    }
    if (data.image !== undefined) updatePayload.image = String(data.image).trim()
    if (data.isBestSeller !== undefined) updatePayload.is_best_seller = Boolean(data.isBestSeller)
    if (data.isAvailable !== undefined) updatePayload.is_available = Boolean(data.isAvailable)
    if (data.isComingSoon !== undefined) updatePayload.is_coming_soon = Boolean(data.isComingSoon)

    if (Object.keys(updatePayload).length === 0) {
      return Response.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 })
    }

    const supabase = createAdminSupabase()
    const { data: updated, error } = await supabase
      .from('menu')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('PUT /api/menu/[id] error:', error)
      return Response.json({ error: 'Gagal mengupdate menu' }, { status: 500 })
    }

    return Response.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      price: updated.price,
      image: updated.image ?? '',
      isBestSeller: updated.is_best_seller,
      isAvailable: updated.is_available,
      isComingSoon: updated.is_coming_soon ?? false,
      createdAt: updated.created_at,
    })
  } catch (error) {
    console.error('PUT /api/menu/[id] uncaught error:', error)
    return Response.json({ error: 'Request tidak valid' }, { status: 400 })
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
    const { error } = await supabase.from('menu').delete().eq('id', id)

    if (error) {
      console.error('DELETE /api/menu/[id] error:', error)
      return Response.json({ error: 'Gagal menghapus menu' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/menu/[id] uncaught error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
