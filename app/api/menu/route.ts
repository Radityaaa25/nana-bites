import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function requireAdmin(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Extract admin_session cookie value
  const cookies = cookieHeader
    .split(";")
    .reduce((acc: Record<string, string>, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) acc[key] = value;
      return acc;
    }, {});

  const session = cookies["admin_session"];
  return Boolean(session && adminPassword && session === adminPassword);
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("menu")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET /api/menu error:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data menu" },
        { status: 500 },
      );
    }

    // Map snake_case to camelCase for frontend compatibility
    const mapped = (data ?? []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image ?? "",
      isBestSeller: item.is_best_seller,
      isAvailable: item.is_available,
      isComingSoon: item.is_coming_soon ?? false,
      createdAt: item.created_at,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/menu uncaught error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // Validation
    const name = data.name ? String(data.name).trim() : "";
    const description = data.description ? String(data.description).trim() : "";
    const price = data.price != null ? Number(data.price) : null;

    if (!name || !description || price === null || isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Data tidak lengkap atau tidak valid" },
        { status: 400 },
      );
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("menu")
      .insert({
        name,
        description,
        price,
        image: data.image ? String(data.image).trim() : "",
        is_best_seller: Boolean(data.isBestSeller),
        is_available: Boolean(data.isAvailable),
        is_coming_soon: Boolean(data.isComingSoon),
      })
      .select()
      .single();

    if (error) {
      console.error("POST /api/menu error:", error);
      return NextResponse.json(
        { error: "Gagal menambah menu" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        id: inserted.id,
        name: inserted.name,
        description: inserted.description,
        price: inserted.price,
        image: inserted.image ?? "",
        isBestSeller: inserted.is_best_seller,
        isAvailable: inserted.is_available,
        isComingSoon: inserted.is_coming_soon ?? false,
        createdAt: inserted.created_at,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/menu uncaught error:", error);
    return NextResponse.json({ error: "Request tidak valid" }, { status: 400 });
  }
}
