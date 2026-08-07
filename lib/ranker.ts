import { NewsArticle } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE RANKER
//
// Not all news is created equal. A press release from OpenAI's official blog
// is worth more than a re-aggregated summary from a third-tier tech site.
// A story published 2 hours ago is more urgent than one published 47 hours ago.
// A headline that mentions "breakthrough" and "reasoning" signals real signal.
//
// This module distills all of that intuition into a numeric score, so Gemini
// always gets the most important, most credible, most recent stories to work
// with — not whatever happened to come first in the RSS feed.
//
// Scoring breakdown (100-point scale):
//   Recency      → up to 20 pts (decays linearly over 48 hours)
//   Source tier  → up to 10 pts (official lab blogs outrank aggregators)
//   Keywords     → up to 15 pts (signal-rich terms from the title/description)
//   Description  → up to  7 pts (longer = richer context for Gemini)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Keywords that strongly signal high-value AI/tech coverage.
 *
 * These were curated manually — not generated — based on what subscribers
 * actually care about. The list deliberately excludes vague hype words
 * like "revolutionary" or "game-changing" that low-quality outlets overuse.
 */
const HIGH_PRIORITY_KEYWORDS = [
  // Model releases & labs
  "launch", "launches", "announce", "announces", "release", "releases",
  "breakthrough", "new model", "gpt", "claude", "gemini", "llama",
  "openai", "anthropic", "google", "deepmind", "meta ai", "mistral",

  // Business signals
  "nvidia", "funding", "raises", "billion", "acquisition", "partnership",

  // Technical substance
  "research", "paper", "benchmark", "state-of-the-art", "sota",
  "agent", "reasoning", "multimodal", "open source", "open-source",
  "chatgpt", "regulation", "safety", "alignment", "fine-tuning",
  "inference", "training", "parameters", "tokens", "context window",
];

/**
 * Source credibility scores.
 *
 * Tier 1 (official lab blogs): These sources publish primary information.
 * When OpenAI's blog posts, that IS the news — everything else is commentary.
 *
 * Tier 2 (established tech media): Rigorous editorial standards, real journalists.
 * These scores reward quality over quantity.
 *
 * Default for unlisted sources: 2 pts — above zero to stay in the pool,
 * but low enough that they'll rarely beat a Tier-1 or Tier-2 story.
 */
const SOURCE_SCORES: Record<string, number> = {
  // ── Tier 1 — Official lab publications ────────────────────────────────────
  "OpenAI Blog":    10,
  "Anthropic Blog": 10,
  "Google DeepMind": 10,

  // ── Tier 2 — Quality tech journalism ─────────────────────────────────────
  "VentureBeat AI":    6,
  "TechCrunch AI":     6,
  "MIT Technology Review": 6,
  "Wired Technology":  5,
  "The Verge Tech":    5,

  // ── Aggregators — useful but lower weight ─────────────────────────────────
  "Google News - AI":           3,
  "Google News - LLM":          3,
  "Google News - India AI":     3,
  "Google News - Asia AI":      3,
  "Google News - Middle East AI": 3,
  "Analytics Vidhya":           4,
};

/**
 * Computes a composite relevance score for a single article.
 *
 * The score is additive and deliberately unbounded — we sort descending,
 * so absolute values don't matter, only relative ranking.
 */
function scoreArticle(article: NewsArticle): number {
  let score = 0;
  const content = `${article.title} ${article.description}`.toLowerCase();

  // ── Recency: freshness decays linearly over 48 hours ─────────────────────
  // An article from 1 hour ago scores ~20 pts. From 48 hours ago: ~0 pts.
  const ageHours = (Date.now() - new Date(article.published_at).getTime()) / 3_600_000;
  score += Math.max(0, 20 - ageHours * 0.4);

  // ── Source credibility ────────────────────────────────────────────────────
  // Unlisted sources get the default of 2 — they stay in the pool but
  // won't displace a VentureBeat or MIT Tech Review story.
  score += SOURCE_SCORES[article.source] ?? 2;

  // ── Keyword signal (capped at 15 pts to prevent keyword stuffing gaming) ──
  let keywordHits = 0;
  for (const keyword of HIGH_PRIORITY_KEYWORDS) {
    if (content.includes(keyword)) keywordHits++;
  }
  score += Math.min(15, keywordHits * 2);

  // ── Description richness ─────────────────────────────────────────────────
  // More context = better Gemini summaries. We reward articles that gave us
  // something to work with beyond a 10-word teaser.
  if (article.description.length > 200) score += 5;
  else if (article.description.length > 100) score += 2;

  return score;
}

/**
 * Ranks a flat array of articles by composite score, highest first.
 * The returned objects include the numeric score for debugging and logging.
 */
export function rankArticles(
  articles: NewsArticle[]
): (NewsArticle & { score: number })[] {
  return articles
    .map((article) => ({ ...article, score: scoreArticle(article) }))
    .sort((a, b) => b.score - a.score);
}
