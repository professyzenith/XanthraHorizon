import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SupportPayload } from "@/types";

// ── Rate limiter (3 tickets per IP per 15 min) ──────────────────────────────
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
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

const VALID_CATEGORIES = ["bug", "delivery", "feature", "account", "other"];

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before submitting another ticket." },
      { status: 429 }
    );
  }

  try {
    const body: SupportPayload = await req.json();
    const { email, category, subject, message } = body;

    // Validate required fields
    if (!email || !category || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Validate lengths
    if (email.length > 254 || subject.length > 200 || message.length > 2000 || category.length > 20) {
      return NextResponse.json(
        { error: "Input exceeds maximum length." },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category." },
        { status: 400 }
      );
    }

    // Insert ticket into Supabase
    const { error: insertError } = await supabaseAdmin
      .from("support_tickets")
      .insert({
        email: email.toLowerCase().trim(),
        category,
        subject: subject.trim(),
        message: message.trim(),
        status: "open",
      });

    if (insertError) {
      console.error("[support] Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit ticket. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your ticket has been submitted. We'll get back to you soon.",
    });
  } catch (err) {
    console.error("[support] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
