import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  // SECURITY FIX: Store the actual password as session value for verification
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: "admin_session",
    value: adminPassword,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 86400, // 1 day
    path: "/",
  });

  return response;
}
