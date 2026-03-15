import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Space_Mono, Outfit, Syne } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { getBuilderSession } from "@/lib/server/auth";
import "./globals.css";

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
  metadataBase: new URL("https://hubdev.ai"),
  title: "HubDev Arena",
  description: "Weekly battles for AI-built apps.",
  openGraph: {
    title: "HubDev Arena",
    description: "Weekly battles for AI-built apps.",
    url: "https://hubdev.ai",
    siteName: "HubDev Arena",
  },
  twitter: {
    card: "summary_large_image",
    title: "HubDev Arena",
    description: "Weekly battles for AI-built apps.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getBuilderSession();

  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}
      >
        <div className="relative z-10 min-h-screen">
          <SiteHeader session={session} />
          <main>{children}</main>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
