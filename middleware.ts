import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "./lib/stack";

// Define protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/settings",
  "/profile",
  "/admin",
  "/api/lineage",
  "/api/tables",
  "/api/columns",
  "/api/relationships",
  "/api/transformations",
];

// Define admin-only routes
const adminRoutes = [
  "/admin",
  "/api/admin",
];

// Define public routes that should be accessible without authentication
const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/handler",
  "/auth",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Stack Auth handler routes
  if (pathname.startsWith("/handler/")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  try {
    // Get the user from Stack Auth
    const user = await stackServerApp.getUser();

    if (!user) {
      // User is not authenticated, redirect to sign in
      const signInUrl = new URL("/handler/signin", request.url);
      signInUrl.searchParams.set("after_auth_return_to", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (!user.hasPermission("admin")) {
        // User doesn't have admin permissions
        return new NextResponse("Access Denied", { status: 403 });
      }
    }

    // User is authenticated and has required permissions
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware authentication error:", error);
    
    // On error, redirect to sign in
    const signInUrl = new URL("/handler/signin", request.url);
    signInUrl.searchParams.set("after_auth_return_to", pathname);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};

