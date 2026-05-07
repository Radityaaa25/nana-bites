import LandingClient from "@/components/customer/LandingClient";

async function getMenu() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/menu`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
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
