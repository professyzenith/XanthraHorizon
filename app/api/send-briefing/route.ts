import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchAllAINews } from "@/lib/newsFetcher";
import { deduplicateArticles } from "@/lib/deduplicator";
import { rankArticles } from "@/lib/ranker";
import { generateBriefing } from "@/lib/summarizer";
import { sendBriefingEmail } from "@/lib/emailSender";

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting daily briefing pipeline...");

    // Step 1: Fetch news from all sources
    const rawArticles = await fetchAllAINews();
    console.log(`Fetched ${rawArticles.length} raw articles`);

    if (rawArticles.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No articles fetched",
      });
    }

    // Step 2: Deduplicate
    const unique = deduplicateArticles(rawArticles);
    console.log(`After dedup: ${unique.length} unique articles`);

    // Step 3: Rank
    const ranked = rankArticles(unique);

    // Step 4: Generate AI briefing (summaries + why it matters)
    const briefing = await generateBriefing(ranked, 7);
    console.log("Briefing generated successfully");

    // Step 5: Find subscribers whose local delivery time matches now (within 5 min window)
    const now = new Date();

    // Get all active subscribers
    const { data: subscribers, error } = await supabaseAdmin
      .from("subscribers")
      .select("*")
      .eq("is_active", true);

    if (error || !subscribers) {
      console.error("Failed to fetch subscribers:", error);
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
    }

    // Filter subscribers whose local time matches now (within 5 minutes)
    const targetSubscribers = subscribers.filter((sub) => {
      try {
        const formatter = new Intl.DateTimeFormat("en", {
          timeZone: sub.timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        const parts = formatter.formatToParts(now);
        const localHour   = parseInt(parts.find((p) => p.type === "hour")?.value   ?? "0");
        const localMinute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0");

        const [subH, subM] = sub.delivery_time.split(":").map(Number);
        const diffMinutes  = Math.abs(subH * 60 + subM - (localHour * 60 + localMinute));

        return diffMinutes <= 5;
      } catch {
        return false;
      }
    });

    console.log(`Sending to ${targetSubscribers.length} subscribers`);

    // Step 6: Send emails
    const results = await Promise.allSettled(
      targetSubscribers.map((sub) =>
        sendBriefingEmail(sub.email, briefing, sub.id)
      )
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - sent;

    return NextResponse.json({
      success: true,
      articles_fetched: rawArticles.length,
      articles_after_dedup: unique.length,
      stories_in_briefing: briefing.stories.length,
      subscribers_targeted: targetSubscribers.length,
      emails_sent: sent,
      emails_failed: failed,
    });
  } catch (err) {
    console.error("Briefing pipeline error:", err);
    return NextResponse.json(
      { error: "Pipeline failed", details: String(err) },
      { status: 500 }
    );
  }
}
