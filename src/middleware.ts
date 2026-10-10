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

  // 2. Admin routes authentication is handled by gate 1 above.
  // Role authorization (BOARD / PRESIDENT / VICE_PRESIDENT) is verified authoritatively against Postgres in /api/admin and AdminPage.

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
