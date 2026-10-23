"use client";

import { formatRupiah, generateWaLink } from "@/lib/utils";
import {
  QRIS_IMAGE,
  QRIS_MERCHANT,
  QRIS_NMID,
  getPaymentDeadline,
  type PaymentAiResult,
  type PaymentStatus,
} from "@/lib/payment";
import {
  useCustomerOrderStore,
  type LocalOrder,
} from "@/lib/customerOrderStore";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  ImagePlus,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type Props = {
  order: {
    id: string;
    totalPrice: number;
    customerName: string;
    createdAt: string;
    orderStatus: "pending" | "processing" | "completed";
    items: Array<{ name: string; quantity: number }>;
  };
  initialPaymentStatus: PaymentStatus;
  initialProofUrl: string | null;
  initialAnalysis: PaymentAiResult | null;
  initialReviewNote: string | null;
  initialUploadCount: number;
  waNumber: string;
  maxUploads: number;
};

const MAX_FILE_MB = 5;

function verdictStyle(verdict: PaymentAiResult["verdict"]) {
  if (verdict === "valid") {
    return {
      icon: CheckCircle2,
      title: "Bukti sudah diterima",
      subtitle: "Data pembayaran sesuai. Menunggu konfirmasi admin.",
      className: "border-green-200 bg-green-50 text-green-800",
      iconClass: "text-green-600",
    };
  }
  if (verdict === "suspicious") {
    return {
      icon: Clock,
      title: "Bukti sedang diproses",
      subtitle: "Admin akan mengecek bukti pembayaran kamu.",
      className: "border-amber-200 bg-amber-50 text-amber-800",
      iconClass: "text-amber-600",
    };
  }
  return {
    icon: XCircle,
    title: "Bukti belum sesuai",
    subtitle: "Silakan cek kembali atau upload ulang bukti pembayaran.",
    className: "border-red-200 bg-red-50 text-red-800",
    iconClass: "text-red-600",
  };
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function QrisPaymentPanel({
  order,
  initialPaymentStatus,
  initialProofUrl,
  initialAnalysis,
  initialReviewNote,
  initialUploadCount,
  waNumber,
  maxUploads,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>(initialPaymentStatus);
  const [proofUrl, setProofUrl] = useState<string | null>(initialProofUrl);
  const [analysis, setAnalysis] = useState<PaymentAiResult | null>(
    initialAnalysis,
  );
  const [aiError, setAiError] = useState<string | null>(null);
  const [uploadCount, setUploadCount] = useState(initialUploadCount);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const proofFileRef = useRef<File | null>(null);
  const proofPath = `/api/orders/${order.id}/payment-proof`;
  const upsertOrder = useCustomerOrderStore((state) => state.upsertOrder);

  useEffect(() => {
    const deadline = getPaymentDeadline(order.createdAt).getTime();
    const tick = () => setRemainingMs(deadline - Date.now());
    const initialTick = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);

    return () => {
      clearTimeout(initialTick);
      clearInterval(interval);
    };
  }, [order.createdAt]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!proofUrl) {
      proofFileRef.current = null;
      return;
    }

    let cancelled = false;

    fetch(proofPath, { cache: "no-store" })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (cancelled || !blob) return;
        const extension = blob.type.includes("png")
          ? "png"
          : blob.type.includes("webp")
            ? "webp"
            : "jpg";
        proofFileRef.current = new File(
          [blob],
          `bukti-${order.id}.${extension}`,
          { type: blob.type || "image/jpeg" },
        );
      })
      .catch(() => {
        proofFileRef.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [proofUrl, proofPath, order.id, uploadCount]);

  const updateLocalOrder = (status: PaymentStatus) => {
    const snapshot: LocalOrder = {
      id: order.id,
      createdAt: order.createdAt,
      totalPrice: order.totalPrice,
      paymentMethod: "qris",
      paymentStatus: status,
      orderStatus: order.orderStatus,
      items: order.items,
    };
    upsertOrder(snapshot);
  };

  const handleFile = (selected: File | null) => {
    if (!selected) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      toast.error("Format bukti harus JPG, PNG, atau WebP");
      return;
    }

    if (selected.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Ukuran file maksimal ${MAX_FILE_MB} MB`);
      return;
    }

    const objectUrl = URL.createObjectURL(selected);
    const image = new window.Image();

    image.onload = () => {
      if (image.width < 300 || image.height < 300) {
        URL.revokeObjectURL(objectUrl);
        toast.error(
          "Gambar terlalu kecil. Upload screenshot bukti pembayaran yang lebih jelas ya.",
        );
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(selected);
      setPreviewUrl(objectUrl);
      setAiError(null);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error("Gambar tidak bisa dibaca. Coba file lain ya.");
    };

    image.src = objectUrl;
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Pilih gambar bukti pembayaran dulu ya");
      return;
    }

    setIsUploading(true);
    setAiError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/orders/${order.id}/payment-proof`, {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        analysis?: PaymentAiResult | null;
        proofUrl?: string | null;
        aiError?: string | null;
        paymentStatus?: PaymentStatus;
      };

      if (!response.ok) {
        throw new Error(data.error || "Gagal upload bukti pembayaran");
      }

      setAnalysis(data.analysis ?? null);
      setProofUrl(data.proofUrl ?? null);
      setPaymentStatus(data.paymentStatus ?? "review");
      setAiError(data.aiError ?? null);
      setUploadCount((count) => count + 1);
      updateLocalOrder(data.paymentStatus ?? "review");

      if (data.analysis?.verdict === "valid") {
        toast.success("Bukti diterima! Sedang menunggu konfirmasi admin.");
      } else if (data.aiError) {
        toast.warning("Bukti tersimpan. Admin akan mengecek secara manual.");
      } else {
        toast.warning("Bukti tersimpan dan sedang diproses admin.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal upload bukti pembayaran",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const supportText = `Halo Nana Bites, saya mau tanya pesanan #${order.id}.`;
  const supportLink = waNumber ? generateWaLink(waNumber, supportText) : null;
  const isPaid = paymentStatus === "paid";
  const isExpired = remainingMs !== null && remainingMs <= 0;
  const canUploadMore = uploadCount < maxUploads;
  const uploadWindowClosed = isExpired && uploadCount === 0;
  const canChooseFile = canUploadMore && !uploadWindowClosed && !isUploading;

  const buildWhatsAppText = () => {
    const lines = [
      "Halo Nana Bites! 🍫",
      paymentStatus === "rejected"
        ? "Saya sudah upload ulang bukti pembayaran QRIS."
        : "Saya sudah melakukan pembayaran QRIS.",
      `📋 Pesanan #${order.id}`,
      `💰 Total: ${formatRupiah(order.totalPrice)}`,
      `👤 Nama: ${order.customerName}`,
    ];

    if (analysis) {
      const { detected, expected, match } = analysis.checks.nominal;

      if (!analysis.extraction.is_payment_proof) {
        lines.push(
          "⚠️ Bukti yang saya upload sepertinya bukan screenshot pembayaran yang berhasil.",
        );
      } else if (detected === null) {
        lines.push("⚠️ Nominal pada bukti belum terbaca dengan jelas.");
      } else if (!match && detected < expected) {
        lines.push(
          `⚠️ Nominal di bukti kurang ${formatRupiah(expected - detected)} (terbaca ${formatRupiah(detected)}).`,
        );
      } else if (!match && detected > expected) {
        lines.push(
          `⚠️ Nominal di bukti lebih ${formatRupiah(detected - expected)} (terbaca ${formatRupiah(detected)}).`,
        );
      } else if (match) {
        lines.push("✅ Nominal pembayaran sesuai.");
      }

      if (analysis.checks.recipient.match === false) {
        lines.push(
          "⚠️ Tujuan pembayaran di bukti belum cocok dengan merchant.",
        );
      }

      if (!analysis.checks.time.detected) {
        lines.push("⚠️ Waktu transaksi tidak terlihat di bukti.");
      }

      if (analysis.verdict === "valid") {
        lines.push("✅ Data pembayaran sudah sesuai.");
      } else if (analysis.verdict === "suspicious") {
        lines.push(
          "🕓 Mohon dicek manual ya, ada data yang perlu dipastikan.",
        );
      } else {
        lines.push("❗ Mohon dibantu cek bukti pembayaran saya ya.");
      }
    } else {
      lines.push("📎 Bukti sudah saya upload, mohon dicek manual.");
    }

    if (aiError) {
      lines.push(
        "ℹ️ Pemeriksaan otomatis tidak tersedia, mohon dicek manual.",
      );
    }

    if (initialReviewNote) {
      lines.push(`📝 Catatan admin sebelumnya: ${initialReviewNote}`);
    }

    if (isExpired) {
      lines.push(
        "⏰ Waktu pembayaran 24 jam sudah lewat, mohon arahan admin.",
      );
    }

    lines.push(
      "📎 Bukti pembayaran saya lampirkan di chat ini.",
      "",
      "Mohon dicek dan dikonfirmasi ya kak! 🙏",
    );

    return lines.join("\n");
  };

  const openWhatsAppWithLink = () => {
    if (!waNumber) return false;
    const link = `${window.location.origin}${proofPath}`;
    window.location.href = generateWaLink(
      waNumber,
      `${buildWhatsAppText()}\n\n🔗 ${link}`,
    );
    return true;
  };

  const handleShareProof = async () => {
    if (!proofUrl) return;

    setIsSharing(true);
    try {
      // Langsung buka WhatsApp dengan link bukti
      if (!openWhatsAppWithLink()) {
        toast.error("Nomor WhatsApp admin belum dikonfigurasi");
        return;
      }
      updateLocalOrder(paymentStatus);
      toast.success("Membuka WhatsApp...");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal membuka WhatsApp",
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadQris = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(QRIS_IMAGE);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QRIS-${QRIS_MERCHANT}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("QRIS berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal mengunduh QRIS");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mt-6 space-y-5">
      {!isPaid && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${
            isExpired
              ? "border-red-200 bg-red-50 text-red-700"
              : remainingMs !== null && remainingMs <= 60 * 60 * 1000
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-pink-100 bg-pink-50/70 text-pink-700"
          }`}>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Sisa waktu pembayaran
              </p>
              <p className="text-lg font-bold tabular-nums">
                {remainingMs === null
                  ? "--:--:--"
                  : isExpired
                    ? "Waktu habis"
                    : formatCountdown(remainingMs)}
              </p>
            </div>
          </div>
          <p className="max-w-[120px] text-right text-[10px] leading-tight opacity-70">
            Selesaikan pembayaran dan upload bukti dalam 24 jam.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-pink-100 bg-pink-50/60 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-pink-400">
          Total yang harus dibayar
        </p>
        <p className="mt-1 text-2xl font-bold text-pink-700">
          {formatRupiah(order.totalPrice)}
        </p>
        <p className="mt-1 text-xs text-pink-500">
          Bayar sesuai nominal, jangan dibulatkan ya.
        </p>
      </div>

      <div className="rounded-2xl border border-pink-100 bg-white p-4">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-xl border border-pink-100 bg-white">
          <Image
            src={QRIS_IMAGE}
            alt={`QRIS ${QRIS_MERCHANT}`}
            fill
            sizes="280px"
            className="object-contain"
          />
        </div>
        <div className="mt-3 text-center">
          <p className="text-sm font-bold text-pink-900">{QRIS_MERCHANT}</p>
          <p className="text-[11px] text-pink-400">NMID: {QRIS_NMID}</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadQris}
          disabled={isDownloading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border-2 border-pink-200 bg-white py-2.5 text-sm font-bold text-pink-600 transition-all hover:border-pink-300 hover:bg-pink-50 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengunduh...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Unduh QRIS
            </>
          )}
        </button>
        <div className="mt-4 rounded-xl bg-pink-50 p-3 text-xs leading-relaxed text-pink-700">
          <p className="font-bold mb-1">Cara bayar:</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>Buka aplikasi DANA / bank / e-wallet kamu.</li>
            <li>Scan QRIS di atas atau dari galeri.</li>
            <li>Masukkan nominal persis seperti total pesanan.</li>
            <li>Screenshot bukti pembayaran yang berhasil.</li>
            <li>Upload buktinya di bawah ini.</li>
          </ol>
        </div>
      </div>

      {isPaid ? (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="font-bold">Pembayaran sudah dikonfirmasi admin</p>
            <p className="text-sm">
              Pesanan #{order.id} sudah lunas. Terima kasih ya kak!
            </p>
          </div>
        </div>
      ) : (
        <>
          {initialReviewNote && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-bold">Catatan admin: </span>
                {initialReviewNote}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-pink-100 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-pink-900">
                Upload Bukti Pembayaran
              </h3>
              <span className="text-[11px] font-medium text-pink-400">
                {Math.min(uploadCount, maxUploads)}/{maxUploads}x
              </span>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            />

            {uploadWindowClosed && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700">
                <p className="font-bold">Waktu pembayaran sudah habis.</p>
                <p className="mt-1">
                  Kamu masih bisa menyelesaikan pesanan dengan menghubungi
                  admin.
                </p>
                {supportLink && (
                  <a
                    href={supportLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-bold underline"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Hubungi admin via WhatsApp
                  </a>
                )}
              </div>
            )}

            {isExpired && uploadCount > 0 && (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Waktu pembayaran sudah lewat, tapi kamu masih bisa upload ulang
                bukti perbaikan.
              </div>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={!canChooseFile}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/40 p-5 text-pink-500 transition-colors hover:border-pink-300 hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {previewUrl ? (
                <span className="relative block h-40 w-full overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview bukti pembayaran"
                    className="h-full w-full object-contain"
                  />
                </span>
              ) : (
                <>
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm font-bold">
                    Pilih gambar bukti
                  </span>
                  <span className="text-[11px]">
                    JPG / PNG / WebP, maks {MAX_FILE_MB} MB
                  </span>
                </>
              )}
            </button>

            {!canUploadMore && (
              <p className="mt-2 text-xs text-red-500">
                Batas upload tercapai. Hubungi admin via WhatsApp kalau bukti
                masih bermasalah.
              </p>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading || !canChooseFile}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 py-3 text-sm font-bold text-white transition-all hover:bg-pink-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memeriksa bukti...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Bukti Pembayaran
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Bukti berhasil disimpan. Pemeriksaan otomatis sedang tidak
                tersedia, tapi admin akan mengecek bukti kamu secara manual.
              </p>
            </div>
          )}

          {analysis && <AnalysisCard analysis={analysis} />}

          {proofUrl ? (
            <>
              <div className="rounded-2xl border border-pink-100 bg-white p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-pink-400">
                  Bukti terakhir
                </p>
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-pink-600 underline"
                >
                  Lihat gambar bukti pembayaran
                </a>
                <p className="mt-1 text-[11px] text-pink-400">
                  Bukti tersimpan dan bisa dicek admin.
                </p>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50/60 p-4">
                <p className="text-xs leading-relaxed text-green-800">
                  Kirim konfirmasi ke WhatsApp admin sekarang. Link bukti
                  pembayaran akan disertakan dalam pesan, sehingga admin bisa
                  langsung membuka dan mengecek bukti kamu.
                </p>
                {waNumber ? (
                  <button
                    type="button"
                    onClick={handleShareProof}
                    disabled={isSharing}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-green-500 py-3 text-sm font-bold text-white transition-all hover:bg-green-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSharing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyiapkan bukti...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Kirim Bukti ke WhatsApp
                      </>
                    )}
                  </button>
                ) : (
                  <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-600">
                    Nomor WhatsApp admin belum dikonfigurasi.
                  </p>
                )}
                <p className="mt-2 text-[11px] text-green-700/80">
                  Status lunas tetap menunggu pengecekan admin.
                </p>
              </div>
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-pink-200 bg-pink-50/40 p-3 text-center text-xs text-pink-500">
              Tombol konfirmasi WhatsApp muncul setelah bukti pembayaran
              berhasil diupload.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: PaymentAiResult }) {
  const style = verdictStyle(analysis.verdict);
  const Icon = style.icon;
  const { detected, expected } = analysis.checks.nominal;
  const difference = detected === null ? null : detected - expected;
  const guidance: string[] = [];

  if (!analysis.extraction.is_payment_proof) {
    guidance.push(
      "Pastikan yang diupload adalah screenshot bukti pembayaran yang berhasil, bukan gambar QRIS.",
    );
  }

  if (detected === null) {
    guidance.push(
      "Nominal belum terbaca. Upload ulang dengan gambar yang lebih jelas dan tidak terpotong.",
    );
  } else if (difference !== null && difference < 0) {
    guidance.push(
      `Nominal kurang ${formatRupiah(Math.abs(difference))}. Silakan bayar kekurangannya lalu upload bukti baru, atau hubungi admin.`,
    );
  } else if (difference !== null && difference > 0) {
    guidance.push(
      `Nominal lebih ${formatRupiah(difference)}. Admin akan membantu penyesuaian atau pengembalian.`,
    );
  }

  if (analysis.checks.recipient.match === false) {
    guidance.push(
      "Tujuan pembayaran belum cocok dengan merchant. Cek lagi sebelum konfirmasi.",
    );
  }

  if (!analysis.checks.time.detected) {
    guidance.push(
      "Waktu transaksi tidak terlihat. Pastikan bagian atas bukti ikut terfoto.",
    );
  }

  const reasons = analysis.reasons.filter(
    (reason) => !/\bAI\b/i.test(reason) && !/keyakinan/i.test(reason),
  );

  return (
    <div className={`rounded-2xl border p-4 ${style.className}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{style.title}</p>
          <p className="text-xs opacity-80">{style.subtitle}</p>

          <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-lg bg-white/60 p-2">
              <p className="opacity-60">Nominal terbaca</p>
              <p className="font-bold">
                {detected === null ? "Tidak terbaca" : formatRupiah(detected)}
              </p>
            </div>
            <div className="rounded-lg bg-white/60 p-2">
              <p className="opacity-60">Tujuan pembayaran</p>
              <p className="truncate font-bold">
                {analysis.checks.recipient.detected || "Tidak terbaca"}
              </p>
            </div>
            <div className="rounded-lg bg-white/60 p-2">
              <p className="opacity-60">Waktu transaksi</p>
              <p className="font-bold">
                {analysis.checks.time.detected || "Tidak terbaca"}
              </p>
            </div>
            <div className="rounded-lg bg-white/60 p-2">
              <p className="opacity-60">Aplikasi</p>
              <p className="font-bold">
                {analysis.extraction.payment_app || "Tidak terbaca"}
              </p>
            </div>
          </div>

          {guidance.length > 0 && (
            <ul className="mt-3 list-inside list-disc space-y-1 text-xs">
              {guidance.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          {reasons.length > 0 && (
            <ul className="mt-3 list-inside list-disc space-y-1 text-xs opacity-80">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-[11px] opacity-70">
            Pemeriksaan ini hanya pengecekan awal. Admin tetap mengecek bukti
            sebelum status lunas.
          </p>
        </div>
      </div>
    </div>
  );
}
