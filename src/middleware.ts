import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getCombinedSupabaseCookie(allCookies: { name: string; value: string }[]): string | null {
  // 1. Direct unchunked cookie
  const direct = allCookies.find(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );
  if (direct) return direct.value;

  // 2. Chunked cookies (.0, .1, .2, etc.)
  const chunked = allCookies
    .filter((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token."))
    .sort((a, b) => {
      const idxA = parseInt(a.name.split(".").pop() || "0", 10);
      const idxB = parseInt(b.name.split(".").pop() || "0", 10);
      return idxA - idxB;
    });

  if (chunked.length > 0) {
    return chunked.map((c) => c.value).join("");
  }

  return null;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const allCookies = req.cookies.getAll();
  const tokenValue = getCombinedSupabaseCookie(allCookies);
  const isAuthenticated = Boolean(tokenValue);

  // 1. Unauthenticated gate
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const returnUrl = encodeURIComponent(`${pathname}${search}`);
    const loginUrl = new URL(`/login?returnUrl=${returnUrl}`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Admin routes authorization gate (requires BOARD role)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    let isBoard = false;
    let decodedSuccessfully = false;

    if (tokenValue) {
      try {
        const raw = tokenValue.startsWith("base64-")
          ? Buffer.from(tokenValue.replace("base64-", ""), "base64").toString("utf-8")
          : tokenValue;
        const parsed = JSON.parse(raw);
        const accessToken = parsed.access_token || parsed[0];
        if (accessToken && typeof accessToken === "string") {
          const parts = accessToken.split(".");
          if (parts.length >= 2) {
            const payload = JSON.parse(
              Buffer.from(parts[1], "base64").toString("utf-8")
            );
            decodedSuccessfully = true;
            if (
              payload.user_metadata?.role === "BOARD" ||
              payload.app_metadata?.role === "BOARD"
            ) {
              isBoard = true;
            }
          }
        }
      } catch (err) {
        console.warn("Middleware JWT decode warning:", err);
      }
    }

    // Only reject if we successfully decoded the token and confirmed the role is NOT BOARD
    // Otherwise let the request reach the route handler where getCurrentUser() verifies against DB
    if (decodedSuccessfully && !isBoard) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: Board access required" },
          { status: 403 }
        );
      }
      const dashboardUrl = new URL("/dashboard?error=unauthorized", req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/departments/:path*",
    "/events/:path*",
    "/members/:path*",
    "/tasks/:path*",
    "/attendance/:path*",
    "/announcements/:path*",
    "/calendar/:path*",
    "/applications/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
