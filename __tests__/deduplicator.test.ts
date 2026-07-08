import { deduplicateArticles } from "@/lib/deduplicator";
import { NewsArticle } from "@/types";

function makeArticle(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    title: "OpenAI launches new GPT-5 model with improved reasoning",
    url: "https://openai.com/blog/gpt-5",
    source: "OpenAI Blog",
    published_at: new Date().toISOString(),
    description: "OpenAI has announced GPT-5, its most capable model yet.",
    hash: "abc123",
    ...overrides,
  };
}

describe("deduplicateArticles", () => {
  it("returns an empty array when given an empty array", () => {
    expect(deduplicateArticles([])).toEqual([]);
  });

  it("returns a single article unchanged", () => {
    const article = makeArticle();
    const result = deduplicateArticles([article]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe(article.title);
  });

  it("removes an exact URL hash duplicate", () => {
    const a1 = makeArticle({ hash: "same-hash", title: "First article about OpenAI" });
    const a2 = makeArticle({ hash: "same-hash", title: "Different title but same URL" });
    const result = deduplicateArticles([a1, a2]);
    expect(result).toHaveLength(1);
    expect(result[0].hash).toBe("same-hash");
  });

  it("removes a near-duplicate title (Jaccard > 0.65)", () => {
    // Titles share enough words to exceed the 0.65 Jaccard threshold
    const a1 = makeArticle({
      hash: "hash-1",
      title: "Google DeepMind releases Gemini Ultra language model breakthrough",
    });
    const a2 = makeArticle({
      hash: "hash-2",
      title: "Google DeepMind releases Gemini Ultra language model breakthrough today",
    });
    const result = deduplicateArticles([a1, a2]);
    expect(result).toHaveLength(1);
  });

  it("keeps two articles with unrelated titles", () => {
    const a1 = makeArticle({
      hash: "hash-1",
      title: "OpenAI raises 10 billion dollars in Series F funding round",
    });
    const a2 = makeArticle({
      hash: "hash-2",
      title: "EU parliament votes on new artificial intelligence regulation bill",
    });
    const result = deduplicateArticles([a1, a2]);
    expect(result).toHaveLength(2);
  });

  it("prefers the article with a longer description when deduplicating", () => {
    const short = makeArticle({
      hash: "hash-1",
      title: "Anthropic launches Claude 4 model with extended context window features",
      description: "Short description.",
    });
    const long = makeArticle({
      hash: "hash-2",
      title: "Anthropic launches Claude 4 model with extended context window features today",
      description:
        "A much longer and more informative description that goes into detail about the capabilities of the new Claude 4 model released by Anthropic, including its 200k token context window and improved reasoning.",
    });
    const result = deduplicateArticles([short, long]);
    expect(result).toHaveLength(1);
    expect(result[0].description.length).toBeGreaterThan(short.description.length);
  });

  it("handles 10+ articles and only returns unique ones", () => {
    const unique1 = makeArticle({ hash: "u1", title: "Meta releases open source Llama model weights publicly" });
    const unique2 = makeArticle({ hash: "u2", title: "NVIDIA announces new H200 GPU chip for AI training" });
    const unique3 = makeArticle({ hash: "u3", title: "Mistral AI raises 600 million euros in Series B funding" });
    const dupe1a = makeArticle({ hash: "d1a", title: "OpenAI ChatGPT now supports persistent memory feature for users" });
    const dupe1b = makeArticle({ hash: "d1b", title: "OpenAI ChatGPT now supports persistent memory feature for users worldwide" });

    const result = deduplicateArticles([unique1, unique2, unique3, dupe1a, dupe1b]);
    expect(result).toHaveLength(4); // 3 unique + 1 from the dupe pair
  });
});
