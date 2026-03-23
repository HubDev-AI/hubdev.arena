import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnimatedCounter } from "@/components/animated-counter";
import { AuroraBg } from "@/components/aurora-bg";
import { EntryMedia } from "@/components/entry-media";
import { GlitchText } from "@/components/glitch-text";
import { InfoTooltip } from "@/components/info-tooltip";
import { JsonLd } from "@/components/json-ld";
import { LiveBadge } from "@/components/live-badge";
import { ScrollReveal } from "@/components/scroll-reveal";
import { safeHref } from "@/lib/safe-href";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return safeHref(url) !== "#";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getArenaService().getEntryDetail(slug);
  if (!detail) {
    return { title: "Entry Not Found" };
  }
  const title = `${detail.entry.title} by ${detail.builder.displayName}`;
  const description =
    detail.entry.oneLiner ||
    `${detail.entry.title} -- an AI-built app competing in HubDev Arena.`;
  const url = `https://hubdev-arena.vercel.app/entry/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${detail.entry.title} -- HubDev Arena`,
      description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${detail.entry.title} -- HubDev Arena`,
      description,
    },
  };
}

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getArenaService().getEntryDetail(slug);

  if (!detail) {
    notFound();
  }

  const totalMatches = detail.entry.wins + detail.entry.losses;
  const winRate = totalMatches > 0 ? Math.round((detail.entry.wins / totalMatches) * 100) : 0;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "HubDev Arena",
        item: "https://hubdev-arena.vercel.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Leaderboard",
        item: "https://hubdev-arena.vercel.app/leaderboard",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: detail.entry.title,
        item: `https://hubdev-arena.vercel.app/entry/${slug}`,
      },
    ],
  };

  const entryJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: detail.entry.title,
    description: detail.entry.oneLiner,
    author: {
      "@type": "Person",
      name: detail.builder.displayName,
    },
    url: detail.entry.liveUrl,
    applicationCategory: "WebApplication",
  };

  const hasValidLiveUrl = isValidUrl(detail.entry.liveUrl);

  return (
    <div className="page-bg page-bg-default">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={entryJsonLd} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Dark hero banner -- matches homepage style */}
        <div className="brutal-card relative overflow-hidden arena-hero-bg neon-box scanlines p-6 text-white sm:p-8">
          <AuroraBg />
          <div className="absolute right-0 top-0 h-20 w-20 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
          }} />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />

          <Link href="/leaderboard" className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-gray-400 transition hover:text-white">
            <span className="inline-block transition-transform group-hover:-translate-x-1">&larr;</span> Back to leaderboard
          </Link>

          <div className="mt-4">
            {/* L20: Breadcrumb with proper list semantics */}
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400 list-none m-0 p-0">
                <li>
                  <Link href="/leaderboard" className="transition hover:text-white">
                    Leaderboard
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="flex items-center gap-2">
                  <span className="neon-text text-[var(--accent-green)]">{detail.week.themeTitle}</span>
                  <LiveBadge className="ml-2" />
                </li>
              </ol>
            </nav>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                <GlitchText text={detail.entry.title} />
              </h1>
              <InfoTooltip tip="ELO rating from head-to-head votes. Higher is better.">
                <span className="brutal-badge brutal-badge-green neon-text">
                  ELO <AnimatedCounter value={detail.entry.eloRating} />
                </span>
              </InfoTooltip>
            </div>
            <p className="mt-2 max-w-2xl text-base leading-7 text-gray-300">
              {detail.entry.oneLiner}
            </p>
          </div>

          {/* Inline stats row */}
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="glass-card p-3 border-t-[3px] border-t-[var(--accent-green)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Builder</p>
              <p className="mt-1 text-sm font-black tracking-tight text-white">{detail.builder.displayName}</p>
            </div>
            <div className="glass-card p-3 border-t-[3px] border-t-[var(--accent-blue)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">ELO rating</p>
              <p className="mt-1 text-sm font-black tracking-tight neon-text text-[var(--accent-green)]"><AnimatedCounter value={detail.entry.eloRating} /></p>
            </div>
            <div className="glass-card p-3 border-t-[3px] border-t-[var(--accent-yellow)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Record</p>
              <p className="mt-1 text-sm font-black tracking-tight">
                <span className="neon-text text-[var(--accent-green)]">W {detail.entry.wins}</span>
                <span className="text-gray-500"> / </span>
                <span className="text-red-400">L {detail.entry.losses}</span>
              </p>
            </div>
            <div className="glass-card p-3 border-t-[3px] border-t-[var(--accent-cyan)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Win rate</p>
              <p className="mt-1 text-sm font-black tracking-tight text-white">{winRate}%</p>
            </div>
          </div>
        </div>

        {/* Demo + actions row */}
        <ScrollReveal>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          {/* Demo screenshot -- M46: taller media area */}
          <div className="brutal-card img-zoom hud-corners overflow-hidden p-0 relative">
            <EntryMedia assetPath={detail.entry.demoAssetPath} title={detail.entry.title} className="h-64 sm:h-80 lg:h-96" />
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-green)]/40 to-transparent" />
          </div>

          {/* Sidebar -- stretches to match */}
          <div className="brutal-card holo-shimmer hud-corners flex flex-col overflow-hidden p-0 border-l-[4px] border-l-[var(--accent-green)]">
            <div className="bg-[var(--ink)] px-5 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] neon-text text-[var(--accent-green)]">Actions</p>
            </div>
            <div className="space-y-3 p-4">
              {/* M50: Only render clickable button for valid URLs */}
              {hasValidLiveUrl ? (
                <a
                  href={safeHref(detail.entry.liveUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="brutal-btn brutal-btn-green hover-lift w-full text-center"
                >
                  Open app &rarr;
                </a>
              ) : (
                <span
                  className="brutal-btn brutal-btn-outline w-full text-center opacity-50 cursor-not-allowed block"
                  aria-disabled="true"
                >
                  No link available
                </span>
              )}
              <Link href="/vote" className="brutal-btn brutal-btn-outline hover-lift w-full text-center">
                Vote in matchups
              </Link>
            </div>
            <div className="mt-auto border-t-[2px] border-[var(--line)] px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-[var(--text-primary)]">Win rate</span>
                <span className="font-mono font-black text-[var(--text-primary)]">{winRate}%</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden border-[2px] border-[var(--line)] bg-[var(--bg)]">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-blue)] transition-all"
                  style={{ width: `${winRate}%`, boxShadow: "0 0 8px rgba(0, 255, 65, 0.2)" }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                {totalMatches} matchups &middot; {detail.week.themeTitle}
              </p>
            </div>
          </div>
        </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
