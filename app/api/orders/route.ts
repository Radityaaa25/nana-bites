import { NextResponse } from "next/server";
import { hasSupabaseAdminConfig, supabaseAdmin } from "@/lib/supabase";

function normalizeItems(items: any[] = []) {
  return items.map((item: any) => ({
    menuId: item.menuId ?? item.menu_id ?? null,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));
}

function mapOrder(order: any, items: any[] = []) {
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
    items: normalizeItems(resolvedItems),
  };
}

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

export async function GET(request: Request) {
  // Only admin can fetch all orders
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersErr) {
      console.error("GET /api/orders error:", ordersErr);
      return NextResponse.json(
        { error: "Gagal mengambil pesanan" },
        { status: 500 },
      );
    }

    // Fetch all items for all orders in one query
    const orderIds = (orders ?? []).map((o: any) => o.id);
    const { data: allItems } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .in("order_id", orderIds.length > 0 ? orderIds : ["__none__"]);

    const mapped = (orders ?? []).map((order: any) => {
      const items = (allItems ?? []).filter(
        (i: any) => i.order_id === order.id,
      );
      return mapOrder(order, items);
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/orders uncaught error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseAdminConfig) {
      return Response.json(
        {
          error:
            "Konfigurasi Supabase belum lengkap. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY terisi.",
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const customerName = body.customer_name ?? body.customerName;
    const customerPhone = body.customer_phone ?? body.customerPhone;
    const items = body.items;
    const totalPrice = body.total_price ?? body.totalPrice;
    const paymentMethod = body.payment_method ?? body.paymentMethod;
    const deliveryMethod = body.delivery_method ?? body.deliveryMethod;
    const notes = body.notes;

    // Validation
    if (
      !customerName ||
      !customerPhone ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return Response.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const nameStr = String(customerName).trim();
    if (!nameStr) {
      return Response.json(
        { error: "Nama tidak boleh kosong" },
        { status: 400 },
      );
    }

    const phoneRegex = /^(08|628)\d{8,12}$/;
    if (!phoneRegex.test(String(customerPhone).trim())) {
      return Response.json(
        { error: "Format nomor HP tidak valid" },
        { status: 400 },
      );
    }

    const totalPriceNum = Number(totalPrice);
    if (isNaN(totalPriceNum) || totalPriceNum < 0) {
      return Response.json(
        { error: "Total harga tidak valid" },
        { status: 400 },
      );
    }

    const orderId = `NB-${Date.now()}`;
    const orderData = {
      id: orderId,
      customer_name: nameStr,
      customer_phone: String(customerPhone).trim(),
      notes: notes ? String(notes).trim() : "",
      items: normalizeItems(items),
      total_price: totalPriceNum,
      payment_method: paymentMethod ?? "cash",
      delivery_method: deliveryMethod ?? "pickup",
      status: "pending",
      created_at: new Date().toISOString(),
    };

    console.log("Saving order:", orderData);

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    console.log("Supabase response:", data, error);

    if (error) {
      console.error("POST /api/orders insert error:", error);
      return Response.json(
        {
          error:
            error.message || "Gagal menyimpan pesanan ke database Supabase",
        },
        { status: 500 },
      );
    }

    return Response.json(
      {
        success: true,
        id: orderId,
        order: data ? mapOrder(data) : null,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/orders uncaught error:", error);
    return Response.json(
      { error: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
