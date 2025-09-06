// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsAuth =
    path.startsWith("/dashboard") ||
    path.startsWith("/invoice/card") ||
    path.startsWith("/api/upload") ||
    path.startsWith("/api/invoice");

  if (!needsAuth) return NextResponse.next();

  // Heuristic: Stack sets auth cookies; just check presence at the edge
  const hasStackCookie = request.cookies.getAll()
    .some(c => c.name.toLowerCase().includes("stack"));

  if (!hasStackCookie) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/invoice/card/:path*",
    "/api/upload",
    "/api/invoice/:path*",
  ],
};
