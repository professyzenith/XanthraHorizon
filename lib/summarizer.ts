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

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface GeminiResponse {
  candidates: Array<{
    content: { parts: Array<{ text: string }> };
  }>;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
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

  const prompt = `You are an expert AI analyst writing for Xanthra Horizon, a premium daily intelligence edition read by anyone curious about AI — students, professionals, founders, executives, and everyday people who want to stay informed without information overload.

Analyze these ${top.length} AI news stories and return ONLY a valid JSON object. No markdown, no code blocks, just raw JSON.

Stories:
${storiesText}

Return this exact JSON structure:
{
  "executive_brief": "2-3 sentence big-picture summary of today's most important AI developments",
  "stories": [
    {
      "index": 1,
      "summary": "2-sentence factual summary of what happened",
      "why_it_matters": "1-2 sentence insight on the business/technical significance for AI builders"
    }
  ]
}

Rules:
- executive_brief should synthesize trends, not just list stories
- summaries should be precise, not fluffy
- why_it_matters should give real insight for technical professionals
- Use confident, direct language — no hedging`;

  let executive_brief = "Today's AI landscape shows continued rapid development across models, tools, and research.";
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
    console.error("Gemini summarization failed, using fallback:", error);
  }

  const rankedStories: RankedStory[] = top.map((s, i) => ({
    title: s.title,
    url: s.url,
    source: s.source,
    published_at: s.published_at,
    description: s.description,
    // Use positional lookup; fall back to a clean-text excerpt (HTML stripped)
    // so raw RSS markup never appears in the email even when Gemini fails.
    summary:
      summaries[i]?.summary ||
      stripHtml(s.description).slice(0, 200) + "…",
    why_it_matters:
      summaries[i]?.why_it_matters ||
      "This development contributes to the rapidly evolving AI ecosystem.",
    score: s.score,
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
