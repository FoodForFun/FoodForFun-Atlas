import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  getSupabasePublicConfig,
  SupabaseConfigurationError,
} from "@/app/_lib/supabase/config";

export { SupabaseConfigurationError };

export function createServerSupabaseClient() {
  const { publishableKey, url } = getSupabasePublicConfig();

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
