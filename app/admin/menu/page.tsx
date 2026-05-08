import MenuTableClient from "@/components/admin/MenuTableClient";
import { headers } from "next/headers";

import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getMenu() {
  try {
    const { data, error } = await supabaseAdmin
      .from("menu")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      isBestSeller: item.is_best_seller,
      isAvailable: item.is_available,
      isComingSoon: item.is_coming_soon,
      createdAt: item.created_at,
    }));
  } catch (error) {
    console.error("getMenu error:", error);
    return [];
  }
}

export default async function AdminMenuPage() {
  const menu = await getMenu();

  return <MenuTableClient initialMenu={menu} />;
}
