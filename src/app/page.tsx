import Link from "next/link";

import { Countdown } from "@/components/countdown";
import { EntryMedia } from "@/components/entry-media";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { getBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export default async function Home() {
  const service = getArenaService();
  const session = await getBuilderSession();
  const week = await service.getCurrentWeek();

  if (!week) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="brutal-label">System status</p>
          <p className="mt-2 text-xl font-bold text-[var(--ink)]">No active challenge week exists yet.</p>
        </div>
      </div>
    );
  }

  const leaderboard = await service.getLeaderboard({ weekSlug: week.slug });
  const featuredEntries = leaderboard.slice(0, 3);
  const pastWinners = await service.listPastWinners(2);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero section */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="brutal-card bg-[var(--ink)] p-6 text-[var(--surface)] sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
            Weekly battles for AI-built apps
          </p>
          <div className="mt-4 max-w-3xl">
            <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
              HubDev Arena
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
              Build with AI tools. Submit your entry. Fight for the top spot through head-to-head voting.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/vote" className="brutal-btn brutal-btn-green">
              Start Voting
            </Link>
            <Link href="/submit" className="brutal-btn brutal-btn-outline">
              {session ? "Submit your build" : "Sign in"}
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="border-[2px] border-gray-700 bg-gray-900 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-500">
                Week status
              </p>
              <p className="mt-2 text-xl font-black uppercase tracking-tight text-[var(--accent-green)]">
                {week.status.replaceAll("_", " ")}
              </p>
            </div>
            <div className="border-[2px] border-gray-700 bg-gray-900 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-500">
                Approved entrants
              </p>
              <p className="mt-2 text-xl font-black uppercase tracking-tight">
                {leaderboard.length}
              </p>
            </div>
            <div className="border-[2px] border-gray-700 bg-gray-900 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-gray-500">
                Timezone
              </p>
              <p className="mt-2 text-xl font-black uppercase tracking-tight">
                {week.timezone}
              </p>
            </div>
          </div>
        </div>

        <Countdown
          targetIso={week.status === "voting_open" ? week.votingCloseAt : week.submissionCloseAt}
          label={week.status === "voting_open" ? "Voting closes in" : "Submission deadline"}
        />
      </section>

      <section className="brutal-card bg-[var(--paper)] p-5 sm:p-6">
        <p className="brutal-label">Current theme</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--ink)] sm:text-3xl">
              {week.themeTitle}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              {week.themeDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="brutal-label">Featured entrants</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-[var(--ink)] sm:text-3xl">
              Current contenders
            </h2>
          </div>
          <Link href="/leaderboard" className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2">
            Full board
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredEntries.map((entry) => (
            <article key={entry.entrySlug} className="brutal-card overflow-hidden">
              <EntryMedia assetPath={entry.demoAssetUrl} title={entry.title} className="h-48" />
              <div className="space-y-3 border-t-[3px] border-[var(--ink)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="brutal-label">Rank {entry.rank}</span>
                  <span className="border-[2px] border-[var(--ink)] bg-[var(--accent-green)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]">
                    Elo {entry.elo}
                  </span>
                </div>
                <Link
                  href={`/entry/${entry.entrySlug}`}
                  className="block text-xl font-black tracking-tight text-[var(--ink)] transition hover:text-[var(--accent-blue)]"
                >
                  {entry.title}
                </Link>
                <p className="text-sm text-[var(--muted)]">by {entry.builderName}</p>
                <a
                  href={entry.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2"
                >
                  Open app
                </a>
              </div>
            </article>
          ))}
        </div>

        {pastWinners.length > 0 ? (
          <div className="brutal-card divide-y-[2px] divide-[var(--ink)] p-0">
            <div className="px-4 py-3">
              <p className="brutal-label">Past winners</p>
            </div>
            {pastWinners.map((item) => (
              <div key={item.week.slug} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-base font-black tracking-tight text-[var(--ink)]">
                    {item.topEntry?.title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{item.week.themeTitle}</p>
                </div>
                <span className="border-[2px] border-[var(--ink)] bg-[var(--accent-green)] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--ink)]">
                  Winner
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* Leaderboard preview */}
      <section>
        <LeaderboardTable rows={leaderboard.slice(0, 5)} />
      </section>
    </div>
  );
}
