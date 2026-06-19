import { NewsArticle } from "@/types";

// Simple string similarity using Jaccard coefficient on word sets
function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = new Set(Array.from(wordsA).filter((w) => wordsB.has(w)));
  const union = new Set([...Array.from(wordsA), ...Array.from(wordsB)]);

  return intersection.size / union.size;
}

// Remove duplicate articles based on URL hash and title similarity
export function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Map<string, NewsArticle>();
  const deduplicated: NewsArticle[] = [];

  for (const article of articles) {
    // First check: exact URL hash match
    if (seen.has(article.hash)) continue;

    // Second check: title similarity against already-kept articles
    let isDuplicate = false;
    for (const kept of deduplicated) {
      if (titleSimilarity(article.title, kept.title) > 0.65) {
        isDuplicate = true;
        // Keep the one with a better description
        if (article.description.length > kept.description.length) {
          const idx = deduplicated.indexOf(kept);
          deduplicated[idx] = article;
          seen.delete(kept.hash);
          seen.set(article.hash, article);
        }
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(article.hash, article);
      deduplicated.push(article);
    }
  }

  return deduplicated;
}
