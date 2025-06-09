import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Routes admin
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Routes patron
    if (pathname.startsWith("/patron")) {
      if (!["ADMIN", "PATRON"].includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Routes gestionnaire
    if (pathname.startsWith("/gestionnaire")) {
      if (
        !["ADMIN", "PATRON", "GESTIONNAIRE"].includes(token?.role as string)
      ) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Routes caissier
    if (pathname.startsWith("/caissier")) {
      if (
        !["ADMIN", "PATRON", "GESTIONNAIRE", "CAISSIER"].includes(
          token?.role as string
        )
      ) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Routes client
    if (pathname.startsWith("/client")) {
      if (token?.role !== "CLIENT") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Protection des routes API
    if (pathname.startsWith("/api/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (pathname.startsWith("/api/company")) {
      if (
        !["ADMIN", "PATRON", "GESTIONNAIRE", "CAISSIER"].includes(
          token?.role as string
        )
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (pathname.startsWith("/api/client")) {
      if (token?.role !== "CLIENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Routes publiques
        if (
          pathname === "/" ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/search") ||
          pathname.startsWith("/booking") ||
          pathname.startsWith("/subscription") ||
          pathname === "/admin/register" ||
          pathname === "/api/admin/register" ||
          pathname === "/api/subscription/initialize" ||
          pathname === "/api/subscription/webhook"
        ) {
          return true;
        }

        // Les routes protégées nécessitent une authentification
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/patron/:path*",
    "/gestionnaire/:path*",
    "/caissier/:path*",
    "/client/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/api/admin/:path*",
    "/api/company/:path*",
    "/api/client/:path*",
    "/api/user/:path*",
  ],
};
