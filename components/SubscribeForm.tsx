"use client";
import { useState, FormEvent } from "react";
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

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2,"0")} ${ap}`;
}

type State = "idle" | "loading" | "success" | "error";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [time, setTime] = useState("10:00");
  const [tz, setTz] = useState("Asia/Kolkata");
  const [topics, setTopics] = useState<Topic[]>(["ai_tech"]);
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  function toggleTopic(id: Topic) {
    setTopics(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(t => t !== id) : prev // must keep at least 1
        : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), delivery_time: time, timezone: tz, topics }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setState("error");
        setMsg(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setState("success");
      setMsg(data.message ?? "You're subscribed!");
      setEmail("");
    } catch {
      setState("error");
      setMsg("Network error. Please check your connection.");
    }
  }

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

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Email */}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        disabled={state === "loading"}
        className="w-full px-4 py-3.5 bg-[#0c0a08] border border-[#221e19] rounded-xl text-[#f0ece3] placeholder-[#2a2318] text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50 hover:border-[#2a2318]"
      />

      {/* Topic Selector */}
      <div>
        <p className="text-[11px] text-[#52473a] uppercase tracking-widest mb-2 font-medium">
          Choose your topics
        </p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(t => {
            const active = topics.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTopic(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 border"
                style={
                  active
                    ? {
                        background: "rgba(201,168,83,0.15)",
                        borderColor: "rgba(201,168,83,0.5)",
                        color: "#c9a853",
                      }
                    : {
                        background: "transparent",
                        borderColor: "#1e1b17",
                        color: "#52473a",
                      }
                }
              >
                {TopicIcons[t.id]}
                {t.label}
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
          <>
            Gain Access ➔
          </>
        )}
      </MagneticButton>

      <p className="text-center text-xs text-[#52473a]">
        Secure delivery · Zero spam · Unsubscribe anytime
      </p>
    </form>
  );
}
