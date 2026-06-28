import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/unsubscribe-by-email
 *
 * Manual unsubscribe for users who arrive at /unsubscribe without a signed link.
 * Takes an email address and marks the subscriber inactive.
 *
 * Security notes:
 *  - Returns a generic success message even if the email isn't found
 *    (prevents email enumeration — attacker can't know who is subscribed).
 *  - Email is validated and normalised before lookup.
 *  - Rate limited to 3 attempts per IP per 10 minutes.
 */

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const ipAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generic response — same for found or not-found to prevent email enumeration
const GENERIC_SUCCESS = {
  success: true,
  message: "If that address was subscribed, it has been removed.",
};

export async function POST(req: NextRequest) {
  // Rate limit
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let email: string;
  try {
    const body = await req.json();
    email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || email.length > 254 || !emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabaseAdmin
      .from("subscribers")
      .update({ is_active: false })
      .eq("email", email)
      .eq("is_active", true); // Only update if currently active (silent no-op otherwise)

    if (error) {
      console.error("Unsubscribe-by-email error:", error);
      return NextResponse.json(
        { error: "Failed to unsubscribe. Please try again." },
        { status: 500 }
      );
    }

    // Always return the same response regardless of whether the email existed
    return NextResponse.json(GENERIC_SUCCESS);
  } catch (err) {
    console.error("Unsubscribe-by-email unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
