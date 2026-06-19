import { NextRequest, NextResponse } from "next/server";

// This route is called by Vercel Cron every hour
// Vercel Cron config is in vercel.json
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET ?? "";

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
