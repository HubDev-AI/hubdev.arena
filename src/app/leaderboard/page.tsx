import type { Metadata } from "next";
import Link from "next/link";

import { AnimatedCounter } from "@/components/animated-counter";
import { AuroraBg } from "@/components/aurora-bg";
import { GlitchText } from "@/components/glitch-text";
import { InfoTooltip } from "@/components/info-tooltip";
import { LiveBadge } from "@/components/live-badge";
import { LiveLeaderboard } from "@/components/live-leaderboard";
import { ScrollReveal } from "@/components/scroll-reveal";
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
    title: "Live ELO Leaderboard -- HubDev Arena",
    description:
      "Live ELO rankings for this week's AI-built app challenge. See which entries are winning.",
    url: "https://hubdev-arena.vercel.app/leaderboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live ELO Leaderboard -- HubDev Arena",
    description:
      "Live ELO rankings for this week's AI-built app competition.",
  },
};

export default async function LeaderboardPage() {
  // L21: single getArenaService() call hoisted above try block
  let service: ReturnType<typeof getArenaService>;
  try {
    service = getArenaService();
  } catch {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="brutal-card p-8 text-center">
          <p className="brutal-label">Leaderboard</p>
          <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">
            Unable to load the leaderboard right now.
          </p>
          <div className="mt-4">
            <a
              href="/leaderboard"
              className="brutal-btn brutal-btn-outline hover-lift px-6 py-2 text-sm"
            >
              Try again
            </a>
          </div>
        </div>
      </div>
    );
  }

  let week;
  try {
    week = await service.getCurrentWeek();
  } catch {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="brutal-card p-8 text-center">
          <p className="brutal-label">Leaderboard</p>
          <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">
            Unable to load the leaderboard right now. Please try again shortly.
          </p>
          <div className="mt-4">
            <a
              href="/leaderboard"
              className="brutal-btn brutal-btn-outline hover-lift px-6 py-2 text-sm"
            >
              Try again
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!week) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="brutal-label">Leaderboard</p>
          <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">
            No active challenge week yet. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  const [leaderboard, allWeeks] = await Promise.all([
    service.getLeaderboard({ weekSlug: week.slug }),
    service.listWeeks(),
  ]);

  // Filter to weeks that have meaningful leaderboard data (not drafts)
  const availableWeeks = allWeeks
    .filter((w) =>
      ["submissions_open", "voting_open", "locked", "archived"].includes(w.status),
    )
    .map((w) => ({
      slug: w.slug,
      themeTitle: w.themeTitle,
      status: w.status,
    }));

  const totalVotes = leaderboard.reduce((sum, r) => sum + r.wins + r.losses, 0) / 2;

  // L15: Determine CTA state based on week status
  const isVotingOpen = week.status === "voting_open";
  const isLocked = week.status === "locked" || week.status === "archived";

  return (
    <div className="page-bg page-bg-board">
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <ScrollReveal>
      <div className="brutal-card holo-shimmer hud-corners relative overflow-hidden flex flex-wrap items-end justify-between gap-4 p-6 sm:p-8">
        <AuroraBg className="opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--text-secondary)]">
              Weekly leaderboard
            </p>
            <LiveBadge />
          </div>
          <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--text-primary)]">
            <GlitchText text={week.themeTitle} />
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Ranking order is ELO descending, then wins, then losses, then earliest approval.
          </p>
        </div>
        <div className="relative z-10 flex gap-4">
          <div className="hover-lift border-[2px] border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-center">
            <p className="text-2xl font-black text-[var(--text-primary)]"><AnimatedCounter value={leaderboard.length} /></p>
            <InfoTooltip tip="Number of approved submissions competing this week.">
              <p className="brutal-label mt-1">Entries</p>
            </InfoTooltip>
          </div>
          <div className="hover-lift border-[2px] border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-center">
            <p className="text-2xl font-black text-[var(--text-primary)]"><AnimatedCounter value={totalVotes} /></p>
            <InfoTooltip tip="Total head-to-head matchup votes cast by all voters this week.">
              <p className="brutal-label mt-1">Votes</p>
            </InfoTooltip>
          </div>
        </div>
      </div>
      </ScrollReveal>
      <LiveLeaderboard
        weekSlug={week.slug}
        initialRows={leaderboard}
        availableWeeks={availableWeeks}
      />

      {/* CTA -- L15: status-aware */}
      <ScrollReveal>
      <div className="brutal-card neon-box scanlines relative overflow-hidden bg-[var(--ink)] p-6 text-white sm:p-8">
        <AuroraBg />
        <div className="neon-text absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-blue)]" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
        }} />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            {isVotingOpen ? (
              <>
                <p className="neon-text text-lg font-black sm:text-xl">Shape the leaderboard with your votes</p>
                <p className="mt-1 text-sm text-gray-300">10 head-to-head picks per session. Every vote moves the ELO.</p>
              </>
            ) : isLocked ? (
              <>
                <p className="text-lg font-black sm:text-xl text-gray-300">Voting has ended for this week</p>
                <p className="mt-1 text-sm text-gray-400">Results are final. Check back next week for a new challenge.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-black sm:text-xl text-gray-300">Voting opens soon</p>
                <p className="mt-1 text-sm text-gray-400">Submissions are still being accepted. Voting will begin once the submission period ends.</p>
              </>
            )}
          </div>
          {isVotingOpen ? (
            <Link href="/vote" className="brutal-btn brutal-btn-green hover-lift shrink-0">
              Start voting
            </Link>
          ) : isLocked ? (
            <Link href="/" className="brutal-btn brutal-btn-outline hover-lift shrink-0">
              Back to arena
            </Link>
          ) : (
            <span className="brutal-btn brutal-btn-outline shrink-0 opacity-60 cursor-not-allowed" aria-disabled="true">
              Voting opens soon
            </span>
          )}
        </div>
      </div>
      </ScrollReveal>
    </div>
    </div>
  );
}
