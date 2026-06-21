"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function UnsubscribeContent() {
  const params = useSearchParams();
  const router = useRouter();

  const status = params.get("status");
  const id     = params.get("id");
  const token  = params.get("token");

  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  // ── Already unsubscribed (redirected here after successful POST) ────────────
  if (status === "success") {
    return (
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#f0ece3] mb-3 tracking-tight">
          You&apos;ve been unsubscribed.
        </h1>
        <p className="text-[#6b5f4a] text-sm leading-relaxed mb-8">
          You won&apos;t receive any more emails from Xanthra Horizon.
          You can re-subscribe anytime from the homepage.
        </p>
        <Link href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#1a1208]"
          style={{ background: "linear-gradient(135deg, #c9a853, #d4875a)" }}>
          Back to Xanthra Horizon
        </Link>
      </div>
    );
  }

  // ── Valid signed link: id + token both present ──────────────────────────────
  if (id && token) {
    async function handleUnsubscribe() {
      setState("loading");
      setErrMsg("");
      try {
        const res = await fetch("/api/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, token }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setState("error");
          setErrMsg(data.error ?? "Something went wrong. Please try again.");
          return;
        }
        router.replace("/unsubscribe?status=success");
      } catch {
        setState("error");
        setErrMsg("Network error. Please check your connection and try again.");
      }
    }

    return (
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
          <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#f0ece3] mb-3 tracking-tight">
          Unsubscribe from Xanthra Horizon?
        </h1>
        <p className="text-[#6b5f4a] text-sm leading-relaxed mb-8">
          You&apos;ll stop receiving your Daily Intelligence Brief.
          You can re-subscribe anytime.
        </p>

        {state === "error" && (
          <p className="text-rose-400 text-sm mb-4">{errMsg}</p>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleUnsubscribe}
            disabled={state === "loading"}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state === "loading" ? "Unsubscribing…" : "Yes, unsubscribe me"}
          </button>
          <Link href="/"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-[#1a1208]"
            style={{ background: "linear-gradient(135deg, #c9a853, #d4875a)" }}>
            Keep my subscription
          </Link>
        </div>
      </div>
    );
  }

  // ── Fallback: missing id, token, or old-format link ─────────────────────────
  return (
    <div className="text-center max-w-md">
      <h1 className="text-2xl font-bold text-[#f0ece3] mb-3 tracking-tight">
        Invalid unsubscribe link.
      </h1>
      <p className="text-[#6b5f4a] text-sm leading-relaxed mb-8">
        This link may have expired or is malformed.
        If you need help, reply to any Xanthra Horizon email.
      </p>
      <Link href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#1a1208]"
        style={{ background: "linear-gradient(135deg, #c9a853, #d4875a)" }}>
        Back to homepage
      </Link>
    </div>
  );
}
