import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Standard Next.js middleware to protect admin routes
export function proxy(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith('/admin')) {
      // Always allow the login page
      if (pathname === '/admin/login') {
        return NextResponse.next();
      }

      const session = request.cookies.get('admin_session')?.value;

      if (!session) {
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware Error:', error);
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
