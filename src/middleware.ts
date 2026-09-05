import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const asteriaToken = req.cookies.get("asteria_session_token")?.value;
  const allCookies = req.cookies.getAll();
  const hasSupabaseToken = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );

  const isAuthenticated = Boolean(asteriaToken || hasSupabaseToken);

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

    if (asteriaToken) {
      try {
        const parts = asteriaToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf-8")
          );
          if (payload.role === "BOARD") {
            isBoard = true;
          }
        }
      } catch {
        isBoard = false;
      }
    }

    if (!isBoard && hasSupabaseToken) {
      for (const c of allCookies) {
        if (c.name.startsWith("sb-") && c.name.includes("-auth-token")) {
          try {
            const raw = c.value.startsWith("base64-")
              ? Buffer.from(c.value.replace("base64-", ""), "base64").toString("utf-8")
              : c.value;
            const parsed = JSON.parse(raw);
            const accessToken = parsed.access_token || parsed[0];
            if (accessToken) {
              const payload = JSON.parse(
                Buffer.from(accessToken.split(".")[1], "base64").toString("utf-8")
              );
              if (
                payload.user_metadata?.role === "BOARD" ||
                payload.app_metadata?.role === "BOARD"
              ) {
                isBoard = true;
                break;
              }
            }
          } catch {}
        }
      }
    }

    if (!isBoard) {
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
