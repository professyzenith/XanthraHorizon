"use client";
import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    num: "01",
    title: "Ingest",
    subtitle: "Hundreds of sources, every 24 hours",
    desc: "Every morning before you wake, our pipeline crawls the world's top AI sources — company announcements, major news outlets, research publications, and community discussions. Hundreds of articles collected before you've had your first coffee.",
    color: "#c9a853",
    glow: "rgba(201,168,83,0.35)",
    metric: "600+ articles",
    metricLabel: "scanned daily",
  },
  {
    num: "02",
    title: "Deduplicate",
    subtitle: "Each story, exactly once",
    desc: "The same story covered by thirty different outlets becomes one clean signal. Every article is fingerprinted and compared. Duplicates removed automatically. No repetition, no filler, no noise — just the unique developments that matter.",
    color: "#d4875a",
    glow: "rgba(212,135,90,0.35)",
    metric: "~85%",
    metricLabel: "noise eliminated",
  },
  {
    num: "03",
    title: "Rank",
    subtitle: "Only what actually matters rises",
    desc: "A scoring system weighs each story on recency, source credibility, real-world impact, and how widely it's being covered. Only the 7 most significant developments make the cut — regardless of how loudly they were promoted.",
    color: "#e8c56d",
    glow: "rgba(232,197,109,0.35)",
    metric: "Top 7",
    metricLabel: "stories selected",
  },
  {
    num: "04",
    title: "Synthesize",
    subtitle: "Explained clearly, in seconds",
    desc: "Artificial intelligence reads all 7 stories and writes what you actually need: a plain-English summary of what happened, a paragraph on why it matters to you personally, and a big-picture overview of what the day means.",
    color: "#0f9388",
    glow: "rgba(15,147,136,0.35)",
    metric: "<2s",
    metricLabel: "to write your briefing",
  },
  {
    num: "05",
    title: "Deliver",
    subtitle: "Your timezone. Your chosen time.",
    desc: "At the exact time you chose — whether you're in Mumbai, Milan, or Miami — your briefing arrives. A beautifully formatted email. No ads, no sponsored content, no trackers. Just intelligence, on your schedule.",
    color: "#c9a853",
    glow: "rgba(201,168,83,0.35)",
    metric: "10:00 AM",
    metricLabel: "your local time",
  },
];

export default function AnimatedTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Fill the timeline line based on scroll
    function onScroll() {
      if (!containerRef.current || !lineRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      const progress = Math.max(0, Math.min(1,
        (windowH * 0.6 - rect.top) / (rect.height - windowH * 0.4)
      ));
      lineRef.current.style.height = `${progress * 100}%`;

      // Determine active step
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top < windowH * 0.6) setActiveStep(i);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} className="relative max-w-4xl mx-auto">
      {/* Vertical track */}
      <div className="absolute left-[28px] sm:left-[42px] top-0 bottom-0 w-px bg-[#1a1a2e]">
        <div ref={lineRef} className="timeline-line-fill w-full" style={{ height: "0%" }} />
      </div>

      <div className="space-y-0">
        {STEPS.map((step, i) => {
          const isActive = activeStep >= i;
          return (
            <div
              key={step.num}
              ref={(el) => { stepRefs.current[i] = el; }}
              className="relative flex gap-8 sm:gap-14 pb-16 sm:pb-20 group"
            >
              {/* Node on the line */}
              <div className="relative flex-shrink-0 flex flex-col items-center" style={{ width: 56 }}>
                <div
                  className="relative w-[56px] h-[56px] sm:w-[84px] sm:h-[84px] -ml-[0px] sm:-ml-[14px] rounded-full flex items-center justify-center transition-all duration-700"
                  style={{
                    background: isActive
                      ? `radial-gradient(circle, ${step.glow} 0%, rgba(3,3,10,0.95) 70%)`
                      : "rgba(3,3,10,0.95)",
                    border: `1px solid ${isActive ? step.color : "#1a1a2e"}`,
                    boxShadow: isActive ? `0 0 30px ${step.glow}, 0 0 60px ${step.glow.replace("0.35","0.12")}` : "none",
                    transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
                  }}
                >
                  {/* Pulse rings when active */}
                  {isActive && (
                    <>
                      <div className="pulse-ring" style={{ borderColor: step.color.replace(")", ",0.3)").replace("#","rgba(").padEnd(20) }} />
                      <div className="pulse-ring pulse-ring-2" style={{ borderColor: step.color.replace(")", ",0.2)").replace("#","rgba(").padEnd(20) }} />
                    </>
                  )}
                  <span
                    className="font-mono text-sm sm:text-base font-bold"
                    style={{ color: isActive ? step.color : "#2d2d50" }}
                  >
                    {step.num}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div
                className="flex-1 pt-3 sm:pt-5"
                style={{
                  opacity: isActive ? 1 : 0.3,
                  transform: isActive ? "translateX(0)" : "translateX(20px)",
                  transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight"
                    style={{ color: isActive ? "#eeeef8" : "#3a3a5a" }}>
                    {step.title}
                  </h3>
                  <span className="font-mono text-xs" style={{ color: step.color, opacity: isActive ? 0.7 : 0.2 }}>
                    {step.subtitle}
                  </span>
                </div>

                <p className="text-sm sm:text-base leading-relaxed mb-5 max-w-lg"
                  style={{ color: isActive ? "#8888aa" : "#2a2a40" }}>
                  {step.desc}
                </p>

                {/* Metric chip */}
                {isActive && (
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{
                      background: `${step.color}14`,
                      border: `1px solid ${step.color}33`,
                      color: step.color,
                    }}
                  >
                    <span className="text-base font-bold">{step.metric}</span>
                    <span className="text-xs opacity-70 font-normal">{step.metricLabel}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
