import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Xanthra Horizon",
  description: "Xanthra Horizon Privacy Policy — what data we collect and how we use it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const effectiveDate = "June 2026";

  return (
    <div className="min-h-screen bg-[#060504] text-[#8a8070]">
      <div className="max-w-2xl mx-auto px-6 py-16 sm:py-24">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#52473a] hover:text-[#c9a853] transition-colors mb-12"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to Xanthra Horizon
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-6">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#c9a853,#d4875a)" }}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#f0ece3]">Xanthra Horizon</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#f0ece3] tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#52473a]">Effective date: {effectiveDate}</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">1. What We Collect</h2>
            <p>
              When you subscribe to Xanthra Horizon, we collect:
            </p>
            <ul className="mt-3 space-y-1.5 list-disc list-inside text-[#6b5f4a]">
              <li>Your <strong className="text-[#8a8070]">email address</strong> — used only to deliver your Daily Intelligence Brief.</li>
              <li>Your <strong className="text-[#8a8070]">preferred delivery time</strong> (e.g. 10:00 AM) and <strong className="text-[#8a8070]">timezone</strong>.</li>
              <li>Your <strong className="text-[#8a8070]">subscription status</strong> (active or unsubscribed).</li>
            </ul>
            <p className="mt-3 text-[#52473a]">
              We do not collect names, payment details, IP addresses, device identifiers, or any
              other personal information. We do not use tracking pixels or third-party analytics.
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">2. How We Use Your Data</h2>
            <ul className="space-y-1.5 list-disc list-inside text-[#6b5f4a]">
              <li>To deliver your Daily Intelligence Brief at your chosen time.</li>
              <li>To include a one-click unsubscribe link in every email.</li>
            </ul>
            <p className="mt-3 text-[#52473a]">
              We never sell, rent, share, or use your email for advertising. Your data is not
              processed for profiling or automated decision-making.
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">3. Data Storage</h2>
            <p className="text-[#6b5f4a]">
              Your data is stored in{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#8a8070] hover:text-[#c9a853] transition-colors underline underline-offset-2"
              >
                Supabase
              </a>
              , a PostgreSQL database provider operating in the EU (Frankfurt region by default).
              All data is encrypted at rest and in transit. Row-Level Security is enabled —
              only the application backend can read or modify your record.
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">4. Email Delivery</h2>
            <p className="text-[#6b5f4a]">
              Emails are sent via{" "}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#8a8070] hover:text-[#c9a853] transition-colors underline underline-offset-2"
              >
                Resend
              </a>
              . Your email address is passed to Resend solely to deliver your Daily Intelligence Brief. Resend does
              not receive your delivery time, timezone, or any other data. Resend&apos;s privacy
              policy applies to their processing of your email address in transit.
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">5. Your Rights</h2>
            <p className="text-[#6b5f4a] mb-3">
              Under GDPR and equivalent regulations, you have the right to:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-[#6b5f4a]">
              <li><strong className="text-[#8a8070]">Unsubscribe</strong> — every email includes a one-click unsubscribe link. You can also visit <Link href="/unsubscribe" className="text-[#8a8070] hover:text-[#c9a853] transition-colors underline underline-offset-2">/unsubscribe</Link>.</li>
              <li><strong className="text-[#8a8070]">Access or delete your data</strong> — email us and we will action your request within 72 hours.</li>
              <li><strong className="text-[#8a8070]">Data portability</strong> — we can provide your stored data (email, delivery time, timezone) on request.</li>
            </ul>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">6. Retention</h2>
            <p className="text-[#6b5f4a]">
              We retain your data for as long as you are subscribed. If you unsubscribe, your
              record is marked inactive. You may request permanent deletion at any time.
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">7. Contact</h2>
            <p className="text-[#6b5f4a]">
              For any privacy questions or data requests, email us at{" "}
              <a
                href="mailto:privacy@xanthrahorizon.com"
                className="text-[#8a8070] hover:text-[#c9a853] transition-colors underline underline-offset-2"
              >
                privacy@xanthrahorizon.com
              </a>
              {" "}or reply to any Xanthra Horizon email.
              We will respond within 72 hours.
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-[#100e0b] flex items-center justify-between">
          <Link href="/" className="text-xs text-[#3a3020] hover:text-[#8a8070] transition-colors">
            ← Home
          </Link>
          <Link href="/unsubscribe" className="text-xs text-[#3a3020] hover:text-[#8a8070] transition-colors">
            Unsubscribe →
          </Link>
        </div>

      </div>
    </div>
  );
}
