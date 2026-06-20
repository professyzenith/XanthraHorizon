import { NextResponse } from "next/server";

/**
 * GET /api/status
 *
 * Returns which environment variables are configured (not their values).
 * Safe to expose — only reports true/false per key.
 * Use this to verify your setup before running the full pipeline.
 */
export async function GET() {
  const checks = {
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL:    isSet("NEXT_PUBLIC_SUPABASE_URL"),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: isSet("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      SUPABASE_SERVICE_ROLE_KEY:   isSet("SUPABASE_SERVICE_ROLE_KEY"),
    },
    resend: {
      RESEND_API_KEY:   isSet("RESEND_API_KEY"),
      RESEND_FROM_EMAIL: isSet("RESEND_FROM_EMAIL"),
    },
    gemini: {
      GEMINI_API_KEY: isSet("GEMINI_API_KEY"),
    },
    app: {
      CRON_SECRET:          isSet("CRON_SECRET"),
      NEXT_PUBLIC_APP_URL:  isSet("NEXT_PUBLIC_APP_URL"),
    },
  };

  // Required for core functionality
  const requiredReady =
    Object.values(checks.supabase).every(Boolean) &&
    Object.values(checks.gemini).every(Boolean)   &&
    Object.values(checks.app).every(Boolean);

  // Resend is optional — missing keys become warnings, not failures
  const warnings = Object.entries(checks.resend)
    .filter(([, v]) => !v)
    .map(([k]) => `${k} not set — email delivery will be disabled`);

  const missing = Object.entries({
    ...checks.supabase,
    ...checks.gemini,
    ...checks.app,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return NextResponse.json({
    ready: requiredReady,
    missing,
    warnings,
    checks,
    instructions: requiredReady
      ? "Core keys configured. Run /api/test-pipeline to verify the pipeline."
      : `Add the missing keys to .env.local, then restart the dev server.`,
  });
}

function isSet(key: string): boolean {
  const v = process.env[key];
  if (!v || v.length < 8) return false;
  // Detect common placeholder patterns (case-insensitive)
  const lower = v.toLowerCase();
  const placeholders = [
    "your-", "your_", "replace", "example",
    "_here", "key_here", "secret_here",
    "your-project-id", "yourdomain",
    "re_your", "re_YOUR",
  ];
  return !placeholders.some((p) => lower.includes(p.toLowerCase()));
}
