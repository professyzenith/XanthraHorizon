import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SubscribePayload } from "@/types";

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
