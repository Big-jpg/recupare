// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stack';

export async function middleware(request: NextRequest) {
  // Protect dashboard and invoice routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/invoice/card')) {
    try {
      const user = await stackServerApp.getUser();
      if (!user) {
        // Redirect to sign-in if not authenticated
        const signInUrl = new URL('/auth/signin', request.url);
        signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(signInUrl);
      }
    } catch (error) {
      // Redirect to sign-in on auth error
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/invoice/card/:path*',
    '/api/upload',
    '/api/invoice/:path*'
  ]
};

