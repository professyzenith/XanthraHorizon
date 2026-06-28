import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SubscribePayload } from "@/types";

// ── In-memory rate limiter ─────────────────────────────────────────────────
// Max 5 attempts per IP per 10-minute window. Resets automatically.
// For multi-region deployments consider replacing with Vercel KV or Redis.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
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
// ─────────────────────────────────────────────────────────────────────────────

// Validate IANA timezone using the built-in Intl API (zero-cost, no dependencies)
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
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

  try {
    const body: SubscribePayload = await req.json();
    const { email, delivery_time, timezone } = body;

    // Validate presence
    if (!email || !delivery_time || !timezone) {
      return NextResponse.json(
        { error: "Email, delivery time, and timezone are required." },
        { status: 400 }
      );
    }

    // Validate lengths (prevent oversized / injection payloads)
    if (email.length > 254 || timezone.length > 64 || delivery_time.length > 5) {
      return NextResponse.json(
        { error: "Invalid input length." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Validate delivery_time is HH:MM (00:00 – 23:59)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(delivery_time)) {
      return NextResponse.json(
        { error: "Delivery time must be in HH:MM format (e.g. 09:00)." },
        { status: 400 }
      );
    }

    // Validate timezone is a real IANA timezone string
    if (!isValidTimezone(timezone)) {
      return NextResponse.json(
        { error: "Invalid timezone. Please use a valid IANA timezone." },
        { status: 400 }
      );
    }

    // Upsert: update preferences if email already exists
    const { error } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          delivery_time,
          timezone,
          is_active: true,
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save subscription. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You're in! Your first Xanthra Horizon edition arrives at your chosen time.",
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
