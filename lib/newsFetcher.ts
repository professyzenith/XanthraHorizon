import { NewsArticle } from "@/types";
import crypto from "crypto";

/**
 * RSS Sources split into two tiers:
 *
 * TIER_1 (official AI lab blogs) — post weekly or less, use a 7-day window.
 *   High credibility (+10 score boost). Never filtered out if they have content.
 *
 * TIER_2 (news aggregators) — post daily, use a 48h window.
 *   Good credibility (+3 score boost). High volume, high freshness.
 */
const TIER_1_SOURCES = [
  {
    name: "OpenAI Blog",
    url:  "https://openai.com/blog/rss.xml",
  },
  {
    name: "Anthropic Blog",
    url:  "https://www.anthropic.com/rss.xml",
  },
  {
    name: "Google DeepMind",
    url:  "https://deepmind.google/blog/rss.xml",
  },
];

const TIER_2_SOURCES = [
  {
    name: "Google News - AI",
    url:  "https://news.google.com/rss/search?q=artificial+intelligence+AI+machine+learning&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - LLM",
    url:  "https://news.google.com/rss/search?q=ChatGPT+Claude+Gemini+LLM+language+model&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "VentureBeat AI",
    url:  "https://venturebeat.com/category/ai/feed/",
  },
  {
    name: "TechCrunch AI",
    url:  "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    name: "MIT Tech Review",
    url:  "https://www.technologyreview.com/feed/",
  },
];

// Generate a unique hash for deduplication
function generateHash(title: string, url: string): string {
  return crypto
    .createHash("md5")
    .update(`${title.toLowerCase().trim()}${url}`)
    .digest("hex");
}

// Fix common RSS encoding artifacts: Windows-1252 smart quotes/dashes
// rendered as garbled UTF-8 sequences in some feeds
function cleanText(s: string): string {
  return s
    .replace(/\u00e2\u0080\u0099/g, "\u2019") // â€™ -> right single quote
    .replace(/\u00e2\u0080\u009c/g, "\u201c") // â€œ -> left double quote
    .replace(/\u00e2\u0080\u009d/g, "\u201d") // â€  -> right double quote
    .replace(/\u00e2\u0080\u0094/g, "\u2014") // â€" -> em dash
    .replace(/\u00e2\u0080\u0093/g, "\u2013") // â€" -> en dash
    .replace(/\u00e2\u0080\u00a6/g, "\u2026") // â€¦ -> ellipsis
    .replace(/[\uFFFD]/g, "")                 // drop replacement char
    .trim();
}

// Parse a single RSS feed and return articles
async function fetchRSSFeed(
  source: { name: string; url: string }
): Promise<NewsArticle[]> {
  try {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "Xanthra-Horizon/1.0" },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) return [];

    const text = await response.text();
    const articles: NewsArticle[] = [];

    // Extract items using regex (avoids heavy XML parser dependency)
    const itemRegex    = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex   = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/;
    const linkRegex    = /<link>(.*?)<\/link>|<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/;
    const descRegex    = /<description><!\[CDATA\[([\s\S]*?)\]\]>|<description>([\s\S]*?)<\/description>/;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;

    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];

      const titleMatch = titleRegex.exec(item);
      const linkMatch  = linkRegex.exec(item);
      const descMatch  = descRegex.exec(item);
      const dateMatch  = pubDateRegex.exec(item);

      const rawTitle = (titleMatch?.[1] || titleMatch?.[2] || "").trim();
      const url      = (linkMatch?.[1]  || linkMatch?.[2]  || "").trim();
      const rawDesc  = (descMatch?.[1]  || descMatch?.[2]  || "").trim();
      const pubDate  = dateMatch?.[1] || new Date().toISOString();

      if (!rawTitle || !url) continue;

      const title = cleanText(rawTitle);

      // Strip HTML tags then fix encoding
      const description = cleanText(
        rawDesc
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#\d+;/g, "")
          .replace(/&[a-z]+;/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500)
      );

      // Parse date safely
      const parsedDate  = new Date(pubDate);
      const publishedAt = isNaN(parsedDate.getTime())
        ? new Date().toISOString()
        : parsedDate.toISOString();

      articles.push({
        title,
        url,
        source: source.name,
        published_at: publishedAt,
        description,
        hash: generateHash(title, url),
      });
    }

    return articles;
  } catch (error) {
    console.error(`Failed to fetch RSS from ${source.name}:`, error);
    return [];
  }
}

// Main function: fetch from all sources with tier-aware time windows
export async function fetchAllAINews(): Promise<NewsArticle[]> {
  const cutoff7d  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Fetch both tiers in parallel
  const [tier1Results, tier2Results] = await Promise.all([
    Promise.allSettled(TIER_1_SOURCES.map((s) => fetchRSSFeed(s))),
    Promise.allSettled(TIER_2_SOURCES.map((s) => fetchRSSFeed(s))),
  ]);

  const allArticles: NewsArticle[] = [];

  // Tier 1: 7-day window — keep recent official blog posts even if old
  for (const result of tier1Results) {
    if (result.status === "fulfilled") {
      const filtered = result.value.filter(
        (a) => new Date(a.published_at) > cutoff7d
      );
      allArticles.push(...filtered);
    }
  }

  // Tier 2: 48h window — only very recent news aggregator articles
  for (const result of tier2Results) {
    if (result.status === "fulfilled") {
      const filtered = result.value.filter(
        (a) => new Date(a.published_at) > cutoff48h
      );
      allArticles.push(...filtered);
    }
  }

  // Safety net: if we still have fewer than 5 articles total,
  // fall back to all unfiltered articles from all sources
  if (allArticles.length < 5) {
    console.warn("Too few articles after filtering — using unfiltered fallback");
    const allResults = [...tier1Results, ...tier2Results];
    const fallback: NewsArticle[] = [];
    for (const result of allResults) {
      if (result.status === "fulfilled") fallback.push(...result.value);
    }
    return fallback;
  }

  return allArticles;
}
