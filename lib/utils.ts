import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateWaLink(phone: string, text: string) {
  // pastikan nomor mulai dengan 62
  let formattedPhone = phone;
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('62')) {
    formattedPhone = '62' + formattedPhone;
  }
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
