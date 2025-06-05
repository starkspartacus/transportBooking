import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Admin routes
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Patron routes
    if (pathname.startsWith("/patron")) {
      if (!["ADMIN", "PATRON"].includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Gestionnaire routes
    if (pathname.startsWith("/gestionnaire")) {
      if (!["ADMIN", "PATRON", "GESTIONNAIRE"].includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // Caissier routes
    if (pathname.startsWith("/caissier")) {
      if (!["ADMIN", "PATRON", "GESTIONNAIRE", "CAISSIER"].includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    // API routes protection
    if (pathname.startsWith("/api/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    if (pathname.startsWith("/api/company")) {
      if (!["ADMIN", "PATRON", "GESTIONNAIRE", "CAISSIER"].includes(token?.role as string)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/search") ||
          pathname.startsWith("/booking")
        ) {
          return true
        }

        // Protected routes require authentication
        return !!token
      },
    },
  },
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/patron/:path*",
    "/gestionnaire/:path*",
    "/caissier/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/api/admin/:path*",
    "/api/company/:path*",
    "/api/user/:path*",
  ],
}
