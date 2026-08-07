import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchNewsByTopics } from "@/lib/newsFetcher";
import { deduplicateArticles } from "@/lib/deduplicator";
import { rankArticles } from "@/lib/ranker";
import { generateBriefing } from "@/lib/summarizer";
import { sendBriefingEmail } from "@/lib/emailSender";

// ─────────────────────────────────────────────────────────────────────────────
// DAILY INTELLIGENCE BRIEF — PIPELINE ORCHESTRATOR
//
// This is the engine room of Xanthra Horizon. One POST request triggers a
// full 6-stage pipeline that transforms raw RSS feeds into a personalized,
// AI-generated intelligence briefing delivered to each subscriber's inbox.
//
// Pipeline stages:
//   1. Subscriber resolution  — who should receive a briefing right now?
//   2. Topic grouping         — group by unique topic combos to avoid
//                               redundant Gemini calls (cost optimization)
//   3. News ingestion         — fetch only the sources relevant to each group
//   4. Deduplication          — two-pass: URL hash + Jaccard title similarity
//   5. Ranking                — composite score (recency × source × keywords)
//   6. AI summarization       — one Gemini call per unique topic group
//   7. Delivery               — parallel email dispatch via Resend
//
// The key design insight: subscribers who chose the same topics share a
// single Gemini call and a single news fetch. 100 "AI & Tech" subscribers
// generate exactly the same API cost as 1 "AI & Tech" subscriber.
// Personalization scales for free.
//
// Called by: GitHub Actions cron (every 30 minutes, all 24 hours)
// Protected by: Bearer token (CRON_SECRET)
// ─────────────────────────────────────────────────────────────────────────────


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

    // Step 1: Find subscribers whose local delivery time matches now (within 5 min window)
    const now = new Date();

    const { data: subscribers, error: subError } = await supabaseAdmin
      .from("subscribers")
      .select("*")
      .eq("is_active", true);

    if (subError || !subscribers) {
      console.error("Failed to fetch subscribers:", subError);
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
    }

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

        // GitHub Actions cron can be delayed by 10-25 minutes under high load. 
        // 30-minute window ensures we don't skip an email even if the cron runner is severely delayed.
        return diffMinutes <= 30;
      } catch {
        return false;
      }
    });

    console.log(`Found ${targetSubscribers.length} subscribers scheduled for this hour`);

    if (targetSubscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No subscribers scheduled for this hour. Skipping AI generation to save costs.",
      });
    }

    // Step 2: Fetch news from all sources
    const rawArticles = await fetchNewsByTopics();
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

    // Group subscribers by their unique topics
    const groups = new Map<string, typeof targetSubscribers>();
    for (const sub of targetSubscribers) {
      const topicKey = JSON.stringify([...(sub.topics || [])].sort());
      if (!groups.has(topicKey)) groups.set(topicKey, []);
      groups.get(topicKey)?.push(sub);
    }

    const allFailures: any[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (const [topicKey, subscribersInGroup] of groups) {
      const topics = JSON.parse(topicKey);
      const groupArticles = crossDayFiltered.filter((a) => 
        topics.length === 0 || topics.includes(a.topic)
      );

      // Step 3: Rank
      const ranked = rankArticles(groupArticles);

      // Step 4: Generate AI briefing (summaries + why it matters)
      const briefing = await generateBriefing(ranked, 7);
      console.log(`[Xanthra Horizon] Briefing generated for topics: ${topicKey}`);

      // Step 4b: Persist the top 7 story hashes
      const topHashes = briefing.stories.map((s) => ({
        hash:   ranked.find((r) => r.title === s.title)?.hash ?? "",
        title:  s.title,
        url:    s.url,
        source: s.source,
      })).filter((r) => r.hash);

      if (topHashes.length > 0) {
        await supabaseAdmin
          .from("articles_seen")
          .upsert(topHashes, { onConflict: "hash", ignoreDuplicates: true });
      }

      // Step 6: Send emails
      const results = await Promise.allSettled(
        subscribersInGroup.map((sub) =>
          sendBriefingEmail(sub.email, briefing, sub.id)
        )
      );

      totalSent += results.filter((r) => r.status === "fulfilled" && r.value.success).length;
      totalFailed += results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.success)).length;

      allFailures.push(...results
        .map((r, i) => ({
          subscriber: subscribersInGroup[i].email.replace(/(.{3}).*(@.*)/, "$1***$2"),
          error: r.status === "rejected" ? String(r.reason) : (r.status === "fulfilled" && !r.value.success ? r.value.error : null),
        }))
        .filter((f) => f.error !== null));
    }

    return NextResponse.json({
      success: true,
      articles_fetched: rawArticles.length,
      subscribers_targeted: targetSubscribers.length,
      emails_sent: totalSent,
      emails_failed: totalFailed,
      ...(allFailures.length > 0 && { failures: allFailures }),
    });
  } catch (err) {
    console.error("[Xanthra Horizon] Pipeline error:", err);
    return NextResponse.json(
      { error: "Pipeline failed", details: String(err) },
      { status: 500 }
    );
  }
}
