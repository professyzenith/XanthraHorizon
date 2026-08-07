import { RankedStory, BriefingData, NewsArticle } from "@/types";

/**
 * Strip residual HTML tags and common HTML entities from a string.
 * Needed because some RSS feeds encode HTML inside CDATA, which survives
 * the newsFetcher's entity-decode step with tags intact.
 */
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")      // remove any remaining tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Gemini model configuration ───────────────────────────────────────────────
// gemini-1.5-flash was retired June 2026 (returns 404 on v1beta).
// gemini-2.0-flash is the current recommended stable model.
// Update this constant when Google releases a newer stable model.
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> };
  }>;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Send the key as a Bearer token — keeps it out of URL query strings
      // which are logged by proxies, CDNs, and Vercel's access log.
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(
      `Gemini API error [HTTP ${response.status} ${response.statusText}] model=${GEMINI_MODEL}: ${errBody}`
    );
  }

  const data: GeminiResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// Generate summaries and "Why It Matters" for top stories
type ScoredArticle = NewsArticle & { score: number };

export async function generateBriefing(
  stories: ScoredArticle[],
  topN = 7
): Promise<BriefingData> {
  const top = stories.slice(0, topN);

  // Build a single prompt for all stories to minimize API calls.
  // Strip HTML from descriptions before sending to Gemini — some RSS sources
  // (e.g. Google News) include encoded HTML tags in their description fields.
  const storiesText = top
    .map(
      (s, i) =>
        `STORY ${i + 1}:
Title: ${s.title}
Source: ${s.source}
Description: ${stripHtml(s.description) || "No description available."}`
    )
    .join("\n\n");

  const prompt = `You are a senior editor at a world-class intelligence briefing service called Xanthra Horizon. You write for a globally curious audience — professionals, students, founders, and everyday people who want to understand what matters in the world today.

Analyze these ${top.length} news stories (which may span AI & technology, geopolitics, politics, business, science, sports, and health) and return ONLY a valid JSON object. No markdown, no code blocks, just raw JSON.

Stories:
${storiesText}

Return this exact JSON structure:
{
  "executive_brief": "2-3 sentence big-picture synthesis of today's most important developments across all topics",
  "stories": [
    {
      "index": 1,
      "summary": "2-sentence factual summary of what happened",
      "why_it_matters": "1-2 sentence insight on why this matters to a globally informed reader"
    }
  ]
}

Rules:
- Only include verified facts from the story itself — NEVER add speculation or unconfirmed claims
- executive_brief should synthesize themes across all topics in a compelling, smart way
- summaries should be precise, factual, and direct — no filler words
- why_it_matters should give genuine insight on real-world impact
- Use confident, authoritative language — no hedging, no "it could be said that"
- Treat every topic equally — sports, health, and geopolitics are as important as AI`;

  let executive_brief = "A complex day across the global intelligence landscape — stories span technology, geopolitics, and markets, with implications that extend well beyond their headlines.";

  // Use a positional array instead of an index-keyed map so that Gemini
  // returning 0-based indices, reordered items, or omitting "index" entirely
  // never causes every lookup to miss and fall through to the HTML fallback.
  const summaries: Array<{ summary: string; why_it_matters: string }> = [];

  try {
    const raw = await callGemini(prompt);
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    executive_brief = parsed.executive_brief ?? executive_brief;

    // Collect summaries by array position — ignore whatever Gemini puts in "index"
    for (const s of parsed.stories ?? []) {
      summaries.push({
        summary:        s.summary        ?? "",
        why_it_matters: s.why_it_matters ?? "",
      });
    }
  } catch (error) {
    // Log the full error — includes HTTP status, model name, and API response body
    console.error(
      "Gemini summarization failed, using fallback summaries. Full error:",
      error instanceof Error ? error.message : String(error)
    );
  }

  const rankedStories: RankedStory[] = top.map((s, i) => ({
    title: s.title,
    url: s.url,
    source: s.source,
    published_at: s.published_at,
    description: s.description,
    summary:
      summaries[i]?.summary ||
      stripHtml(s.description).slice(0, 200) + "…",
    why_it_matters:
      summaries[i]?.why_it_matters ||
      "This story carries meaningful implications for the broader landscape — watch how it develops over the next 24–48 hours.",
    score: s.score,
    topic: s.topic,
  }));

  return {
    date: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    stories: rankedStories,
    executive_brief,
  };
}
