import { NextRequest, NextResponse } from "next/server";
import { fetchAllAINews }      from "@/lib/newsFetcher";
import { deduplicateArticles } from "@/lib/deduplicator";
import { rankArticles }        from "@/lib/ranker";
import { generateBriefing }    from "@/lib/summarizer";

/**
 * GET /api/test-pipeline
 *
 * Dry-run of the full pipeline — fetch → dedupe → rank → summarize.
 * Does NOT send any emails or write to the database.
 * Protected by the same CRON_SECRET as the real pipeline.
 *
 * Usage:
 *   curl http://localhost:3000/api/test-pipeline \
 *     -H "Authorization: Bearer YOUR_CRON_SECRET"
 *
 * Optional query params:
 *   ?skip_ai=1  — skip Gemini call (faster, just returns ranked headlines)
 *   ?top=N      — number of top stories to include (default: 7)
 */
export async function GET(req: NextRequest) {
  // Auth check
  const cronSecret  = process.env.CRON_SECRET;
  const authHeader  = req.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const skipAI = searchParams.get("skip_ai") === "1";
  const topN   = Math.min(parseInt(searchParams.get("top") ?? "7", 10), 20);

  const start = Date.now();
  const log: string[] = [];

  try {
    // Step 1 — Fetch
    log.push("Fetching news sources…");
    const rawArticles = await fetchAllAINews();
    log.push(`✓ Fetched: ${rawArticles.length} raw articles`);

    if (rawArticles.length === 0) {
      return NextResponse.json({
        ok: false,
        log,
        error: "No articles fetched from any source.",
        duration_ms: Date.now() - start,
      });
    }

    // Step 2 — Deduplicate
    const unique = deduplicateArticles(rawArticles);
    log.push(`✓ After dedup: ${unique.length} unique articles`);

    // Step 3 — Rank
    const ranked = rankArticles(unique);
    const top    = ranked.slice(0, topN);
    log.push(`✓ Top ${topN} headlines ranked`);

    // Early return if skip_ai
    if (skipAI) {
      return NextResponse.json({
        ok: true,
        log,
        articles_fetched:    rawArticles.length,
        articles_after_dedup: unique.length,
        top_stories: top.map((a, i) => ({
          rank:    i + 1,
          score:   a.score.toFixed(1),
          title:   a.title,
          source:  a.source,
          url:     a.url,
          published_at: a.published_at,
        })),
        duration_ms: Date.now() - start,
        note: "AI summarization skipped (skip_ai=1). Add GEMINI_API_KEY and remove skip_ai to test full pipeline.",
      });
    }

    // Step 4 — Summarize
    log.push("Calling Gemini for summaries…");
    const briefing = await generateBriefing(ranked, topN);
    log.push("✓ Briefing generated");

    return NextResponse.json({
      ok: true,
      log,
      articles_fetched:     rawArticles.length,
      articles_after_dedup: unique.length,
      briefing_date:        briefing.date,
      executive_brief:      briefing.executive_brief,
      stories: briefing.stories.map((s, i) => ({
        rank:           i + 1,
        title:          s.title,
        source:         s.source,
        url:            s.url,
        summary:        s.summary,
        why_it_matters: s.why_it_matters,
        score:          s.score.toFixed(1),
      })),
      duration_ms: Date.now() - start,
      note: "Dry run — no emails sent, no database writes.",
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      log,
      error: String(err),
      duration_ms: Date.now() - start,
    }, { status: 500 });
  }
}
