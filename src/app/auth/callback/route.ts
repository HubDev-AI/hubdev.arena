import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getSafeRedirectUrl(request: NextRequest, path: string): string {
  const { origin } = new URL(request.url);
  const isLocal = process.env.NODE_ENV === "development";

  if (isLocal) {
    return `${origin}${path}`;
  }

  // Validate x-forwarded-host against known site URL to prevent open redirects
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const allowedHost = siteUrl ? new URL(siteUrl).hostname : null;
    if (allowedHost && forwardedHost === allowedHost) {
      return `https://${forwardedHost}${path}`;
    }
  }

  return `${origin}${path}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(request, safeNext));
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(getSafeRedirectUrl(request, safeNext));
    }
  }

  return NextResponse.redirect(getSafeRedirectUrl(request, "/login?error=auth_failed"));
}
