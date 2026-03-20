import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EntryMedia } from "@/components/entry-media";
import { InfoTooltip } from "@/components/info-tooltip";
import { JsonLd } from "@/components/json-ld";
import { safeHref } from "@/lib/safe-href";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

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
      title: `${detail.entry.title} — HubDev Arena`,
      description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${detail.entry.title} — HubDev Arena`,
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

  return (
    <div className="page-bg page-bg-default">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={entryJsonLd} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Dark hero banner — matches homepage style */}
        <div className="brutal-card relative overflow-hidden arena-hero-bg p-6 text-white sm:p-8">
          <div className="absolute right-0 top-0 h-20 w-20 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
          }} />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />

          <Link href="/leaderboard" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-gray-400 transition hover:text-white">
            &larr; Back to leaderboard
          </Link>

          <div className="mt-4">
            <nav className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400" aria-label="Breadcrumb">
              <Link href="/leaderboard" className="transition hover:text-white">
                Leaderboard
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-[var(--accent-green)]">{detail.week.themeTitle}</span>
            </nav>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                {detail.entry.title}
              </h1>
              <InfoTooltip tip="ELO rating from head-to-head votes. Higher is better.">
                <span className="brutal-badge brutal-badge-green">
                  ELO {detail.entry.eloRating}
                </span>
              </InfoTooltip>
            </div>
            <p className="mt-2 max-w-2xl text-base leading-7 text-gray-300">
              {detail.entry.oneLiner}
            </p>
          </div>

          {/* Inline stats row */}
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px] border-t-[var(--accent-green)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Builder</p>
              <p className="mt-1 text-sm font-black tracking-tight text-white">{detail.builder.displayName}</p>
            </div>
            <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px] border-t-[var(--accent-blue)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">ELO rating</p>
              <p className="mt-1 text-sm font-black tracking-tight text-[var(--accent-green)]">{detail.entry.eloRating}</p>
            </div>
            <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px] border-t-[var(--accent-yellow)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Record</p>
              <p className="mt-1 text-sm font-black tracking-tight">
                <span className="text-[var(--accent-green)]">{detail.entry.wins}W</span>
                <span className="text-gray-500"> / </span>
                <span className="text-red-400">{detail.entry.losses}L</span>
              </p>
            </div>
            <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px] border-t-[var(--accent-green)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Win rate</p>
              <p className="mt-1 text-sm font-black tracking-tight text-white">{winRate}%</p>
            </div>
          </div>
        </div>

        {/* Demo + actions row */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          {/* Demo screenshot */}
          <div className="brutal-card img-zoom overflow-hidden p-0 relative">
            <EntryMedia assetPath={detail.entry.demoAssetPath} title={detail.entry.title} className="h-48 sm:h-64" />
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-green)]/40 to-transparent" />
          </div>

          {/* Sidebar — stretches to match */}
          <div className="brutal-card flex flex-col overflow-hidden p-0 border-l-[4px] border-l-[var(--accent-green)]">
            <div className="bg-[var(--ink)] px-5 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">Actions</p>
            </div>
            <div className="space-y-3 p-4">
              <a
                href={safeHref(detail.entry.liveUrl)}
                target="_blank"
                rel="noreferrer"
                className="brutal-btn brutal-btn-green w-full text-center"
              >
                Open app &rarr;
              </a>
              <Link href="/vote" className="brutal-btn brutal-btn-outline w-full text-center">
                Vote in matchups
              </Link>
            </div>
            <div className="mt-auto border-t-[2px] border-[var(--ink)] px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-[var(--ink)]">Win rate</span>
                <span className="font-mono font-black text-[var(--ink)]">{winRate}%</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden border-[2px] border-[var(--ink)] bg-[var(--bg)]">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-blue)] transition-all"
                  style={{ width: `${winRate}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {totalMatches} matchups &middot; {detail.week.themeTitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
