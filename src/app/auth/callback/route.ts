import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/settings/connected-accounts";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle any OAuth provider error redirected to callback
  if (error || errorDescription) {
    const redirectUrl = new URL(next, requestUrl.origin);
    redirectUrl.searchParams.set("error", error || "oauth_error");
    if (errorDescription) {
      redirectUrl.searchParams.set("error_description", errorDescription);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Exchange auth code for session & linked identity
  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("OAuth code exchange error:", exchangeError);
        const redirectUrl = new URL(next, requestUrl.origin);
        redirectUrl.searchParams.set("error", "exchange_failed");
        redirectUrl.searchParams.set("error_description", exchangeError.message);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (err: any) {
      console.error("Callback exception:", err);
    }
  }

  // Redirect user to destination page (defaults to connected-accounts)
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
