import { createAdminSupabase, verifyAdminSession } from "@/lib/supabase-admin";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await verifyAdminSession())) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      action?: "approve" | "reject";
      note?: string;
    };

    if (body.action !== "approve" && body.action !== "reject") {
      return Response.json(
        { error: "Aksi harus approve atau reject" },
        { status: 400 },
      );
    }

    const supabase = createAdminSupabase();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return Response.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 },
      );
    }

    const note = body.note ? String(body.note).trim() : null;
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = {
      payment_status: body.action === "approve" ? "paid" : "rejected",
      payment_approved_at: body.action === "approve" ? now : null,
      payment_review_note: note,
    };

    if (body.action === "approve" && order.status === "pending") {
      updates.status = "processing";
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      console.error("update payment status error:", updateError);
      return Response.json(
        { error: "Gagal mengubah status pembayaran" },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      paymentStatus: updates.payment_status,
    });
  } catch (error) {
    console.error("PATCH payment status uncaught error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat mengubah status pembayaran" },
      { status: 500 },
    );
  }
}
