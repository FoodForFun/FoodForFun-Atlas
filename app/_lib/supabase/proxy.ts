import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSafeAdminRedirect } from "@/app/_lib/auth/redirects";
import { getSupabasePublicConfig } from "@/app/_lib/supabase/config";

function applyPrivateCacheHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function isProtectedAdminPath(pathname: string) {
  const isAdminPath =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isPublicAuthPath =
    pathname === "/admin/login" || pathname === "/admin/forgot-password";

  return isAdminPath && !isPublicAuthPath;
}

export async function updateAuthSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let config;

  try {
    config = getSupabasePublicConfig();
  } catch {
    return applyPrivateCacheHeaders(response);
  }

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headersToSet).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && isProtectedAdminPath(request.nextUrl.pathname)) {
    const loginUrl = new URL("/admin/login", request.url);
    const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", getSafeAdminRedirect(requestedPath));
    const redirectResponse = NextResponse.redirect(loginUrl);

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return applyPrivateCacheHeaders(redirectResponse);
  }

  return applyPrivateCacheHeaders(response);
}
