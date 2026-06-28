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

  // Always require the secret
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Xanthra Horizon] Starting Daily Intelligence Brief pipeline...");

    // Step 1: Fetch news from all sources
    const rawArticles = await fetchAllAINews();
    console.log(`Fetched ${rawArticles.length} raw articles`);

    if (rawArticles.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No articles fetched",
      });
    }

    // Step 2: Deduplicate (within this batch — Jaccard + URL hash)
    const unique = deduplicateArticles(rawArticles);
    console.log(`After dedup: ${unique.length} unique articles`);

    // Step 2b: Cross-day deduplication — filter out hashes already sent in a
    // prior pipeline run (stored in articles_seen, cleaned up after 7 days).
    let crossDayFiltered = unique;
    try {
      const hashes = unique.map((a) => a.hash);
      const { data: seenRows } = await supabaseAdmin
        .from("articles_seen")
        .select("hash")
        .in("hash", hashes);

      if (seenRows && seenRows.length > 0) {
        const seenSet = new Set(seenRows.map((r: { hash: string }) => r.hash));
        const before = crossDayFiltered.length;
        crossDayFiltered = crossDayFiltered.filter((a) => !seenSet.has(a.hash));
        console.log(
          `Cross-day dedup: removed ${before - crossDayFiltered.length} already-seen articles`
        );
      }
    } catch (crossDayErr) {
      // Non-fatal — if the table is missing or query fails, continue without cross-day dedup
      console.warn("[send-briefing] Cross-day dedup skipped:", crossDayErr);
    }

    // Safety fallback: if cross-day dedup emptied the pool, revert to the full
    // batch so we always have something to send.
    if (crossDayFiltered.length < 5) {
      console.warn("Cross-day dedup left fewer than 5 articles — falling back to full batch");
      crossDayFiltered = unique;
    }

    // Step 3: Rank
    const ranked = rankArticles(crossDayFiltered);

    // Step 4: Generate AI briefing (summaries + why it matters)
    const briefing = await generateBriefing(ranked, 7);
    console.log("[Xanthra Horizon] Daily Intelligence Brief generated successfully");

    // Step 4b: Persist the top 7 story hashes so they won't appear tomorrow
    const topHashes = briefing.stories.map((s) => ({
      hash:   ranked.find((r) => r.title === s.title)?.hash ?? "",
      title:  s.title,
      url:    s.url,
      source: s.source,
    })).filter((r) => r.hash);

    if (topHashes.length > 0) {
      await supabaseAdmin
        .from("articles_seen")
        .upsert(topHashes, { onConflict: "hash", ignoreDuplicates: true })
        .then(({ error }) => {
          if (error) console.warn("[send-briefing] articles_seen upsert error:", error.message);
        });
    }

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

    // Collect per-failure details so the response is immediately actionable
    const failures = results
      .map((r, i) => ({
        subscriber: targetSubscribers[i].email.replace(/(.{3}).*(@.*)/, "$1***$2"), // redact most of email
        error: r.status === "rejected"
          ? String(r.reason)
          : r.status === "fulfilled" && !r.value.success
            ? r.value.error
            : null,
      }))
      .filter((f) => f.error !== null);

    return NextResponse.json({
      success: true,
      articles_fetched: rawArticles.length,
      articles_after_dedup: unique.length,
      articles_after_cross_day_dedup: crossDayFiltered.length,
      stories_in_briefing: briefing.stories.length,
      subscribers_targeted: targetSubscribers.length,
      emails_sent: sent,
      emails_failed: failed,
      ...(failures.length > 0 && { failures }),
    });
  } catch (err) {
    console.error("[Xanthra Horizon] Pipeline error:", err);
    return NextResponse.json(
      { error: "Pipeline failed", details: String(err) },
      { status: 500 }
    );
  }
}
