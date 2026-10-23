import { parseDateValue } from "@/lib/utils";

export type PaymentStatus = "unpaid" | "review" | "paid" | "rejected";

export type PaymentAiExtraction = {
  is_payment_proof: boolean;
  detected_amount: number | null;
  detected_currency: string | null;
  detected_recipient: string | null;
  detected_sender: string | null;
  detected_datetime: string | null;
  detected_nmid: string | null;
  payment_app: string | null;
  confidence: number;
  reasons: string[];
};

export type PaymentAiResult = {
  model: string;
  analyzed_at: string;
  extraction: PaymentAiExtraction;
  checks: {
    nominal: { expected: number; detected: number | null; match: boolean };
    recipient: {
      expected: string | null;
      detected: string | null;
      match: boolean | null;
    };
    time: {
      expected: string;
      detected: string | null;
      match: boolean | null;
      tolerance_minutes: number;
    };
    confidence: number;
  };
  verdict: "valid" | "suspicious" | "invalid";
  reasons: string[];
  raw_text?: string;
};

export const PAYMENT_BUCKET = "payment-proofs";

export const QRIS_IMAGE =
  process.env.NEXT_PUBLIC_QRIS_IMAGE || "/QRIS.jpeg";

export const QRIS_MERCHANT =
  process.env.NEXT_PUBLIC_QRIS_MERCHANT || "Break bite, Makanan";

export const QRIS_NMID =
  process.env.NEXT_PUBLIC_QRIS_NMID || "ID1026623305251";

export const PAYMENT_TIME_TOLERANCE_MINUTES = Number(
  process.env.PAYMENT_TIME_TOLERANCE_MINUTES || 60,
);

export const PAYMENT_DEADLINE_HOURS = Number(
  process.env.NEXT_PUBLIC_PAYMENT_DEADLINE_HOURS || 24,
);

export function getPaymentDeadline(createdAt: string | Date) {
  const base =
    typeof createdAt === "string" ? parseDateValue(createdAt) : createdAt;
  return new Date(base.getTime() + PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000);
}

export const PAYMENT_MAX_UPLOAD_MB = Number(
  process.env.PAYMENT_MAX_UPLOAD_MB || 5,
);

export const PAYMENT_MAX_UPLOADS = Number(
  process.env.PAYMENT_MAX_UPLOADS || 3,
);
