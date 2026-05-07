import LandingClient from "@/components/customer/LandingClient";

import { supabase } from "@/lib/supabase";

async function getMenu() {
  try {
    const { data } = await supabase
      .from('menu')
      .select('*')
      .order('created_at', { ascending: false });
      
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      isBestSeller: item.is_best_seller,
      isAvailable: item.is_available,
      isComingSoon: item.is_coming_soon,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('getMenu error:', error);
    return [];
  }
}

export default async function Home() {
  const menuItems = await getMenu();
  return (
    <main className="min-h-screen relative">
      <LandingClient menuItems={menuItems} />
    </main>
  );
}
