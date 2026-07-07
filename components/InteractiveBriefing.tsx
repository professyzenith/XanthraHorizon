"use client";
import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiStory {
  title: string;
  url: string;
  source: string;
  published_at: string;
  summary: string;
  why_it_matters: string;
}

interface ApiBriefing {
  date: string;
  executive_brief: string;
  stories: ApiStory[];
  created_at: string;
}

// Internal shape used by the render logic
interface DisplayStory {
  id: number;
  tag: string;
  tagColor: string;
  dot: string;
  source: string;
  time: string;
  title: string;
  summary: string;
  why: string;
  url: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TAG_STYLES = [
  { tag: "AI",       tagColor: "text-violet-400 bg-violet-400/10 border-violet-400/20", dot: "bg-violet-500" },
  { tag: "Research", tagColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", dot: "bg-emerald-500" },
  { tag: "Product",  tagColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", dot: "bg-cyan-500" },
  { tag: "Industry", tagColor: "text-amber-400 bg-amber-400/10 border-amber-400/20", dot: "bg-amber-500" },
  { tag: "Policy",   tagColor: "text-rose-400 bg-rose-400/10 border-rose-400/20", dot: "bg-rose-500" },
  { tag: "Science",  tagColor: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20", dot: "bg-indigo-500" },
  { tag: "Business", tagColor: "text-teal-400 bg-teal-400/10 border-teal-400/20", dot: "bg-teal-500" },
];

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "1d ago" : `${days}d ago`;
  } catch {
    return "";
  }
}

// ─── Static demo fallback (shown before real data loads or if DB is empty) ───

const DEMO_STORIES: DisplayStory[] = [
  {
    id: 1,
    tag: "Feature",
    tagColor: "text-violet-400 bg-violet-400/10 border-violet-400/20",
    dot: "bg-violet-500",
    source: "OpenAI",
    time: "2h ago",
    title: "ChatGPT Now Remembers Everything About You",
    summary:
      "OpenAI has rolled out persistent memory to ChatGPT. It now remembers your name, preferences, past topics, and personal context — automatically, across every future conversation. You can view, edit, or delete what it knows at any time.",
    why: "AI just stopped being a search engine and started being a real personal assistant. Every conversation from now builds on the last. The more you use it, the more genuinely useful it becomes — for anyone, no technical knowledge required.",
    url: "https://openai.com/blog",
  },
  {
    id: 2,
    tag: "Health",
    tagColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    dot: "bg-emerald-500",
    source: "The Lancet",
    time: "5h ago",
    title: "AI Matches Specialist Doctors in Diagnosing Rare Diseases",
    summary:
      "A peer-reviewed study finds AI can diagnose rare conditions with accuracy matching specialist physicians. Tested across 50,000 patient cases in 12 countries, the system performed at or above specialist level in 94% of scenarios.",
    why: "This isn't science fiction — it's a published clinical study. Specialist-level medical knowledge is becoming universally accessible.",
    url: "https://www.thelancet.com",
  },
  {
    id: 3,
    tag: "Product",
    tagColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    dot: "bg-cyan-500",
    source: "Google",
    time: "8h ago",
    title: "Google's AI Can Now See Your Screen and Help in Real Time",
    summary:
      "Google unveiled Project Astra — an AI that watches what's on your screen or phone camera and responds naturally to what it sees. Ask it to explain, fix, or guide you through anything.",
    why: "AI just became a co-pilot for everyday life. Whether you're cooking, navigating unfamiliar software, or understanding a confusing document — help is one sentence away.",
    url: "https://deepmind.google",
  },
  {
    id: 4,
    tag: "Work",
    tagColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    dot: "bg-amber-500",
    source: "Reuters",
    time: "11h ago",
    title: "Half of All Companies Now Use AI for Daily Decisions",
    summary:
      "A global survey of 10,000 businesses across 40 countries finds 51% now rely on AI tools every day for writing, analysis, customer service, hiring, and financial decisions.",
    why: "AI literacy is becoming the new basic workplace skill — like email was in 2000. Companies using AI effectively are pulling ahead.",
    url: "https://reuters.com",
  },
];

const DEMO_BRIEF =
  "AI is moving from capability to daily reality — memory, healthcare, screen awareness, and the workplace are all crossing a threshold at once. Today's briefing covers four developments every person should know about.";

// ─── Component ────────────────────────────────────────────────────────────────

export default function InteractiveBriefing() {
  const [expanded, setExpanded] = useState<number | null>(1);
  const [stories, setStories] = useState<DisplayStory[]>(DEMO_STORIES);
  const [executiveBrief, setExecutiveBrief] = useState<string>(DEMO_BRIEF);
  const [briefingDate, setBriefingDate] = useState<string>("");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch("/api/latest-briefing")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ApiBriefing | null) => {
        if (!data || !data.stories?.length) return;

        const mapped: DisplayStory[] = data.stories.map((s, i) => {
          const style = TAG_STYLES[i % TAG_STYLES.length];
          return {
            id:       i + 1,
            tag:      style.tag,
            tagColor: style.tagColor,
            dot:      style.dot,
            source:   s.source,
            time:     s.published_at ? timeAgo(s.published_at) : "",
            title:    s.title,
            summary:  s.summary,
            why:      s.why_it_matters,
            url:      s.url,
          };
        });

        setStories(mapped);
        setExecutiveBrief(data.executive_brief);
        setBriefingDate(data.date);
        setIsLive(true);
        setExpanded(1);
      })
      .catch(() => {
        // Silently fall back to demo stories
      });
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Email chrome header */}
      <div className="rounded-t-2xl border border-[#221e19] bg-[#0a0805] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs text-[#52473a] font-mono ml-2">
            Xanthra Horizon —{" "}
            {briefingDate || new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-amber-500 animate-pulse" : "bg-[#2d2d2d]"}`} />
          <span className="text-[10px] text-[#52473a]">{isLive ? "LIVE" : "PREVIEW"}</span>
        </div>
      </div>

      {/* Executive brief */}
      <div className="border-x border-[#221e19] bg-[#0d0b09] px-5 py-4">
        <p className="text-[10px] font-semibold text-amber-600 tracking-[0.12em] uppercase mb-2">
          Today&apos;s Overview
        </p>
        <p className="text-sm text-[#b4a990] leading-relaxed italic">{executiveBrief}</p>
      </div>

      {/* Story cards */}
      <div className="border border-[#221e19] border-t-0 rounded-b-2xl overflow-hidden bg-[#080706] divide-y divide-[#1a1712]">
        {stories.map((story, i) => {
          const isOpen = expanded === story.id;
          return (
            <div key={story.id} className="group">
              <button
                onClick={() => setExpanded(isOpen ? null : story.id)}
                className="w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="font-mono text-[11px] text-[#2d2d50] pt-0.5 flex-shrink-0 w-5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border tracking-wide ${story.tagColor}`}>
                          {story.tag}
                        </span>
                        <span className="text-[11px] text-[#52527a]">{story.source}</span>
                        {story.time && (
                          <span className="text-[11px] text-[#2d2d50]">{story.time}</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-[#eeeef8] leading-snug group-hover:text-white transition-colors">
                        {story.title}
                      </h3>
                    </div>
                  </div>
                  <div
                    className="flex-shrink-0 mt-0.5 transition-transform duration-300"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <svg className="w-4 h-4 text-[#2d2d50]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expandable content */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{ maxHeight: isOpen ? "500px" : "0px", opacity: isOpen ? 1 : 0 }}
              >
                <div className="px-5 pb-5 ml-8">
                  <p className="text-[13px] text-[#9898b8] leading-relaxed mb-3">{story.summary}</p>
                  <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg mb-3">
                    <div className="mt-1 flex-shrink-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${story.dot}`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.1em] mb-1">
                        Why It Matters
                      </p>
                      <p className="text-[12px] text-[#9898b8] leading-relaxed">{story.why}</p>
                    </div>
                  </div>
                  <a
                    href={story.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#52473a] hover:text-amber-500 transition-colors"
                  >
                    <span>Read original</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
