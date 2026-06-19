import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xanthra Horizon — Know What Matters Next.",
  description:
    "Stay ahead of the world's most important AI developments. Get a concise daily edition with the news, breakthroughs, and trends that actually matter. Free, forever.",
  keywords: "Xanthra Horizon, AI news, artificial intelligence newsletter, daily AI edition, AI updates, stay informed about AI",
  openGraph: {
    title: "Xanthra Horizon — Know What Matters Next.",
    description: "Stay ahead of the world’s most important AI developments. Free daily AI edition delivered to your inbox.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
