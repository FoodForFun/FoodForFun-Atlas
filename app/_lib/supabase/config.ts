export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Required Supabase configuration is missing.");
    this.name = "SupabaseConfigurationError";
  }
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new SupabaseConfigurationError();
  }

  return { publishableKey, url };
}
