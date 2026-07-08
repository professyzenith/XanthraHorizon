import { rankArticles } from "@/lib/ranker";
import { NewsArticle } from "@/types";

function makeArticle(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    title: "AI research paper published",
    url: "https://example.com/article",
    source: "OpenAI Blog",
    published_at: new Date().toISOString(),
    description: "A description of the article.",
    hash: "abc123",
    ...overrides,
  };
}

describe("rankArticles", () => {
  it("returns an empty array when given an empty array", () => {
    expect(rankArticles([])).toEqual([]);
  });

  it("adds a numeric score to every article", () => {
    const articles = [makeArticle(), makeArticle({ hash: "xyz" })];
    const ranked = rankArticles(articles);
    ranked.forEach((a) => {
      expect(typeof a.score).toBe("number");
      expect(a.score).toBeGreaterThanOrEqual(0);
    });
  });

  it("ranks a Tier 1 source higher than a Tier 3 source given equal recency and keywords", () => {
    const now = new Date().toISOString();
    const tier1 = makeArticle({
      hash: "t1",
      source: "OpenAI Blog",
      published_at: now,
      title: "New release",
      description: "Short.",
    });
    const tier3 = makeArticle({
      hash: "t3",
      source: "Google News - AI",
      published_at: now,
      title: "New release",
      description: "Short.",
    });
    const ranked = rankArticles([tier3, tier1]);
    expect(ranked[0].source).toBe("OpenAI Blog");
  });

  it("ranks a recent article higher than a stale article from the same source", () => {
    const recentDate = new Date().toISOString();
    const staleDate = new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(); // ~47h ago

    const recent = makeArticle({
      hash: "recent",
      source: "VentureBeat AI",
      published_at: recentDate,
    });
    const stale = makeArticle({
      hash: "stale",
      source: "VentureBeat AI",
      published_at: staleDate,
    });
    const ranked = rankArticles([stale, recent]);
    expect(ranked[0].hash).toBe("recent");
  });

  it("gives a keyword-rich article a higher score", () => {
    const now = new Date().toISOString();
    const keywordRich = makeArticle({
      hash: "rich",
      source: "Google News - AI",
      published_at: now,
      title: "OpenAI launches GPT-5 with breakthrough reasoning and multimodal agents",
      description:
        "OpenAI announced the release of GPT-5, a state-of-the-art model with improved inference, fine-tuning support, and 1M token context window. Anthropic and Google DeepMind are expected to respond with their own releases.",
    });
    const keywordPoor = makeArticle({
      hash: "poor",
      source: "Google News - AI",
      published_at: now,
      title: "Tech company announces update",
      description: "A technology company has made an announcement.",
    });
    const ranked = rankArticles([keywordPoor, keywordRich]);
    expect(ranked[0].hash).toBe("rich");
  });

  it("returns articles sorted by score descending", () => {
    const articles = Array.from({ length: 5 }, (_, i) =>
      makeArticle({
        hash: `h${i}`,
        source: i % 2 === 0 ? "OpenAI Blog" : "Google News - AI",
        published_at: new Date(Date.now() - i * 3_600_000).toISOString(),
      })
    );
    const ranked = rankArticles(articles);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it("preserves all original article fields on ranked output", () => {
    const article = makeArticle({ hash: "preserve-test" });
    const ranked = rankArticles([article]);
    expect(ranked[0].title).toBe(article.title);
    expect(ranked[0].url).toBe(article.url);
    expect(ranked[0].source).toBe(article.source);
    expect(ranked[0].hash).toBe(article.hash);
    expect(ranked[0].description).toBe(article.description);
  });
});
