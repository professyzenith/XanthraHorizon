import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SubscribePayload } from "@/types";
import { sendWelcomeEmail } from "@/lib/emailSender";

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIBE API
//
// The entry point for every new subscriber. Intentionally opinionated:
//
//   • Google OAuth only — no passwords. We are not in the business of
//     storing credentials. Google handles authentication; we handle delivery.
//
//   • Upsert semantics — subscribing twice updates preferences rather than
//     throwing an error. This is the right UX: "I changed my mind, give me
//     a different time" should just work, not fail with a duplicate key error.
//
//   • Welcome email fires synchronously — we await it before returning 200.
//     If we fire-and-forget, the Vercel function terminates before Resend
//     processes the request and the user never gets their welcome email.
//     A slightly slower response is a better trade-off than a silent failure.
//
//   • In-memory rate limiting — 5 requests per IP per 10 minutes. Serverless
//     instances don't share memory, so this isn't perfect at scale. But it
//     stops the most common abuse patterns (accidental loops, form re-submits)
//     without adding a Redis dependency for a problem this small.
// ─────────────────────────────────────────────────────────────────────────────


// ── In-memory rate limiter ─────────────────────────────────────────────────
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
    const { email, delivery_time, timezone, topics } = body;

    // Validate presence
    if (!email || !delivery_time || !timezone) {
      return NextResponse.json(
        { error: "Email, delivery time, and timezone are required." },
        { status: 400 }
      );
    }

    // Validate topics
    const VALID_TOPICS = ["ai_tech", "geopolitics", "politics", "business", "science", "sports", "health"];
    const cleanTopics = Array.isArray(topics) && topics.length > 0
      ? topics.filter((t: string) => VALID_TOPICS.includes(t))
      : ["ai_tech"]; // default to AI if none selected

    // Validate lengths
    if (email.length > 254 || timezone.length > 64 || delivery_time.length > 5) {
      return NextResponse.json({ error: "Invalid input length." }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Validate delivery_time HH:MM
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(delivery_time)) {
      return NextResponse.json(
        { error: "Delivery time must be in HH:MM format (e.g. 09:00)." },
        { status: 400 }
      );
    }

    // Validate IANA timezone
    if (!isValidTimezone(timezone)) {
      return NextResponse.json(
        { error: "Invalid timezone. Please use a valid IANA timezone." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this is a new subscriber (before upsert)
    const { data: existing } = await supabaseAdmin
      .from("subscribers")
      .select("id, is_active")
      .eq("email", normalizedEmail)
      .maybeSingle();

    const isNewSubscriber = !existing || !existing.is_active;

    // Upsert subscriber record
    const { error: upsertError } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        { email: normalizedEmail, delivery_time, timezone, topics: cleanTopics, is_active: true },
        { onConflict: "email" }
      );

    if (upsertError) {
      console.error("Supabase upsert error:", JSON.stringify(upsertError, null, 2));
      console.error("Supabase URL configured:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.error("Supabase service key configured:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      return NextResponse.json(
        { error: "Failed to save subscription. Please try again." },
        { status: 500 }
      );
    }

    // Fetch subscriber UUID for welcome email token
    const { data: subscriber } = await supabaseAdmin
      .from("subscribers")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    // Await welcome email so the Vercel function doesn't terminate before Resend processes it
    if (subscriber?.id && isNewSubscriber) {
      const emailResult = await sendWelcomeEmail(normalizedEmail, subscriber.id, delivery_time, timezone)
        .catch((err) => {
          console.error("[subscribe] Welcome email error:", err);
          return { success: false, error: String(err) };
        });
      console.log("[subscribe] Welcome email result:", JSON.stringify(emailResult));
    }

    return NextResponse.json({
      success: true,
      message: "You're in! Check your inbox for a welcome email. Your first Xanthra Horizon edition arrives at your chosen time.",
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
