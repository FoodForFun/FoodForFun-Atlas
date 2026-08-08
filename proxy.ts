import { type NextRequest } from "next/server";

import { updateAuthSession } from "@/app/_lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateAuthSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
};
