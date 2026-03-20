import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Space_Mono, Outfit, Syne } from "next/font/google";

import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { getDataMode } from "@/lib/env";
import { getBuilderSession } from "@/lib/server/auth";
import "./globals.css";

const SITE_URL = "https://hubdev-arena.vercel.app";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "HubDev Arena",
  url: SITE_URL,
  description:
    "Weekly AI app building competition with head-to-head voting and live ELO leaderboard.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "HubDev Arena",
  url: SITE_URL,
  description:
    "Compete in weekly AI app building challenges. Submit your AI-built app, vote in head-to-head matchups, and climb the live ELO leaderboard.",
  publisher: {
    "@type": "Organization",
    name: "HubDev Arena",
  },
};

const displayFont = Syne({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const monoFont = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://hubdev-arena.vercel.app"),
  title: {
    default: "HubDev Arena — Weekly Battles for AI-Built Apps",
    template: "%s | HubDev Arena",
  },
  description:
    "Compete in weekly AI app building challenges. Submit your AI-built app, vote in head-to-head matchups, and climb the live ELO leaderboard.",
  keywords: [
    "AI app competition",
    "AI-built apps",
    "weekly coding challenge",
    "ELO leaderboard",
    "head-to-head voting",
    "AI development",
    "app building contest",
    "HubDev Arena",
  ],
  authors: [{ name: "HubDev" }],
  creator: "HubDev",
  publisher: "HubDev",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "theme-color": "#0A0A0A",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "HubDev Arena — Weekly Battles for AI-Built Apps",
    description:
      "Compete in weekly AI app building challenges. Submit your AI-built app, vote in head-to-head matchups, and climb the live ELO leaderboard.",
    url: "https://hubdev-arena.vercel.app",
    siteName: "HubDev Arena",
  },
  twitter: {
    card: "summary_large_image",
    title: "HubDev Arena — Weekly Battles for AI-Built Apps",
    description:
      "Compete in weekly AI app building challenges. Submit your AI-built app, vote in head-to-head matchups, and climb the live ELO leaderboard.",
  },
  alternates: {
    canonical: "https://hubdev-arena.vercel.app",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getBuilderSession();
  const dataMode = getDataMode();

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}
      >
        <div className="relative z-10 flex min-h-screen flex-col">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:brutal-btn focus:brutal-btn-green"
          >
            Skip to content
          </a>
          <SiteHeader session={session} dataMode={dataMode} />
          <main id="main-content" className="flex-1">{children}</main>
          <footer className="border-t-[3px] border-[var(--ink)] bg-[var(--ink)] py-8">
            <div className="h-[2px] w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-6 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center border-[2px] border-gray-700 bg-gray-900 font-mono text-[10px] font-bold text-[var(--accent-green)]">
                    HA
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-500">
                    HubDev Arena
                  </p>
                </div>
                <nav aria-label="Footer navigation" className="flex items-center gap-5">
                  <a href="/vote" className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 transition hover:text-[var(--accent-green)]">Vote</a>
                  <a href="/leaderboard" className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 transition hover:text-[var(--accent-green)]">Board</a>
                  <a href="/rules" className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 transition hover:text-[var(--accent-green)]">Rules</a>
                  <a href="/submit" className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 transition hover:text-[var(--accent-green)]">Submit</a>
                </nav>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-600">
                Weekly battles for AI-built apps
              </p>
            </div>
          </footer>
        </div>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <Analytics />
      </body>
    </html>
  );
}
