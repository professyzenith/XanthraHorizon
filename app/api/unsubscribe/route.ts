import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyUnsubscribeToken } from "@/lib/unsubscribeToken";

/**
 * POST /api/unsubscribe
 *
 * Body: { id: string; token: string }
 *
 * Verifies the HMAC token before writing to the database.
 * The unsubscribe confirmation page (app/unsubscribe/UnsubscribeContent.tsx)
 * POSTs here and redirects to /unsubscribe?status=success on success.
 *
 * GET is intentionally removed — mutation via GET allows prefetchers and
 * email-scanner bots to silently unsubscribe users before they click.
 */
export async function POST(req: NextRequest) {
  let id: string | undefined;
  let token: string | undefined;

  try {
    const body = await req.json();
    id    = typeof body.id    === "string" ? body.id.trim()    : undefined;
    token = typeof body.token === "string" ? body.token.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!id || !token) {
    return NextResponse.json(
      { error: "Missing id or token." },
      { status: 400 }
    );
  }

  if (!verifyUnsubscribeToken(id, token)) {
    return NextResponse.json(
      { error: "Invalid or tampered unsubscribe token." },
      { status: 403 }
    );
  }

  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

/** Reject GET — unsubscribe must be an explicit user action via POST. */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use the unsubscribe link from your email." },
    { status: 405 }
  );
}
