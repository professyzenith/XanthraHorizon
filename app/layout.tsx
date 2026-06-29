import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#060504",
  width: "device-width",
  initialScale: 1,
};

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
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Xanthra Horizon — Know What Matters Next.",
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
  icons: {
    icon: "/icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
