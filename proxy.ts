import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The function MUST be named "proxy" in Next.js 16+
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/admin')) {
    // Always allow the login page
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const session = request.cookies.get('admin_session');

    if (!session || !session.value) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
