"use client";

import { useState, useRef, useEffect } from "react";

/* ─── Category definitions ─────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: "bug",      label: "Bug Report",       icon: "🐛", color: "#f43f5e" },
  { id: "delivery", label: "Delivery Issue",    icon: "📬", color: "#d4875a" },
  { id: "feature",  label: "Feature Request",   icon: "💡", color: "#c9a853" },
  { id: "account",  label: "Account Issue",     icon: "👤", color: "#0f9388" },
  { id: "other",    label: "Other",             icon: "💬", color: "#8a8070" },
] as const;

type Step = "closed" | "category" | "form" | "success";

export default function SupportWidget() {
  const [step, setStep] = useState<Step>("closed");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (step !== "closed") setStep("closed");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [step]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && step !== "closed") setStep("closed");
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [step]);

  const reset = () => {
    setCategory("");
    setEmail("");
    setSubject("");
    setMessage("");
    setError("");
    setSending(false);
  };

  const handleSubmit = async () => {
    if (!email || !subject || !message) {
      setError("All fields are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, category, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSending(false);
        return;
      }
      setStep("success");
      setSending(false);
    } catch {
      setError("Network error. Please try again.");
      setSending(false);
    }
  };

  const isOpen = step !== "closed";
  const catInfo = CATEGORIES.find((c) => c.id === category);

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-[100]" style={{ fontFamily: "Inter, -apple-system, sans-serif" }}>

      {/* ── Floating panel ── */}
      <div
        className="transition-all duration-300 ease-out origin-bottom-right"
        style={{
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.92) translateY(12px)",
          pointerEvents: isOpen ? "auto" : "none",
          position: "absolute",
          bottom: 68,
          right: 0,
          width: 380,
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "#0a0908",
            border: "1px solid #1e1b17",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,83,0.08), 0 0 60px rgba(201,168,83,0.04)",
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{
              background: "linear-gradient(135deg, #0d0b09 0%, #110f0c 100%)",
              borderBottom: "1px solid #1a1712",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #c9a853, #d4875a)",
                  boxShadow: "0 0 16px rgba(201,168,83,0.3)",
                }}
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#f0ece3]">Support</p>
                <p className="text-[10px] text-[#52473a]">We typically respond within 24h</p>
              </div>
            </div>
            <button
              onClick={() => { setStep("closed"); reset(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#1a1712] transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-[#52473a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Step: Category Selection ── */}
          {step === "category" && (
            <div className="p-5">
              <p className="text-[11px] font-mono text-[#52473a] tracking-widest uppercase mb-4">
                What can we help with?
              </p>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id); setStep("form"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left group"
                    style={{
                      background: "#080604",
                      border: "1px solid #1a1712",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${cat.color}40`;
                      e.currentTarget.style.background = `${cat.color}08`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#1a1712";
                      e.currentTarget.style.background = "#080604";
                    }}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-[13px] font-medium text-[#c4b89a] group-hover:text-[#f0ece3] transition-colors">
                      {cat.label}
                    </span>
                    <svg className="w-3 h-3 text-[#3a3020] ml-auto group-hover:text-[#8a8070] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step: Form ── */}
          {step === "form" && (
            <div className="p-5">
              {/* Back + category badge */}
              <div className="flex items-center gap-2 mb-5">
                <button
                  onClick={() => setStep("category")}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-[#1a1712] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#52473a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {catInfo && (
                  <span
                    className="text-[10px] font-mono tracking-wide px-2.5 py-1 rounded-full"
                    style={{
                      color: catInfo.color,
                      background: `${catInfo.color}12`,
                      border: `1px solid ${catInfo.color}30`,
                    }}
                  >
                    {catInfo.icon} {catInfo.label}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {/* Email */}
                <div>
                  <label className="block text-[10px] font-mono text-[#52473a] tracking-widest uppercase mb-1.5">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-[13px] rounded-lg outline-none transition-colors placeholder:text-[#2a2318]"
                    style={{
                      background: "#080604",
                      border: "1px solid #1a1712",
                      color: "#c4b89a",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#c9a85340")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1712")}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[10px] font-mono text-[#52473a] tracking-widest uppercase mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    maxLength={200}
                    className="w-full px-3.5 py-2.5 text-[13px] rounded-lg outline-none transition-colors placeholder:text-[#2a2318]"
                    style={{
                      background: "#080604",
                      border: "1px solid #1a1712",
                      color: "#c4b89a",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#c9a85340")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1712")}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[10px] font-mono text-[#52473a] tracking-widest uppercase mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what happened..."
                    maxLength={2000}
                    rows={4}
                    className="w-full px-3.5 py-2.5 text-[13px] rounded-lg outline-none transition-colors resize-none placeholder:text-[#2a2318]"
                    style={{
                      background: "#080604",
                      border: "1px solid #1a1712",
                      color: "#c4b89a",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#c9a85340")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1712")}
                  />
                  <p className="text-right text-[10px] text-[#2a2318] mt-1">{message.length}/2000</p>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-[12px] text-rose-400 px-1">{error}</p>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                  style={{
                    background: sending
                      ? "#1a1712"
                      : "linear-gradient(135deg, #c9a853 0%, #d4875a 50%, #c09040 100%)",
                    color: sending ? "#52473a" : "#1a1208",
                    boxShadow: sending
                      ? "none"
                      : "0 0 0 1px rgba(201,168,83,0.5), 0 8px 24px rgba(212,135,90,0.2)",
                    cursor: sending ? "not-allowed" : "pointer",
                  }}
                >
                  {sending ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#52473a] border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Ticket
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === "success" && (
            <div className="p-8 text-center">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #0f9388 100%)",
                  boxShadow: "0 0 30px rgba(16,185,129,0.25)",
                }}
              >
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#f0ece3] mb-2">Ticket Submitted</h3>
              <p className="text-[13px] text-[#6b5f4a] leading-relaxed mb-6">
                We&apos;ve received your message and will get back to you within 24 hours.
              </p>
              <button
                onClick={() => { setStep("closed"); reset(); }}
                className="px-6 py-2.5 rounded-xl text-[13px] font-medium text-[#c4b89a] transition-colors"
                style={{
                  background: "#0e0c0a",
                  border: "1px solid #1e1b17",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#c9a85340")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1b17")}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── FAB (Floating Action Button) ── */}
      <button
        id="support-widget-trigger"
        onClick={() => {
          if (step === "closed") {
            setStep("category");
            reset();
          } else {
            setStep("closed");
            reset();
          }
        }}
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group"
        style={{
          background: isOpen
            ? "#1a1712"
            : "linear-gradient(135deg, #c9a853 0%, #d4875a 50%, #c09040 100%)",
          boxShadow: isOpen
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 4px 30px rgba(201,168,83,0.3), 0 0 0 1px rgba(201,168,83,0.4)",
        }}
        aria-label="Open support"
      >
        {/* Chat icon / Close icon transition */}
        <svg
          className="w-6 h-6 transition-transform duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke={isOpen ? "#52473a" : "#1a1208"}
          strokeWidth={2}
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0)" }}
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          ) : (
            <>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </>
          )}
        </svg>

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span
            className="absolute inset-0 rounded-2xl animate-ping"
            style={{
              background: "rgba(201,168,83,0.15)",
              animationDuration: "3s",
            }}
          />
        )}
      </button>
    </div>
  );
}
