import MyOrdersClient from "@/components/customer/MyOrdersClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pesanan Saya | Nana Bites",
  description: "Riwayat pesanan Nana Bites yang tersimpan di browser kamu.",
};

export default function PesananPage() {
  return <MyOrdersClient />;
}
