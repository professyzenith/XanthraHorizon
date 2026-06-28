import CustomCursor        from "@/components/CustomCursor";
import FloatingParticles   from "@/components/FloatingParticles";
import NetworkOrb          from "@/components/NetworkOrb";
import AnimatedTimeline    from "@/components/AnimatedTimeline";
import CommandCenter       from "@/components/CommandCenter";
import SignatureSection    from "@/components/SignatureSection";
import SubscribeForm       from "@/components/SubscribeForm";
import AnimatedSection     from "@/components/AnimatedSection";
import InteractiveBriefing from "@/components/InteractiveBriefing";
import HorizonReveal       from "@/components/HorizonReveal";
import GlobalSyncPrelude   from "@/components/GlobalSyncPrelude";

// ─── Marquee ticker ─────────────────────────────────────────────────────────────
const TICKER = [
  { text: "ChatGPT adds memory — your AI now knows you",             tag: "FEATURE",  color: "#c9a853" },
  { text: "AI matches specialist doctors in diagnosing rare disease", tag: "HEALTH",   color: "#10b981" },
  { text: "Google unveils AI that watches your screen and helps",     tag: "PRODUCT",  color: "#0f9388" },
  { text: "Half of Fortune 500 companies now use AI daily",           tag: "BUSINESS", color: "#d4875a" },
  { text: "OpenAI cuts prices 80% — third reduction this year",       tag: "ECONOMY",  color: "#f43f5e" },
  { text: "EU AI Act reshapes how 450 million people use technology", tag: "POLICY",   color: "#e8c56d" },
  { text: "Meta releases AI that works on your phone without internet", tag: "PRODUCT", color: "#0f9388" },
  { text: "Apple Intelligence arrives on 2 billion devices worldwide", tag: "PRODUCT", color: "#0f9388" },
  { text: "AI-written code is now 30% of output at major companies",  tag: "WORK",    color: "#d4875a" },
  { text: "New AI generates a full film from a text description",     tag: "CREATIVE", color: "#ec4899" },
];

// ─── Problem / Solution comparison ──────────────────────────────────────────────
const OLD_WAY = [
  "Check Twitter and Reddit for AI news",
  "Open 4–6 different newsletters",
  "Watch YouTube explainer videos",
  "Browse LinkedIn posts",
  "Visit company blogs one by one",
  "45 minutes later — still unsure what matters",
];

const NEW_WAY = [
  "One email at the time you choose",
  "7 stories, ranked by actual importance",
  "Every story explained in plain English",
  "Know exactly what happened and why it matters",
  "No ads, no scrolling, no noise",
  "Free forever — takes 7 minutes to read",
];

// ─── Source logos ────────────────────────────────────────────────────────────────
const SOURCES = [
  { n: "OpenAI",     c: "#10b981" },
  { n: "Google AI",  c: "#0f9388" },
  { n: "Reuters",    c: "#c9a853" },
  { n: "BBC Tech",   c: "#d4875a" },
  { n: "TechCrunch", c: "#e8c56d" },
  { n: "Meta AI",    c: "#f43f5e" },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#060504] text-[#8a8070] overflow-x-hidden">

      {/* ── Atmosphere ── */}
      <div className="aurora-bg" />
      <div className="noise-overlay" />
      <FloatingParticles />
      <CustomCursor />

      {/* ── Global sync prelude (2 s) — sits at z-201 above HorizonReveal z-200.
           Both mount together. Prelude fades; HorizonReveal continues beneath. */}
      <GlobalSyncPrelude />

      {/* ── Cinematic intro — renders above the page, fades away after 4-5 s ── */}
      <HorizonReveal />

      {/* ════════════════════════════════════════
          ANNOUNCEMENT BAR
      ════════════════════════════════════════ */}
      <div className="announce-bar hero-entrance hero-entrance-d1 relative z-20 w-full py-2.5 px-6 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 glow-pulse" />
          <span className="text-[11px] font-mono text-[#52473a] tracking-widest">
            XANTHRA HORIZON · LIVE
          </span>
        </div>
        <span className="hidden sm:block text-[#1a1712] text-[10px]">·</span>
        <span className="hidden sm:block text-[11px] text-[#3a3020]">
          Free forever · No credit card · Unsubscribe anytime
        </span>
      </div>

      {/* ════════════════════════════════════════
          NAV
      ════════════════════════════════════════ */}
      <nav className="hero-entrance hero-entrance-d2 relative z-20 flex items-center justify-between px-6 sm:px-12 py-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden"
            style={{ background: "linear-gradient(135deg,#c9a853,#d4875a)", boxShadow: "0 0 24px rgba(201,168,83,0.45)" }}>
            <svg className="w-4 h-4 text-white absolute inset-0 m-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="font-semibold text-[#f0ece3] text-sm tracking-[-0.01em]">
            Xanthra Horizon
          </span>
        </div>
        <a href="#subscribe" data-hover="true"
          className="relative group flex items-center gap-1.5 text-xs font-medium text-[#8a8070] hover:text-[#f0ece3] transition-all px-5 py-2.5 rounded-full border border-[#1e1b17] hover:border-amber-500/40 bg-[#080604]/70 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-soft" />
          Start reading free
          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </nav>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative z-10 min-h-[88vh] flex items-center max-w-[1400px] mx-auto px-6 sm:px-12 pt-4 pb-20">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 xl:gap-20 items-center w-full">

          {/* Left */}
          <div className="flex flex-col">
            <AnimatedSection delay={0}>
              <div className="hero-entrance hero-entrance-d3 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-amber-500/15 bg-amber-500/5 w-fit mb-10 badge-glow">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-soft" />
                <span className="text-[11px] font-medium tracking-widest text-amber-300/70 uppercase">
                  Free · Daily · For Everyone
                </span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={60}>
              <div className="hero-entrance hero-entrance-d4">
              <h1 className="text-[52px] sm:text-[68px] xl:text-[80px] font-bold leading-[0.95] tracking-[-0.04em] text-[#f0ece3] mb-4">
                Xanthra<br />
                Horizon
              </h1>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] mb-8">
                <span className="gradient-text">Know What Matters Next.</span>
              </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={140}>
              <p className="text-[17px] text-[#6b5f4a] leading-[1.7] max-w-[480px] mb-12 font-light">
                Stay ahead of the world&apos;s most important AI developments.
                Receive your free Daily Intelligence Brief — the news, breakthroughs,
                and trends that actually matter.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="flex items-center gap-10 mb-12">
                {[
                  { val: "600+", label: "Sources scanned" },
                  { val: "7",    label: "Stories per day" },
                  { val: "∞",    label: "Free forever"    },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col gap-1">
                    <span className="text-3xl font-bold text-[#f0ece3] tracking-tight counter-glow">{s.val}</span>
                    <span className="text-xs text-[#3a3020]">{s.label}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={240}>
              <div className="hero-entrance hero-entrance-d5">
              <a href="#subscribe" data-hover="true"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-[15px] text-[#1a1208] mb-10 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #c9a853 0%, #d4875a 50%, #c09040 100%)",
                  boxShadow: "0 0 0 1px rgba(201,168,83,0.5), 0 12px 40px rgba(212,135,90,0.25)",
                }}>
                Get My Free Edition
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={290}>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((s) => (
                  <span key={s.n}
                    className="flex items-center gap-1.5 text-[11px] text-[#52473a] px-3 py-1.5 rounded-full border border-[#1e1b17] bg-[#060504]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.c }} />
                    {s.n}
                  </span>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Right — Orb */}
          <AnimatedSection delay={150} className="relative flex justify-center lg:justify-end items-center">
            <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-12 pointer-events-none"
              style={{ background: "radial-gradient(circle, #c9a853 0%, #d4875a 40%, #0f9388 80%, transparent 100%)" }} />
            <NetworkOrb />

            {/* Floating sample story card */}
            <div className="float-card absolute bottom-4 left-0 sm:left-4 max-w-[260px] glass border border-amber-500/10 rounded-2xl p-4"
              style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,83,0.10)" }}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400/70 tracking-widest uppercase">Story #1 Today</span>
              </div>
              <p className="text-[13px] text-[#f0ece3] font-semibold leading-snug mb-1.5">
                ChatGPT now remembers everything about you
              </p>
              <p className="text-[11px] text-[#52473a] mb-2">OpenAI · 2h ago</p>
              <div className="h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent mb-2" />
              <p className="text-[10px] text-[#52473a] leading-relaxed line-clamp-2">
                Why it matters: AI just became a true personal assistant, not just a search tool.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════
          MARQUEE TICKER
      ════════════════════════════════════════ */}
      <div className="relative z-10 py-5 border-y border-[#100e0b]">
        <div className="marquee-wrap">
          <div className="marquee-track">
            {[...TICKER, ...TICKER].map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-8 whitespace-nowrap">
                <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 rounded border"
                  style={{ color: item.color, background: `${item.color}12`, borderColor: `${item.color}30` }}>
                  {item.tag}
                </span>
                <span className="text-[13px] text-[#3a3020]">{item.text}</span>
                <span className="text-[#1a1712] text-lg select-none">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          EMAIL PREVIEW
      ════════════════════════════════════════ */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 py-36">
        <AnimatedSection className="mb-16 text-center">
          <span className="font-mono text-[10px] text-amber-600 tracking-[0.2em] uppercase block mb-4">
            What You Get
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-[#f0ece3] tracking-[-0.03em] leading-tight mb-5">
            Your daily Horizon<br />
            <span className="gradient-text">in your inbox.</span>
          </h2>
          <p className="text-base text-[#6b5f4a] font-light leading-relaxed max-w-lg mx-auto">
            7 stories. Plain English. Every development that matters — explained clearly,
            with a &ldquo;Why It Matters&rdquo; for each story.
            Takes 7 minutes. Changes how informed you feel.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={100}>
          <InteractiveBriefing />
        </AnimatedSection>

        <AnimatedSection delay={200} className="mt-10 flex justify-center">
          <a href="#subscribe" data-hover="true"
            className="inline-flex items-center gap-2 text-[13px] text-amber-600 hover:text-amber-500 transition-colors">
            <span>Join Xanthra Horizon</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </AnimatedSection>
      </section>

      <div className="section-divider max-w-[1400px] mx-auto px-12" />

      {/* ════════════════════════════════════════
          COMPARISON
      ════════════════════════════════════════ */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 py-36">
        <AnimatedSection className="mb-16">
          <div className="max-w-xl">
            <span className="font-mono text-[10px] text-teal-500 tracking-[0.2em] uppercase block mb-4">
              Why It Exists
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#f0ece3] tracking-[-0.03em] leading-tight mb-5">
              AI news is everywhere.<br />
              <span className="gradient-text">None of it is for you.</span>
            </h2>
            <p className="text-base text-[#6b5f4a] font-light leading-relaxed">
              Most people who want to follow AI end up checking 5 or 6 different
              sources every day. It takes nearly an hour. And they still feel behind.
              We fix that.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl">
          {/* Old way */}
          <AnimatedSection delay={60}>
            <div className="h-full rounded-2xl border border-[#1e1b17] bg-[#040302] p-8"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-3 mb-7">
                <div className="w-8 h-8 rounded-lg bg-[#0e0c0a] border border-[#1e1b17] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#3a3020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-[13px] font-semibold text-[#3a3020]">How most people try to keep up</p>
              </div>
              <div className="space-y-4">
                {OLD_WAY.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 bg-rose-500/8 border border-rose-500/15">
                      <svg className="w-2.5 h-2.5 text-rose-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className={`text-[13px] leading-snug ${i === OLD_WAY.length - 1 ? "text-rose-400/60 italic" : "text-[#3a3020]"}`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* New way */}
          <AnimatedSection delay={160}>
            <div className="h-full rounded-2xl border border-amber-500/20 bg-[#040302] p-8 relative overflow-hidden"
              style={{ boxShadow: "0 0 60px rgba(201,168,83,0.07), inset 0 1px 0 rgba(201,168,83,0.12)" }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,83,0.6), rgba(15,147,136,0.3), transparent)" }} />

              <div className="flex items-center gap-3 mb-7">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#c9a853,#d4875a)", boxShadow: "0 0 16px rgba(201,168,83,0.35)" }}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <p className="text-[13px] font-semibold text-[#f0ece3]">After one subscription</p>
              </div>
              <div className="space-y-4">
                {NEW_WAY.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 bg-emerald-500/10 border border-emerald-500/25">
                      <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className={`text-[13px] leading-snug ${i === NEW_WAY.length - 1 ? "text-emerald-400/80 italic" : "text-[#8a8070]"}`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SUBSCRIBE
      ════════════════════════════════════════ */}
      <section id="subscribe" className="relative z-10 max-w-[560px] mx-auto px-6 sm:px-12 pb-36">
        <AnimatedSection>
          <div className="shimmer-border">
            <div className="relative rounded-[20px] bg-[#060504] border border-[#1e1b17] p-8 sm:p-10 overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,83,0.6), rgba(15,147,136,0.3), transparent)" }} />
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-[#f0ece3] tracking-tight mb-2">
                  Join Xanthra Horizon
                </h2>
                <p className="text-sm text-[#3a3020]">Choose your time. We handle everything else.</p>
              </div>
              <SubscribeForm />
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ════════════════════════════════════════
          COMMAND CENTER
      ════════════════════════════════════════ */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 pb-36">
        <AnimatedSection className="mb-16">
          <div className="max-w-xl">
            <span className="font-mono text-[10px] text-teal-500 tracking-[0.2em] uppercase block mb-4">
              Behind the Scenes
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#f0ece3] tracking-[-0.03em] leading-tight mb-5">
              Watch it happen<br />
              <span className="gradient-text">in real time.</span>
            </h2>
            <p className="text-base text-[#6b5f4a] font-light leading-relaxed max-w-lg">
              Every morning the pipeline fires: hundreds of sources ingested, most discarded,
              seven stories elevated. This is the intelligence engine behind Xanthra Horizon.
            </p>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <CommandCenter />
        </AnimatedSection>
      </section>

      {/* ════════════════════════════════════════
          SIGNATURE
      ════════════════════════════════════════ */}
      <SignatureSection />

      {/* ════════════════════════════════════════
          TIMELINE
      ════════════════════════════════════════ */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 py-36">
        <AnimatedSection className="mb-20">
          <div className="max-w-xl">
            <span className="font-mono text-[10px] text-amber-600 tracking-[0.2em] uppercase block mb-4">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-[#f0ece3] tracking-[-0.03em] leading-tight mb-5">
              Five steps.<br />
              <span className="gradient-text">Zero effort.</span>
            </h2>
            <p className="text-base text-[#6b5f4a] font-light leading-relaxed">
              From hundreds of sources to your inbox — fully automated,
              every single morning, without you lifting a finger.
            </p>
          </div>
        </AnimatedSection>
        <AnimatedTimeline />
      </section>

      {/* ════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════ */}
      <section className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 pb-36">
        <AnimatedSection>
          <div className="relative rounded-3xl overflow-hidden border border-[#1e1b17] bg-[#040302] p-12 sm:p-20 text-center">
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full blur-[100px] opacity-10"
              style={{ background: "#c9a853", transform: "translate(-40%,-40%)" }} />
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full blur-[100px] opacity-7"
              style={{ background: "#0f9388", transform: "translate(40%,40%)" }} />
            <div className="absolute top-0 inset-x-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,168,83,0.5) 30%, rgba(15,147,136,0.4) 70%, transparent 100%)" }} />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/15 bg-amber-500/5 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-soft" />
                <span className="text-[11px] font-medium text-amber-300/70 tracking-widest uppercase">
                  Free forever · No card needed · Cancel anytime
                </span>
              </div>

              <h2 className="text-5xl sm:text-6xl font-bold text-[#f0ece3] tracking-[-0.04em] leading-none mb-6">
                Xanthra Horizon.<br />
                <span className="gradient-text">Know what matters next.</span>
              </h2>

              <p className="text-[#6b5f4a] text-lg font-light mb-12 max-w-md mx-auto leading-relaxed">
                Stay informed without the overwhelm. Configure once.
                Your Daily Intelligence Brief arrives every morning without you
                lifting a finger.
              </p>

              <div className="max-w-md mx-auto">
                <SubscribeForm />
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-[#100e0b] px-6 sm:px-12 py-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#c9a853,#d4875a)" }}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-xs text-[#3a3020]">Xanthra Horizon</span>
          </div>
          <p className="text-xs text-[#1e1b14]">
            &copy; {new Date().getFullYear()} Xanthra Horizon. Made with care.
          </p>
          <div className="flex gap-6 text-xs text-[#3a3020]">
            <a href="/privacy" className="hover:text-[#8a8070] transition-colors">Privacy</a>
            <a href="/unsubscribe" className="hover:text-[#8a8070] transition-colors">Unsubscribe</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
