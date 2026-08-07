import { NewsArticle } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// DEDUPLICATOR
//
// The internet is a noisy place. The same story gets republished across
// Reuters, AP, BBC, and a dozen aggregators — all within minutes of each
// other. Without deduplication, a subscriber would receive seven variations
// of "OpenAI raises $10 billion" and call it spam.
//
// We run two passes to catch duplicates:
//   Pass 1 — Exact match via MD5 URL hash (fast, O(1) per article)
//   Pass 2 — Semantic similarity via Jaccard coefficient on title word sets
//             (catches same story, different headline phrasing)
//
// The Jaccard threshold of 0.65 was chosen after manual testing across
// hundreds of real RSS articles. Below 0.65, we kept too many near-dupes.
// Above 0.65, we started accidentally merging distinct stories.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes Jaccard similarity between two article titles.
 *
 * We tokenize by splitting on non-word characters and filter out stop words
 * (anything ≤3 characters — "the", "and", "of", "in", etc.) to ensure the
 * score reflects meaningful content words only.
 *
 * Returns a value between 0 (completely different) and 1 (identical).
 */
function titleSimilarity(a: string, b: string): number {
  const tokenize = (str: string) =>
    new Set(str.toLowerCase().split(/\W+/).filter((w) => w.length > 3));

  const wordsA = tokenize(a);
  const wordsB = tokenize(b);

  // Edge case: if either title has no meaningful words, treat as unique
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union        = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}

/**
 * Deduplicates a flat array of articles in two passes.
 *
 * When two titles are "similar enough" (Jaccard ≥ 0.65), we keep the article
 * with the longer description — it's almost always the richer, more informative
 * version. This matters because Gemini's summaries are only as good as the
 * context we feed it.
 */
export function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seenHashes  = new Map<string, NewsArticle>();
  const deduplicated: NewsArticle[] = [];

  for (const article of articles) {
    // ── Pass 1: Exact URL/hash dedup ─────────────────────────────────────────
    if (seenHashes.has(article.hash)) continue;

    // ── Pass 2: Fuzzy title similarity ───────────────────────────────────────
    let isDuplicate = false;

    for (const kept of deduplicated) {
      if (titleSimilarity(article.title, kept.title) > 0.65) {
        isDuplicate = true;

        // If the incoming article is richer, swap it in — don't just discard it
        if (article.description.length > kept.description.length) {
          const idx = deduplicated.indexOf(kept);
          deduplicated[idx] = article;
          seenHashes.delete(kept.hash);
          seenHashes.set(article.hash, article);
        }

        break;
      }
    }

    if (!isDuplicate) {
      seenHashes.set(article.hash, article);
      deduplicated.push(article);
    }
  }

  return deduplicated;
}
