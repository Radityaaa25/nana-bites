import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  
  if (password === process.env.ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'admin_session',
      value: 'logged_in',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 1 day
      path: '/',
    });
    return response;
  }
  
  return NextResponse.json({ error: 'Password salah' }, { status: 401 });
}
