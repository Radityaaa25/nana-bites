import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function requireAdmin(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") || "";
  const adminPassword = process.env.ADMIN_PASSWORD;

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();

    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = String(data.name).trim();
    if (data.description !== undefined)
      updatePayload.description = String(data.description).trim();
    if (data.price !== undefined) {
      const price = Number(data.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: "Harga tidak valid" },
          { status: 400 },
        );
      }
      updatePayload.price = price;
    }
    if (data.image !== undefined)
      updatePayload.image = String(data.image).trim();
    if (data.isBestSeller !== undefined)
      updatePayload.is_best_seller = Boolean(data.isBestSeller);
    if (data.isAvailable !== undefined)
      updatePayload.is_available = Boolean(data.isAvailable);
    if (data.isComingSoon !== undefined)
      updatePayload.is_coming_soon = Boolean(data.isComingSoon);

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data untuk diupdate" },
        { status: 400 },
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from("menu")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("PUT /api/menu/[id] error:", error);
      return NextResponse.json(
        { error: "Gagal mengupdate menu" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      price: updated.price,
      image: updated.image ?? "",
      isBestSeller: updated.is_best_seller,
      isAvailable: updated.is_available,
      isComingSoon: updated.is_coming_soon ?? false,
      createdAt: updated.created_at,
    });
  } catch (error) {
    console.error("PUT /api/menu/[id] uncaught error:", error);
    return NextResponse.json({ error: "Request tidak valid" }, { status: 400 });
  }
}

// PATCH reuses PUT logic (for partial updates like toggle)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return PUT(request, { params });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { error } = await supabaseAdmin.from("menu").delete().eq("id", id);

    if (error) {
      console.error("DELETE /api/menu/[id] error:", error);
      return NextResponse.json(
        { error: "Gagal menghapus menu" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/menu/[id] uncaught error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
