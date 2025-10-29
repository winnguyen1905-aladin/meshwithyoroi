import { type NextRequest, NextResponse } from "next/server"

/**
 * Middleware for route protection and redirects
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  const publicRoutes = ["/login", "/api"]
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for wallet session (you can enhance this with actual session management)
  const walletSession = request.cookies.get("wallet_session")

  // Redirect to login if no session
  if (!walletSession && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
