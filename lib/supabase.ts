import { createClient } from "@supabase/supabase-js";

/**
 * Reads a required environment variable and throws a clear startup error
 * instead of passing `undefined` silently to the Supabase constructor.
 * The `!` assertion suppresses TypeScript but does NOT prevent a runtime
 * crash with an opaque "Invalid URL" message if the value is missing.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[supabase] Missing required environment variable: ${key}. ` +
      `Add it to .env.local and restart the dev server.`
    );
  }
  return value;
}

// Client for browser/frontend use (anon key — respects RLS)
export const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
);

// Admin client for server-side operations (service-role key — bypasses RLS)
// NEVER expose this client or its key to the browser.
export const supabaseAdmin = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY")
);
