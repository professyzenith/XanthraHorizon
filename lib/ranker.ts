import { NewsArticle } from "@/types";

// High-value AI keywords that signal important news
const HIGH_PRIORITY_KEYWORDS = [
  "launch", "launches", "announce", "announces", "release", "releases",
  "breakthrough", "new model", "gpt", "claude", "gemini", "llama",
  "openai", "anthropic", "google", "deepmind", "meta ai", "mistral",
  "nvidia", "funding", "raises", "billion", "acquisition", "partnership",
  "research", "paper", "benchmark", "state-of-the-art", "sota",
  "agent", "reasoning", "multimodal", "open source", "open-source",
  "chatgpt", "regulation", "safety", "alignment", "fine-tuning",
  "inference", "training", "parameters", "tokens", "context window",
];

// Credible sources get a score boost
const SOURCE_SCORES: Record<string, number> = {
  // Tier 1 — official lab blogs (highest credibility)
  "OpenAI Blog":                  10,
  "Anthropic Blog":               10,
  "Google DeepMind":              10,
  // Tier 2 — quality tech media
  "VentureBeat AI":                6,
  "TechCrunch AI":                 6,
  "MIT Tech Review":               6,
  // Tier 2 — global Google News aggregators
  "Google News - AI":              3,
  "Google News - LLM":             3,
  // Regional sources (added to ensure they score above the baseline default)
  "Google News - India AI":        3,
  "Google News - Asia AI":         3,
  "Google News - Middle East AI":  3,
  "Analytics Vidhya":              4,
};

function scoreArticle(article: NewsArticle): number {
  let score = 0;
  const text = `${article.title} ${article.description}`.toLowerCase();

  // Recency score (max 20 points, decays over 48h)
  const ageHours =
    (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 20 - ageHours * 0.4);

  // Source credibility
  score += SOURCE_SCORES[article.source] ?? 2;

  // Keyword relevance (up to 15 points)
  let keywordHits = 0;
  for (const kw of HIGH_PRIORITY_KEYWORDS) {
    if (text.includes(kw)) keywordHits++;
  }
  score += Math.min(15, keywordHits * 2);

  // Description quality (longer = more informative)
  if (article.description.length > 200) score += 5;
  if (article.description.length > 100) score += 2;

  return score;
}

export function rankArticles(
  articles: NewsArticle[]
): (NewsArticle & { score: number })[] {
  return articles
    .map((a) => ({ ...a, score: scoreArticle(a) }))
    .sort((a, b) => b.score - a.score);
}
