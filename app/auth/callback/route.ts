import { type NextRequest, NextResponse } from "next/server";

import { getSafeAdminRedirect } from "@/app/_lib/auth/redirects";
import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = getSafeAdminRedirect(
    request.nextUrl.searchParams.get("next"),
  );

  if (code) {
    try {
      const supabase = await createAuthenticatedServerSupabaseClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return noStoreRedirect(new URL(next, request.url));
      }
    } catch {
      // Return the same bounded invalid-link state for configuration, network,
      // malformed-code, and expired-code failures.
    }
  }

  return noStoreRedirect(
    new URL("/admin/login?status=invalid-link", request.url),
  );
}
