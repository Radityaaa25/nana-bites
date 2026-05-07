import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('menu')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('GET /api/menu error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data menu' }, { status: 500 });
  }

  // Map snake_case to camelCase for frontend compatibility
  const mapped = (data ?? []).map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    image: item.image ?? '',
    isBestSeller: item.is_best_seller,
    isAvailable: item.is_available,
    isComingSoon: item.is_coming_soon ?? false,
    createdAt: item.created_at,
  }));

  return NextResponse.json(mapped);
}

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  if (!cookieHeader.includes('admin_session=')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();

    if (!data.name || !data.description || data.price == null) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('menu')
      .insert({
        name: String(data.name).trim(),
        description: String(data.description).trim(),
        price: Number(data.price),
        image: data.image ? String(data.image).trim() : '',
        is_best_seller: Boolean(data.isBestSeller),
        is_available: Boolean(data.isAvailable),
        is_coming_soon: Boolean(data.isComingSoon),
      })
      .select()
      .single();

    if (error) {
      console.error('POST /api/menu error:', error);
      return NextResponse.json({ error: 'Gagal menambah menu' }, { status: 500 });
    }

    return NextResponse.json({
      id: inserted.id,
      name: inserted.name,
      description: inserted.description,
      price: inserted.price,
      image: inserted.image ?? '',
      isBestSeller: inserted.is_best_seller,
      isAvailable: inserted.is_available,
      isComingSoon: inserted.is_coming_soon ?? false,
      createdAt: inserted.created_at,
    }, { status: 201 });

  } catch {
    return NextResponse.json({ error: 'Request tidak valid' }, { status: 400 });
  }
}
