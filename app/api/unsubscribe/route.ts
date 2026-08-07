import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyUnsubscribeToken } from "@/lib/unsubscribeToken";

// ─────────────────────────────────────────────────────────────────────────────
// UNSUBSCRIBE API
//
// Deliberately POST-only. Here's why this matters:
//
// Email clients (Gmail, Outlook, Apple Mail) and corporate security gateways
// routinely "prefetch" every URL in an email to scan for malware and phishing.
// If unsubscribing was a GET request, a security bot would silently unsubscribe
// the user before they ever clicked the link. This is documented real-world
// behaviour, not a theoretical concern.
//
// By requiring POST, we ensure unsubscribing is always an explicit, deliberate
// user action — a click on the confirmation page, not a bot prefetch.
//
// Additionally, every unsubscribe link is protected by an HMAC-SHA256 token.
// Without the correct token, this endpoint returns HTTP 403. This means:
//   • You cannot unsubscribe someone else by guessing their UUID
//   • You cannot mass-unsubscribe users by enumerating IDs
//   • The token is unique per subscriber and non-reversible without the secret
//
// We soft-delete (set is_active = false) rather than hard-delete rows so that
// analytics, audit logs, and re-subscription flows retain context.
// ─────────────────────────────────────────────────────────────────────────────

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
