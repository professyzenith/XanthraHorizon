"use client";
import { useEffect, useRef, useState } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

interface FeedItem {
  id: number;
  source: string;
  label: string;
  type: string;
  color: string;
  delay: number;
}

interface MetricItem {
  label: string;
  value: number;
  unit: string;
  color: string;
}

const LIVE_FEEDS: FeedItem[] = [
  { id: 1, source: "OpenAI",      label: "ChatGPT memory feature now live for all users",          type: "FEATURE",  color: "#10b981", delay: 0 },
  { id: 2, source: "Reuters",     label: "51% of companies now use AI for daily decisions",         type: "BUSINESS", color: "#6366f1", delay: 1200 },
  { id: 3, source: "Google",      label: "Project Astra: AI that sees your screen in real time",    type: "PRODUCT",  color: "#a78bfa", delay: 2600 },
  { id: 4, source: "The Lancet",  label: "AI matches specialists in diagnosing rare diseases",       type: "HEALTH",   color: "#22d3ee", delay: 4000 },
  { id: 5, source: "BBC Tech",    label: "EU AI Act comes into force across 27 countries",          type: "POLICY",   color: "#f59e0b", delay: 5200 },
  { id: 6, source: "TechCrunch",  label: "OpenAI cuts API prices 80% — third reduction in a year", type: "ECONOMY",  color: "#f43f5e", delay: 6400 },
  { id: 7, source: "Meta",        label: "Llama 4 released — runs on a phone, no internet needed", type: "PRODUCT",  color: "#10b981", delay: 7600 },
  { id: 8, source: "Apple",       label: "Apple Intelligence now active on 2 billion devices",      type: "PRODUCT",  color: "#6366f1", delay: 8800 },
];

const METRICS: MetricItem[] = [
  { label: "Articles Scanned", value: 612, unit: "",  color: "#c9a853" },
  { label: "After Dedup",      value: 89,  unit: "",  color: "#d4875a" },
  { label: "Stories Selected", value: 7,   unit: "",  color: "#0f9388" },
  { label: "Synthesis Time",   value: 1.8, unit: "s", color: "#10b981" },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, decimals = 0) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();

          const tick = (now: number): void => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setVal(parseFloat((target * ease).toFixed(decimals)));
            if (p < 1) requestAnimationFrame(tick);
            else setVal(target);
          };

          requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration, decimals]);

  return { val, ref };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricBlock({ label, value, unit, color }: MetricItem) {
  const decimals = value % 1 !== 0 ? 1 : 0;
  const { val, ref } = useCountUp(value, 1600, decimals);
  return (
    <div ref={ref} className="flex flex-col gap-1 p-4 rounded-xl border border-[#1e1b17] bg-[#0a0807]">
      <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: "#52473a" }}>
        {label}
      </span>
      <span className="text-3xl font-bold tracking-tight counter-glow" style={{ color }}>
        {val}{unit}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommandCenter() {
  const [visible, setVisible] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  // FIX: hydration error — date MUST be empty string on first render so that
  // server HTML matches client HTML. The real value is set only in useEffect,
  // which runs exclusively on the client.
  const [dateStr, setDateStr] = useState<string>("");

  // Live clock — also prevents the static date bug where the time was frozen
  // at the moment of the first server render.
  useEffect(() => {
    const fmt = () => new Date().toUTCString().slice(0, 25);
    setDateStr(fmt());
    const timer = setInterval(() => setDateStr(fmt()), 1000);
    return () => clearInterval(timer);
  }, []);

  // FIX: memory leak — collect every setTimeout ID so we can cancel them all
  // if the component unmounts before all feeds have become visible.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          LIVE_FEEDS.forEach((feed) => {
            const id = setTimeout(
              () => setVisible((v) => [...v, feed.id]),
              feed.delay
            );
            timeoutIds.push(id);
          });
        }
      },
      { threshold: 0.2 }
    );

    obs.observe(el);

    return () => {
      obs.disconnect();
      timeoutIds.forEach(clearTimeout); // cancel any pending timers
    };
  }, []);

  return (
    <div ref={containerRef} className="relative max-w-5xl mx-auto">
      {/* Monitor frame */}
      <div
        className="relative rounded-2xl border border-[#1e1b17] bg-[#050403] overflow-hidden"
        style={{ boxShadow: "0 0 80px rgba(201,168,83,0.06), 0 40px 120px rgba(0,0,0,0.6)" }}
      >
        {/* Scan line effect */}
        <div className="scan-line" />

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#100e0b] bg-[#060504]">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex items-center gap-2 ml-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className="font-mono text-[11px] text-[#52473a] tracking-widest">
                XANTHRA HORIZON · LIVE
              </span>
            </div>
          </div>

          {/* FIX: suppressHydrationWarning as belt-and-suspenders; real guard is
              the empty initial state above. The span is blank during SSR and
              fills in on first client paint — no mismatch, no flash. */}
          <div className="font-mono text-[11px] text-[#2a2318]"
            suppressHydrationWarning
          >
            {dateStr}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_280px] gap-0">
          {/* Left: live feed */}
          <div className="p-5 border-r border-[#100e0b] min-h-[420px]">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[10px] text-[#52473a] tracking-widest uppercase">
                Ingest Stream
              </span>
              <div className="flex-1 h-px bg-[#100e0b]" />
              <span className="font-mono text-[10px] text-[#2a2318]">
                {visible.length}/{LIVE_FEEDS.length}
              </span>
            </div>

            <div className="space-y-2">
              {LIVE_FEEDS.map((feed) => {
                const show = visible.includes(feed.id);
                return (
                  <div
                    key={feed.id}
                    className="flex items-start gap-3 p-3 rounded-lg transition-all duration-500"
                    style={{
                      opacity: show ? 1 : 0,
                      transform: show ? "translateX(0)" : "translateX(-16px)",
                      background: show ? "rgba(255,255,255,0.02)" : "transparent",
                      border: `1px solid ${show ? "#1e1b17" : "transparent"}`,
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: feed.color, boxShadow: `0 0 6px ${feed.color}` }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: `${feed.color}18`, color: feed.color }}
                        >
                          {feed.type}
                        </span>
                        <span className="text-[11px] text-[#52527a]">{feed.source}</span>
                      </div>
                      <p className="text-[13px] text-[#8a8070] leading-snug truncate">
                        {feed.label}
                      </p>
                    </div>
                    {show && (
                      <span className="font-mono text-[10px] text-[#2a2318] flex-shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: metrics */}
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-[#52473a] tracking-widest uppercase">
                Pipeline Metrics
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {METRICS.map((m) => (
                <MetricBlock key={m.label} {...m} />
              ))}
            </div>

            {/* Status bar */}
            <div className="mt-auto p-3 rounded-xl border border-[#0f2a0f] bg-[#02100a]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="font-mono text-[10px] text-[#10b981] tracking-widest">
                  PIPELINE READY
                </span>
              </div>
              <div className="space-y-1">
                {["Ingest", "Dedupe", "Rank", "Synthesize", "Deliver"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-[#0a1a0a] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#10b981]"
                        style={{ width: "100%", opacity: 0.6 + i * 0.08 }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-[#1a4a1a] w-14">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
