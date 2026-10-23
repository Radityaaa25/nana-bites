import { GroqAnalysisError, analyzePaymentProof } from "@/lib/groq";
import {
  PAYMENT_BUCKET,
  PAYMENT_MAX_UPLOAD_MB,
  PAYMENT_MAX_UPLOADS,
  QRIS_MERCHANT,
  QRIS_NMID,
  getPaymentDeadline,
} from "@/lib/payment";
import {
  createAdminSupabase,
  removePaymentProof,
} from "@/lib/supabase-admin";
import { createHash } from "crypto";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function detectImageMime(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createAdminSupabase();
    const { data: order, error } = await supabase
      .from("orders")
      .select("payment_proof_path")
      .eq("id", id)
      .single();

    if (error || !order?.payment_proof_path) {
      return Response.json(
        { error: "Bukti pembayaran tidak ditemukan" },
        { status: 404 },
      );
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from(PAYMENT_BUCKET)
      .download(order.payment_proof_path);

    if (downloadError || !file) {
      console.error("payment proof download error:", downloadError);
      return Response.json(
        { error: "Gagal mengambil bukti pembayaran" },
        { status: 500 },
      );
    }

    return new Response(file, {
      headers: {
        "Content-Type": file.type || "image/jpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("GET payment-proof uncaught error:", error);
    return Response.json(
      { error: "Gagal mengambil bukti pembayaran" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Bukti pembayaran wajib diupload" },
        { status: 400 },
      );
    }

    const maxBytes = PAYMENT_MAX_UPLOAD_MB * 1024 * 1024;
    if (file.size <= 0) {
      return Response.json({ error: "File kosong" }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return Response.json(
        { error: `Ukuran file maksimal ${PAYMENT_MAX_UPLOAD_MB} MB` },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = detectImageMime(buffer);
    if (!mimeType) {
      return Response.json(
        { error: "Format file harus JPG, PNG, atau WebP" },
        { status: 415 },
      );
    }

    const supabase = createAdminSupabase();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return Response.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 },
      );
    }

    if (String(order.payment_method || "").toLowerCase() !== "qris") {
      return Response.json(
        { error: "Pesanan ini bukan pembayaran QRIS" },
        { status: 400 },
      );
    }

    if (order.payment_status === "paid") {
      return Response.json(
        { error: "Pembayaran pesanan ini sudah lunas" },
        { status: 409 },
      );
    }

    const uploadCount = Number(order.payment_upload_count || 0);
    if (uploadCount >= PAYMENT_MAX_UPLOADS) {
      return Response.json(
        {
          error: `Batas upload bukti tercapai (${PAYMENT_MAX_UPLOADS}x). Hubungi admin via WhatsApp ya.`,
        },
        { status: 429 },
      );
    }

    const deadline = getPaymentDeadline(String(order.created_at));
    if (uploadCount === 0 && Date.now() > deadline.getTime()) {
      return Response.json(
        {
          error:
            "Batas waktu pembayaran 24 jam sudah lewat. Silakan hubungi admin via WhatsApp ya.",
        },
        { status: 410 },
      );
    }

    const proofHash = createHash("sha256").update(buffer).digest("hex");
    const { data: duplicateProof, error: duplicateError } = await supabase
      .from("orders")
      .select("id")
      .eq("payment_proof_hash", proofHash)
      .neq("id", id)
      .in("payment_status", ["review", "paid"])
      .limit(1)
      .maybeSingle();

    const canStoreProofHash = duplicateError?.code !== "42703";
    if (duplicateError && canStoreProofHash) {
      console.error("payment proof duplicate check error:", duplicateError);
    }

    if (duplicateProof) {
      return Response.json(
        {
          error:
            "Bukti ini sudah pernah dipakai untuk pesanan lain. Upload bukti pembayaran yang berbeda ya.",
        },
        { status: 409 },
      );
    }

    const extension = EXTENSIONS[mimeType];
    const storagePath = `${id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(PAYMENT_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("payment proof upload error:", uploadError);
      const message = uploadError.message.includes("Bucket not found")
        ? "Bucket payment-proofs belum dibuat. Jalankan supabase/payment-setup.sql dulu."
        : "Gagal upload bukti pembayaran";
      return Response.json({ error: message }, { status: 500 });
    }

    let analysis = null;
    let aiError: string | null = null;

    try {
      analysis = await analyzePaymentProof({
        imageBase64: buffer.toString("base64"),
        mimeType,
        expected: {
          amount: Number(order.total_price),
          merchant: QRIS_MERCHANT,
          merchantNmid: QRIS_NMID,
          customerName: String(order.customer_name || ""),
          orderedAt: String(order.created_at),
        },
      });
    } catch (error) {
      aiError =
        error instanceof GroqAnalysisError
          ? error.message
          : "Pemeriksaan otomatis sedang tidak tersedia. Admin akan cek manual.";
      console.error("payment proof analysis error:", error);
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      payment_status: "review",
      payment_proof_path: storagePath,
      payment_ai_result: analysis,
      payment_uploaded_at: now,
      payment_upload_count: uploadCount + 1,
      payment_review_note: null,
    };

    if (canStoreProofHash) {
      updatePayload.payment_proof_hash = proofHash;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("payment proof update error:", updateError);
      await removePaymentProof(storagePath);
      return Response.json(
        { error: "Gagal menyimpan hasil verifikasi pembayaran" },
        { status: 500 },
      );
    }

    if (order.payment_proof_path) {
      await removePaymentProof(order.payment_proof_path);
    }

    return Response.json({
      success: true,
      paymentStatus: "review",
      analysis,
      proofUrl: `/api/orders/${id}/payment-proof`,
      aiError,
      uploadedAt: now,
    });
  } catch (error) {
    console.error("POST payment-proof uncaught error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat memproses bukti pembayaran" },
      { status: 500 },
    );
  }
}
