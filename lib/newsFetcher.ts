import { NewsArticle, Topic } from "@/types";
import crypto from "crypto";

/**
 * AUTHENTIC SOURCES ONLY — each source is a verified, globally trusted outlet.
 * No opinion blogs, no SEO aggregators. Every source here has:
 *  - Editorial standards & fact-checking processes
 *  - Recognized journalistic credibility
 *
 * Sources are tagged by topic so we can filter per subscriber preference.
 *
 * Tier 1 (official/primary): 7-day window — low volume but high credibility
 * Tier 2 (news orgs):        48h window  — daily news cycle
 */

interface Source {
  name: string;
  url: string;
  topic: Topic;
  tier: 1 | 2;
}

const SOURCES: Source[] = [
  /* ══════════════════════════════════════════════════════════
     AI & TECHNOLOGY
     Sources: Official AI lab blogs + top-tier tech journalism
     ══════════════════════════════════════════════════════════ */
  { name: "OpenAI Blog",           url: "https://openai.com/blog/rss.xml",                                                                                                 topic: "ai_tech", tier: 1 },
  { name: "Anthropic Blog",        url: "https://www.anthropic.com/rss.xml",                                                                                               topic: "ai_tech", tier: 1 },
  { name: "Google DeepMind",       url: "https://deepmind.google/blog/rss.xml",                                                                                            topic: "ai_tech", tier: 1 },
  { name: "MIT Technology Review", url: "https://www.technologyreview.com/feed/",                                                                                          topic: "ai_tech", tier: 2 },
  { name: "VentureBeat AI",        url: "https://venturebeat.com/category/ai/feed/",                                                                                       topic: "ai_tech", tier: 2 },
  { name: "TechCrunch AI",         url: "https://techcrunch.com/category/artificial-intelligence/feed/",                                                                   topic: "ai_tech", tier: 2 },
  { name: "Wired Technology",      url: "https://www.wired.com/feed/category/science/latest/rss",                                                                          topic: "ai_tech", tier: 2 },
  { name: "The Verge Tech",        url: "https://www.theverge.com/rss/index.xml",                                                                                          topic: "ai_tech", tier: 2 },

  /* ══════════════════════════════════════════════════════════
     GEOPOLITICS & WORLD NEWS
     Sources: Reuters, AP, BBC — the gold standard for wire news
     ══════════════════════════════════════════════════════════ */
  { name: "Reuters World",         url: "https://feeds.reuters.com/reuters/worldNews",                                                                                      topic: "geopolitics", tier: 2 },
  { name: "BBC World",             url: "http://feeds.bbci.co.uk/news/world/rss.xml",                                                                                      topic: "geopolitics", tier: 2 },
  { name: "AP News World",         url: "https://apnews.com/rss/world-news",                                                                                               topic: "geopolitics", tier: 2 },
  { name: "Al Jazeera",            url: "https://www.aljazeera.com/xml/rss/all.xml",                                                                                       topic: "geopolitics", tier: 2 },
  { name: "The Guardian World",    url: "https://www.theguardian.com/world/rss",                                                                                            topic: "geopolitics", tier: 2 },

  /* ══════════════════════════════════════════════════════════
     POLITICS
     Sources: Established political journalism & wire services
     ══════════════════════════════════════════════════════════ */
  { name: "Reuters Politics",      url: "https://feeds.reuters.com/Reuters/PoliticsNews",                                                                                  topic: "politics", tier: 2 },
  { name: "BBC Politics",          url: "http://feeds.bbci.co.uk/news/politics/rss.xml",                                                                                   topic: "politics", tier: 2 },
  { name: "AP Politics",           url: "https://apnews.com/rss/politics",                                                                                                 topic: "politics", tier: 2 },
  { name: "The Guardian Politics", url: "https://www.theguardian.com/politics/rss",                                                                                        topic: "politics", tier: 2 },

  /* ══════════════════════════════════════════════════════════
     BUSINESS & FINANCE
     Sources: Reuters, Bloomberg-level financial reporting
     ══════════════════════════════════════════════════════════ */
  { name: "Reuters Business",      url: "https://feeds.reuters.com/reuters/businessNews",                                                                                   topic: "business", tier: 2 },
  { name: "BBC Business",          url: "http://feeds.bbci.co.uk/news/business/rss.xml",                                                                                   topic: "business", tier: 2 },
  { name: "Financial Times",       url: "https://www.ft.com/rss/home",                                                                                                     topic: "business", tier: 1 },
  { name: "The Economist",         url: "https://www.economist.com/finance-and-economics/rss.xml",                                                                         topic: "business", tier: 1 },

  /* ══════════════════════════════════════════════════════════
     SCIENCE
     Sources: Nature, Science, peer-reviewed & science journalism
     ══════════════════════════════════════════════════════════ */
  { name: "Nature News",           url: "https://www.nature.com/nature.rss",                                                                                               topic: "science", tier: 1 },
  { name: "Science AAAS",          url: "https://www.science.org/rss/news_current.xml",                                                                                    topic: "science", tier: 1 },
  { name: "BBC Science",           url: "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml",                                                                    topic: "science", tier: 2 },
  { name: "Scientific American",   url: "https://www.scientificamerican.com/platform/syndication/rss/",                                                                    topic: "science", tier: 2 },

  /* ══════════════════════════════════════════════════════════
     SPORTS
     Sources: ESPN, BBC Sport — established sports journalism
     ══════════════════════════════════════════════════════════ */
  { name: "ESPN Top Stories",      url: "https://www.espn.com/espn/rss/news",                                                                                              topic: "sports", tier: 2 },
  { name: "BBC Sport",             url: "http://feeds.bbci.co.uk/sport/rss.xml?edition=uk",                                                                                topic: "sports", tier: 2 },
  { name: "Reuters Sports",        url: "https://feeds.reuters.com/reuters/sportsNews",                                                                                    topic: "sports", tier: 2 },
  { name: "AP Sports",             url: "https://apnews.com/rss/sports",                                                                                                   topic: "sports", tier: 2 },

  /* ══════════════════════════════════════════════════════════
     HEALTH
     Sources: WHO, CDC, medical journalism from trusted outlets
     ══════════════════════════════════════════════════════════ */
  { name: "WHO News",              url: "https://www.who.int/rss-feeds/news-english.xml",                                                                                  topic: "health", tier: 1 },
  { name: "BBC Health",            url: "http://feeds.bbci.co.uk/news/health/rss.xml",                                                                                     topic: "health", tier: 2 },
  { name: "Reuters Health",        url: "https://feeds.reuters.com/reuters/healthNews",                                                                                    topic: "health", tier: 2 },
  { name: "The Lancet",            url: "https://www.thelancet.com/rssfeed/lancet_online.xml",                                                                             topic: "health", tier: 1 },
];

// Generate a unique hash for deduplication
function generateHash(title: string, url: string): string {
  return crypto
    .createHash("md5")
    .update(`${title.toLowerCase().trim()}${url}`)
    .digest("hex");
}

// Fix common RSS encoding artifacts
function cleanText(s: string): string {
  return s
    .replace(/\u00e2\u0080\u0099/g, "\u2019")
    .replace(/\u00e2\u0080\u009c/g, "\u201c")
    .replace(/\u00e2\u0080\u009d/g, "\u201d")
    .replace(/\u00e2\u0080\u0094/g, "\u2014")
    .replace(/\u00e2\u0080\u0093/g, "\u2013")
    .replace(/\u00e2\u0080\u00a6/g, "\u2026")
    .replace(/[\uFFFD]/g, "")
    .trim();
}

// Parse a single RSS feed and return articles
async function fetchRSSFeed(source: Source): Promise<NewsArticle[]> {
  try {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "XanthraHorizon/2.0 (+https://xanthrahorizon.vercel.app)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const text = await response.text();
    const articles: NewsArticle[] = [];

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
        topic: source.topic,
      });
    }

    return articles;
  } catch (error) {
    console.error(`Failed to fetch RSS from ${source.name}:`, error);
    return [];
  }
}

/**
 * Fetch news for a specific set of topics.
 * If topics is empty or undefined, fetch ALL topics.
 */
export async function fetchNewsByTopics(topics?: Topic[]): Promise<NewsArticle[]> {
  const cutoff7d  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Filter sources to only those matching the requested topics
  const activeSources = topics && topics.length > 0
    ? SOURCES.filter(s => topics.includes(s.topic))
    : SOURCES;

  const results = await Promise.allSettled(activeSources.map(s => fetchRSSFeed(s)));

  const allArticles: NewsArticle[] = [];

  results.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    const source = activeSources[i];
    const cutoff = source.tier === 1 ? cutoff7d : cutoff48h;
    const filtered = result.value.filter(a => new Date(a.published_at) > cutoff);
    allArticles.push(...filtered);
  });

  // Safety net fallback
  if (allArticles.length < 5) {
    console.warn("Too few articles after filtering — using unfiltered fallback");
    const fallback: NewsArticle[] = [];
    results.forEach(r => {
      if (r.status === "fulfilled") fallback.push(...r.value);
    });
    return fallback;
  }

  return allArticles;
}

// Legacy export for backward compatibility with test-pipeline and send-briefing
export async function fetchAllAINews(): Promise<NewsArticle[]> {
  return fetchNewsByTopics();
}
