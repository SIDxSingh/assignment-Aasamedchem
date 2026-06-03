import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isAdminRoute = nextUrl.pathname.startsWith('/admin');
  const isSellerRoute = nextUrl.pathname.startsWith('/seller');
  const isLoginRoute = nextUrl.pathname.startsWith('/login');
  const isRootRoute = nextUrl.pathname === '/';

  // 1. If not logged in and trying to access protected route, redirect to login
  if ((isAdminRoute || isSellerRoute || isRootRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // 2. If logged in and trying to access login page, redirect based on role
  if (isLoginRoute && isLoggedIn) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', nextUrl));
    } else {
      return NextResponse.redirect(new URL('/seller/products', nextUrl));
    }
  }

  // 3. If logged in and on root, redirect based on role
  if (isRootRoute && isLoggedIn) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', nextUrl));
    } else {
      return NextResponse.redirect(new URL('/seller/products', nextUrl));
    }
  }

  // 4. Role-based routing protection
  if (isAdminRoute && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/seller/products', nextUrl));
  }

  if (isSellerRoute && userRole !== 'SELLER') {
    return NextResponse.redirect(new URL('/admin/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
