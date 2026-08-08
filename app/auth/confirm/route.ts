import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createAuthenticatedServerSupabaseClient } from "@/app/_lib/supabase/auth-server";

const supportedEmailTypes = ["invite", "recovery"] as const;

type SupportedEmailType = (typeof supportedEmailTypes)[number];

function isSupportedEmailType(value: string | null): value is SupportedEmailType {
  return supportedEmailTypes.some((type) => type === value);
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (tokenHash && isSupportedEmailType(type)) {
    try {
      const supabase = await createAuthenticatedServerSupabaseClient();
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      });

      if (!error) {
        const destination = new URL("/admin/update-password", request.url);
        destination.searchParams.set("flow", type);
        return noStoreRedirect(destination);
      }
    } catch {
      // Return the same bounded invalid-link state for configuration, network,
      // malformed-token, and expired-token failures.
    }
  }

  return noStoreRedirect(
    new URL("/admin/login?status=invalid-link", request.url),
  );
}
