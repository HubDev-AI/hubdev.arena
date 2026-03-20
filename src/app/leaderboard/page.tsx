import type { Metadata } from "next";
import Link from "next/link";

import { InfoTooltip } from "@/components/info-tooltip";
import { LiveLeaderboard } from "@/components/live-leaderboard";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live ELO Leaderboard",
  description:
    "Live ELO rankings for this week's AI-built app challenge on HubDev Arena. See which AI-built apps are winning head-to-head matchups.",
  alternates: {
    canonical: "https://hubdev-arena.vercel.app/leaderboard",
  },
  openGraph: {
    title: "Live ELO Leaderboard — HubDev Arena",
    description:
      "Live ELO rankings for this week's AI-built app challenge. See which entries are winning.",
    url: "https://hubdev-arena.vercel.app/leaderboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live ELO Leaderboard — HubDev Arena",
    description:
      "Live ELO rankings for this week's AI-built app competition.",
  },
};

export default async function LeaderboardPage() {
  let week;
  try {
    const service = getArenaService();
    week = await service.getCurrentWeek();
  } catch {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="brutal-label">Leaderboard</p>
          <p className="mt-2 text-xl font-bold text-[var(--ink)]">
            Unable to load the leaderboard right now. Please try again shortly.
          </p>
        </div>
      </div>
    );
  }

  if (!week) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="brutal-label">Leaderboard</p>
          <p className="mt-2 text-xl font-bold text-[var(--ink)]">
            No active challenge week yet. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  const leaderboard = await getArenaService().getLeaderboard({ weekSlug: week.slug });

  const totalVotes = leaderboard.reduce((sum, r) => sum + r.wins + r.losses, 0) / 2;

  return (
    <div className="page-bg page-bg-board">
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="brutal-card flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
            Weekly leaderboard
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
            {week.themeTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Ranking order is ELO descending, then wins, then losses, then earliest approval.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="border-[2px] border-[var(--ink)] bg-[var(--paper)] px-4 py-3 text-center">
            <p className="text-2xl font-black text-[var(--ink)]">{leaderboard.length}</p>
            <InfoTooltip tip="Number of approved submissions competing this week.">
              <p className="brutal-label mt-1">Entries</p>
            </InfoTooltip>
          </div>
          <div className="border-[2px] border-[var(--ink)] bg-[var(--paper)] px-4 py-3 text-center">
            <p className="text-2xl font-black text-[var(--ink)]">{totalVotes}</p>
            <InfoTooltip tip="Total head-to-head matchup votes cast by all voters this week.">
              <p className="brutal-label mt-1">Votes</p>
            </InfoTooltip>
          </div>
        </div>
      </div>
      <LiveLeaderboard weekSlug={week.slug} initialRows={leaderboard} />

      {/* CTA */}
      <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-6 text-white sm:p-8">
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-blue)]" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
        }} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-black sm:text-xl">Shape the leaderboard with your votes</p>
            <p className="mt-1 text-sm text-gray-300">10 head-to-head picks per session. Every vote moves the ELO.</p>
          </div>
          <Link href="/vote" className="brutal-btn brutal-btn-green shrink-0">
            Start voting
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}
