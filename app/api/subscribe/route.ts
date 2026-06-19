import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SubscribePayload } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: SubscribePayload = await req.json();
    const { email, delivery_time, timezone } = body;

    // Validate inputs
    if (!email || !delivery_time || !timezone) {
      return NextResponse.json(
        { error: "Email, delivery time, and timezone are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Upsert: update preferences if email already exists
    const { data, error } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          delivery_time,
          timezone,
          is_active: true,
        },
        { onConflict: "email" }
      )
      .select()
      .single();

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
      id: data.id,
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
