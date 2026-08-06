"use client";
import { useState, FormEvent } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import MagneticButton from "./MagneticButton";
import { Topic } from "@/types";

const TIMEZONES = [
  { label: "India (IST)", value: "Asia/Kolkata" },
  { label: "US Eastern (ET)", value: "America/New_York" },
  { label: "US Pacific (PT)", value: "America/Los_Angeles" },
  { label: "US Central (CT)", value: "America/Chicago" },
  { label: "UK (GMT/BST)", value: "Europe/London" },
  { label: "Central Europe (CET)", value: "Europe/Berlin" },
  { label: "UAE (GST)", value: "Asia/Dubai" },
  { label: "Singapore (SGT)", value: "Asia/Singapore" },
  { label: "Japan (JST)", value: "Asia/Tokyo" },
  { label: "Australia Sydney", value: "Australia/Sydney" },
  { label: "Brazil São Paulo", value: "America/Sao_Paulo" },
  { label: "UTC", value: "UTC" },
];

const TIMES = [
  "00:00","01:00","02:00","03:00","04:00","05:00",
  "06:00","07:00","08:00","09:00","10:00","11:00",
  "12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00",
  "22:00","23:00",
];

const TopicIcons: Record<Topic, JSX.Element> = {
  ai_tech: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
  ),
  geopolitics: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  ),
  politics: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>
  ),
  business: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
  ),
  science: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
  ),
  sports: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 8v8m-8-8v8M6 20h12M6 4h12M4 12h16"/></svg>
  ),
  health: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
  ),
};

const TOPICS: { id: Topic; label: string }[] = [
  { id: "ai_tech",     label: "AI & Tech"    },
  { id: "geopolitics", label: "Geopolitics"  },
  { id: "politics",    label: "Politics"     },
  { id: "business",    label: "Business"     },
  { id: "science",     label: "Science"      },
  { id: "sports",      label: "Sports"       },
  { id: "health",      label: "Health"       },
];

// Only these topic IDs are currently live
const LIVE_TOPICS: Set<Topic> = new Set(["ai_tech", "geopolitics"]);

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2,"0")} ${ap}`;
}

type State = "idle" | "loading" | "success" | "error";

// ─── Google Sign-In Button ────────────────────────────────────────────────────
function GoogleSignInButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: "#fff",
        color: "#1a1a1a",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      {/* Google Logo SVG */}
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      {loading ? "Signing in…" : "Continue with Google"}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SubscribeForm() {
  const { data: session, status } = useSession();
  const [time, setTime] = useState("10:00");
  const [tz, setTz] = useState("Asia/Kolkata");
  const [topics, setTopics] = useState<Topic[]>(["ai_tech"]);
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");
  const [comingSoon, setComingSoon] = useState(false);

  const isAuthLoading = status === "loading";

  function showComingSoon() {
    setComingSoon(true);
    setTimeout(() => setComingSoon(false), 2200);
  }

  function toggleTopic(id: Topic) {
    if (!LIVE_TOPICS.has(id)) { showComingSoon(); return; }
    setTopics(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(t => t !== id) : prev
        : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.user?.email) return;
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          delivery_time: time,
          timezone: tz,
          topics,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setState("error");
        setMsg(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setState("success");
      setMsg(data.message ?? "You're subscribed!");
    } catch {
      setState("error");
      setMsg("Network error. Please check your connection.");
    }
  }

  // ── Success Screen ────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 mb-5">
          <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#f0ece3] mb-2">You&apos;re in the Horizon.</h3>
        <p className="text-sm text-[#8a8070] leading-relaxed max-w-xs mx-auto">{msg}</p>
      </div>
    );
  }

  const selectClass = "w-full px-3.5 py-3 bg-[#0c0a08] border border-[#221e19] rounded-xl text-[#c4b89a] text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer hover:border-[#2a2318]";

  // ── Step 1: Not signed in — show Google button ────────────────────────────
  if (!session) {
    return (
      <div className="space-y-4">
        {/* Coming Soon Toast */}
        {comingSoon && (
          <div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-medium"
            style={{
              background: "rgba(20,16,10,0.95)",
              border: "1px solid rgba(201,168,83,0.3)",
              color: "#c9a853",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Coming soon — stay tuned!
          </div>
        )}

        <p className="text-center text-xs text-[#52473a] mb-1">
          Sign in with Google to subscribe. No passwords needed.
        </p>
        <GoogleSignInButton loading={isAuthLoading} />
        <p className="text-center text-xs text-[#52473a]">
          Secure delivery · Zero spam · Unsubscribe anytime
        </p>
      </div>
    );
  }

  // ── Step 2: Signed in — show the preferences form ────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Signed-in user badge */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
      >
        {session.user?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-emerald-400 font-semibold">Verified with Google ✓</p>
          <p className="text-[11px] text-[#8a8070] truncate">{session.user?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="text-[10px] text-[#52473a] hover:text-[#8a8070] transition-colors"
        >
          Switch
        </button>
      </div>

      {/* Coming Soon Toast */}
      {comingSoon && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full text-sm font-medium"
          style={{
            background: "rgba(20,16,10,0.95)",
            border: "1px solid rgba(201,168,83,0.3)",
            color: "#c9a853",
            backdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Coming soon — stay tuned!
        </div>
      )}

      {/* Topic Selector */}
      <div>
        <p className="text-[11px] text-[#52473a] uppercase tracking-widest mb-2 font-medium">
          Choose your topics
        </p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(t => {
            const active = topics.includes(t.id);
            const locked = !LIVE_TOPICS.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTopic(t.id)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 border"
                style={
                  locked
                    ? { background: "transparent", borderColor: "#1a1714", color: "#302a22", cursor: "pointer" }
                    : active
                    ? { background: "rgba(201,168,83,0.15)", borderColor: "rgba(201,168,83,0.5)", color: "#c9a853" }
                    : { background: "transparent", borderColor: "#1e1b17", color: "#52473a" }
                }
              >
                {TopicIcons[t.id]}
                {t.label}
                {locked && (
                  <span
                    className="ml-0.5 text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(201,168,83,0.08)", color: "#3a3020", border: "1px solid #1e1b17" }}
                  >
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time + Timezone */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <select value={time} onChange={(e) => setTime(e.target.value)} disabled={state === "loading"} className={selectClass}>
            {TIMES.map((t) => <option key={t} value={t}>{fmt(t)}</option>)}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52473a] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="relative">
          <select value={tz} onChange={(e) => setTz(e.target.value)} disabled={state === "loading"} className={selectClass}>
            {TIMEZONES.map((z) => <option key={z.value} value={z.value}>{z.label}</option>)}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52473a] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Error */}
      {state === "error" && (
        <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/8 border border-rose-500/20 rounded-xl">
          <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-rose-400 text-sm">{msg}</p>
        </div>
      )}

      {/* CTA Button */}
      <MagneticButton
        type="submit"
        disabled={state === "loading"}
        className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #c9a853 0%, #d4875a 50%, #b8892a 100%)",
          boxShadow: "0 0 0 1px rgba(201,168,83,0.4), 0 8px 32px rgba(212,135,90,0.25)",
        } as React.CSSProperties}
      >
        {state === "loading" ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Subscribing…
          </>
        ) : (
          <>Gain Access ➔</>
        )}
      </MagneticButton>

      <p className="text-center text-xs text-[#52473a]">
        Secure delivery · Zero spam · Unsubscribe anytime
      </p>
    </form>
  );
}
