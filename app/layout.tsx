import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#060504",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://xanthrahorizon.com"
  ),
  title: "Xanthra Horizon — Know What Matters Next.",
  description:
    "Xanthra Horizon is your free Daily Intelligence Brief — AI news, breakthroughs, and research that actually matters, curated and delivered at exactly the time you choose.",
  keywords: "Xanthra Horizon, AI Research & Intelligence Digest, Daily Intelligence Brief, AI news, artificial intelligence, AI updates, stay informed about AI",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Xanthra Horizon — Know What Matters Next.",
    description: "Your free Daily Intelligence Brief. AI breakthroughs, research, and trends — curated, ranked, and delivered to your inbox at the time you choose.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Xanthra Horizon — Know What Matters Next. Your Daily Intelligence Brief.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xanthra Horizon — Know What Matters Next.",
    description: "Your free Daily Intelligence Brief. AI breakthroughs, research, and trends — curated, ranked, and delivered to your inbox at the time you choose.",
    images: ["/og-image.png"],
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
