import { NextRequest, NextResponse } from "next/server";

// This route is called by Vercel Cron every hour.
// Vercel Cron config is in vercel.json.
//
// In production, Vercel invokes this via its internal scheduler and passes
// the CRON_SECRET in the Authorization header automatically (when configured
// in the Vercel dashboard). The check below also lets you trigger the cron
// manually with: curl -H "Authorization: Bearer <CRON_SECRET>" /api/cron
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  // Always require the secret — never allow unauthenticated access
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const response = await fetch(`${appUrl}/api/send-briefing`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json({ triggered: true, result: data });
  } catch (err) {
    console.error("Cron trigger failed:", err);
    return NextResponse.json({ error: "Cron trigger failed" }, { status: 500 });
  }
}
