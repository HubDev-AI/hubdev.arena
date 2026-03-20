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
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <Link href="/leaderboard" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--ink)] lg:col-span-2">&larr; Back to leaderboard</Link>
        <div className="space-y-6">
          <div className="space-y-3">
            <nav className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]" aria-label="Breadcrumb">
              <Link href="/leaderboard" className="transition hover:text-[var(--ink)]">
                Leaderboard
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-[var(--ink)]">{detail.week.themeTitle}</span>
              <InfoTooltip tip="ELO rating from head-to-head votes. Higher is better.">
                <span className="brutal-badge brutal-badge-green ml-1">
                  ELO {detail.entry.eloRating}
                </span>
              </InfoTooltip>
            </nav>
            <h1 className="text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
              {detail.entry.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">
              {detail.entry.oneLiner}
            </p>
          </div>
          <div className="brutal-card img-zoom overflow-hidden p-0">
            <EntryMedia assetPath={detail.entry.demoAssetPath} title={detail.entry.title} className="h-[26rem]" />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="brutal-card overflow-hidden p-0">
            <div className="bg-[var(--ink)] px-6 py-4 text-[var(--surface)]">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">Builder</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.05em]">
                {detail.builder.displayName}
              </p>
              {detail.builder.username ? (
                <p className="mt-1 text-sm text-gray-400">@{detail.builder.username}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-3 divide-x-[2px] divide-[var(--ink)] border-b-[2px] border-[var(--ink)]">
              <div className="bg-[var(--paper)] p-4 text-center">
                <p className="text-2xl font-black text-[var(--ink)]">{detail.entry.eloRating}</p>
                <InfoTooltip tip="ELO rating — calculated from matchup results. Starts at 1200. Beating higher-rated entries earns more points.">
                  <p className="brutal-label mt-1">ELO</p>
                </InfoTooltip>
              </div>
              <div className="bg-[var(--paper)] p-4 text-center">
                <p className="text-2xl font-black text-[var(--ink)]">{detail.entry.wins}-{detail.entry.losses}</p>
                <InfoTooltip tip="Win/Loss record from head-to-head voting matchups.">
                  <p className="brutal-label mt-1">Record</p>
                </InfoTooltip>
              </div>
              <div className="bg-[var(--paper)] p-4 text-center">
                <p className="text-2xl font-black text-[var(--ink)]">{winRate}%</p>
                <InfoTooltip tip="Percentage of all matchups this entry has won.">
                  <p className="brutal-label mt-1">Win rate</p>
                </InfoTooltip>
              </div>
            </div>
            {/* Win rate bar */}
            <div className="h-2 w-full bg-[var(--bg)]">
              <div
                className="h-full bg-[var(--accent-green)] transition-all"
                style={{ width: `${winRate}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-3 p-5">
              <a
                href={safeHref(detail.entry.liveUrl)}
                target="_blank"
                rel="noreferrer"
                className="brutal-btn brutal-btn-dark flex-1"
              >
                Open app
              </a>
              <Link href="/vote" className="brutal-btn brutal-btn-green flex-1">
                Vote now
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
