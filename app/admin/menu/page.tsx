import MenuTableClient from "@/components/admin/MenuTableClient";
import { headers } from "next/headers";

async function getMenu() {
  const headersList = await headers();
  const cookie = headersList.get('cookie') || '';
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/menu`, {
    headers: { cookie },
    cache: 'no-store'
  });
  
  if (!res.ok) return [];
  return res.json();
}

export default async function AdminMenuPage() {
  const menu = await getMenu();
  
  return <MenuTableClient initialMenu={menu} />;
}
