import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — Xanthra Horizon",
  description: "The page you were looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060504] flex items-center justify-center px-6">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(201,168,83,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-12">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#c9a853,#d4875a)",
              boxShadow: "0 0 24px rgba(201,168,83,0.3)",
            }}
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="font-semibold text-[#f0ece3] text-sm">Xanthra Horizon</span>
        </div>

        {/* 404 numeral */}
        <div
          className="text-[120px] font-bold leading-none tracking-tighter mb-4 select-none"
          style={{
            background: "linear-gradient(135deg, #c9a853 0%, #d4875a 60%, rgba(201,168,83,0.2) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>

        <h1 className="text-2xl font-bold text-[#f0ece3] tracking-tight mb-3">
          Page not found.
        </h1>
        <p className="text-[#6b5f4a] text-sm leading-relaxed mb-10">
          This page doesn&apos;t exist or has been moved. Head back to the
          homepage to stay informed.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-[#1a1208] transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #c9a853, #d4875a)",
            boxShadow: "0 0 0 1px rgba(201,168,83,0.4), 0 8px 32px rgba(212,135,90,0.2)",
          }}
        >
          Back to Xanthra Horizon
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
