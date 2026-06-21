import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://xanthrahorizon.com"
  ),
  title: "Xanthra Horizon — Know What Matters Next.",
  description:
    "Xanthra Horizon is your free Daily Intelligence Brief — AI news, breakthroughs, and research that actually matters, curated and delivered at exactly the time you choose.",
  keywords: "Xanthra Horizon, AI Research & Intelligence Digest, Daily Intelligence Brief, AI news, artificial intelligence, AI updates, stay informed about AI",
  openGraph: {
    title: "Xanthra Horizon — Know What Matters Next.",
    description: "Your free Daily Intelligence Brief. AI breakthroughs, research, and trends — curated, ranked, and delivered to your inbox at the time you choose.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Xanthra Horizon — Know What Matters Next.",
    description: "Your free Daily Intelligence Brief. AI breakthroughs, research, and trends — curated, ranked, and delivered to your inbox at the time you choose.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
