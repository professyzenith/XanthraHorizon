import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT
//
// Two clients — one for each trust level. This is intentional.
//
// `supabase`      — uses the anon key. Safe to expose in the browser.
//                   Row Level Security (RLS) policies enforce what it can
//                   and cannot access. Think of it as a guest badge.
//
// `supabaseAdmin` — uses the service-role key. Never, ever reaches the
//                   browser. It bypasses RLS entirely and has full read/write
//                   access to every table. It lives server-side only.
//                   Think of it as the master key card.
//
// Using the admin client in a client component or a public API route would
// be a critical security vulnerability. Always double-check which client
// you're reaching for before making a database call.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads a required environment variable at startup.
 *
 * Using TypeScript's `!` non-null assertion would pass `undefined` silently
 * to the Supabase constructor, resulting in a cryptic "Invalid URL" error
 * deep inside a network call. We'd rather fail loud and early with a message
 * that tells the developer exactly what's missing and where to fix it.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Xanthra] Missing required environment variable: "${key}". ` +
      `Add it to your .env.local file and restart the dev server.\n` +
      `See the README for the full list of required variables.`
    );
  }
  return value;
}

// ── Public client — browser-safe, RLS-enforced ───────────────────────────────
export const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
);

// ── Admin client — server-only, full access, NEVER expose to browser ─────────
export const supabaseAdmin = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY")
);
