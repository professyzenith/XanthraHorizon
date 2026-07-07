import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/latest-briefing
 *
 * Public endpoint — returns the most recently generated AI briefing
 * so the homepage can display real, live content instead of static demo data.
 *
 * Response: { date, executive_brief, stories: RankedStory[], created_at }
 * Cached for 5 minutes on the CDN edge.
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("briefings")
      .select("date, executive_brief, stories, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(data, {
      headers: {
        // Cache for 5 min at the edge; serve stale up to 10 min while revalidating
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[latest-briefing] error:", err);
    return NextResponse.json(null, { status: 500 });
  }
}
