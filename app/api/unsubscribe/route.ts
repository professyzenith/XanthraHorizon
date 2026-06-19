import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing subscriber ID." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe." }, { status: 500 });
  }

  // Redirect to unsubscribe confirmation page
  return NextResponse.redirect(new URL("/unsubscribe?status=success", req.url));
}

export async function POST(req: NextRequest) {
  return GET(req);
}
