import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Xanthra Horizon",
  description: "Xanthra Horizon Terms of Service — the rules for using our free AI intelligence newsletter.",
  alternates: { canonical: "/tos" },
};

export default function TosPage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-[#52473a]">Effective date: {effectiveDate}</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">1. Acceptance</h2>
            <p className="text-[#6b5f4a]">
              By subscribing to or using Xanthra Horizon, you agree to these Terms of Service.
              If you do not agree, please do not subscribe or use the service.
              These terms apply to all users of the service.
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">2. The Service</h2>
            <p className="text-[#6b5f4a] mb-3">
              Xanthra Horizon is a free daily email newsletter that delivers curated AI news,
              summaries, and analysis. The service is provided &quot;as is&quot; and &quot;as available&quot; without
              any warranty of any kind.
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-[#6b5f4a]">
              <li>Content is generated using AI (Google Gemini) and sourced from public RSS feeds.</li>
              <li>We do not guarantee the accuracy, completeness, or timeliness of any information.</li>
              <li>The service may be interrupted, modified, or discontinued at any time.</li>
            </ul>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">3. Eligibility</h2>
            <p className="text-[#6b5f4a]">
              You must be at least 13 years of age to subscribe. By subscribing, you represent
              that you meet this requirement and that all information you provide is accurate.
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">4. Acceptable Use</h2>
            <p className="text-[#6b5f4a] mb-3">You agree not to:</p>
            <ul className="space-y-1.5 list-disc list-inside text-[#6b5f4a]">
              <li>Use the service for any unlawful purpose.</li>
              <li>Subscribe using an email address you do not own or have permission to use.</li>
              <li>Attempt to disrupt, overload, or abuse the service infrastructure.</li>
              <li>Reproduce or redistribute briefing content for commercial purposes without permission.</li>
            </ul>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">5. Intellectual Property</h2>
            <p className="text-[#6b5f4a]">
              The Xanthra Horizon name, branding, and original editorial content are owned by
              Xanthra Horizon. News summaries are derived from publicly available sources and
              are provided for informational purposes only. Original source articles remain the
              property of their respective publishers.
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">6. Disclaimer</h2>
            <p className="text-[#6b5f4a]">
              Xanthra Horizon does not provide financial, legal, medical, or investment advice.
              All content is for informational purposes only. We are not responsible for any
              decisions made based on information provided in our briefings. Always verify
              important information from primary sources.
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">7. Limitation of Liability</h2>
            <p className="text-[#6b5f4a]">
              To the maximum extent permitted by law, Xanthra Horizon shall not be liable for
              any indirect, incidental, special, or consequential damages arising from your use
              of or inability to use the service. Our total liability shall not exceed the
              amount you paid for the service (which is zero, as the service is free).
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">8. Changes to These Terms</h2>
            <p className="text-[#6b5f4a]">
              We may update these terms at any time. Continued use of the service after changes
              constitutes acceptance of the revised terms. We will update the effective date
              at the top of this page when changes are made.
            </p>
          </section>

          <div className="h-px bg-gradient-to-r from-transparent via-[#1e1b17] to-transparent" />

          <section>
            <h2 className="text-base font-semibold text-[#c4b89a] mb-3">9. Contact</h2>
            <p className="text-[#6b5f4a]">
              For any questions about these terms, email us at{" "}
              <a
                href="mailto:privacy@xanthrahorizon.com"
                className="text-[#8a8070] hover:text-[#c9a853] transition-colors underline underline-offset-2"
              >
                privacy@xanthrahorizon.com
              </a>
              .
            </p>
          </section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-[#100e0b] flex items-center justify-between">
          <Link href="/" className="text-xs text-[#3a3020] hover:text-[#8a8070] transition-colors">
            ← Home
          </Link>
          <Link href="/privacy" className="text-xs text-[#3a3020] hover:text-[#8a8070] transition-colors">
            Privacy Policy →
          </Link>
        </div>

      </div>
    </div>
  );
}
