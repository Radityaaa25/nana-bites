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

function mapOrder(order: any, items: any[]) {
  const resolvedItems = Array.isArray(order.items) ? order.items : items;
  return {
    id: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    totalPrice: order.total_price,
    paymentMethod: order.payment_method,
    deliveryMethod: order.delivery_method,
    notes: order.notes ?? "",
    status: order.status,
    createdAt: order.created_at,
    items: resolvedItems.map((item: any) => ({
      menuId: item.menuId ?? item.menu_id ?? null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderErr || !order) {
      return Response.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 },
      );
    }

    let items: any[] = [];
    if (!Array.isArray(order.items)) {
      const { data: legacyItems } = await supabaseAdmin
        .from("order_items")
        .select("*")
        .eq("order_id", id);
      items = legacyItems ?? [];
    }

    return Response.json(mapOrder(order, items ?? []));
  } catch (error: any) {
    console.error("GET /api/orders/[id] error:", error);
    return Response.json(
      { error: error?.message || "Server error" },
      { status: 500 },
    );
  }
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
    if (data.status !== undefined) {
      const validStatuses = ["pending", "processing", "completed"];
      if (!validStatuses.includes(data.status)) {
        return NextResponse.json(
          { error: "Status tidak valid" },
          { status: 400 },
        );
      }
      updatePayload.status = data.status;
    }
    if (data.notes !== undefined)
      updatePayload.notes = String(data.notes).trim();

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data untuk diupdate" },
        { status: 400 },
      );
    }

    const { data: updated, error } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("PUT /api/orders/[id] error:", error);
      return NextResponse.json(
        { error: "Gagal mengupdate pesanan" },
        { status: 500 },
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/orders/[id] uncaught error:", error);
    return NextResponse.json({ error: "Request tidak valid" }, { status: 400 });
  }
}

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

    // order_items cascade deletes automatically; delete order directly
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", id);

    if (error) {
      console.error("DELETE /api/orders/[id] error:", error);
      return NextResponse.json(
        { error: "Gagal menghapus pesanan" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/orders/[id] uncaught error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
