import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/my-papers',
  '/my-conferences',
  '/submit-paper',
  '/papers',
  '/reviews',
  '/conference-manage',
  '/conference-program',
  '/conference-site',
  '/conferences/new',
  '/profile',
  '/admin',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/my-papers/:path*',
    '/my-conferences/:path*',
    '/submit-paper/:path*',
    '/papers/:path*',
    '/reviews/:path*',
    '/conference-manage/:path*',
    '/conference-program/:path*',
    '/conference-site/:path*',
    '/conferences/new/:path*',
    '/conferences/:id/edit',
    '/profile/:path*',
    '/admin/:path*',
  ],
};
