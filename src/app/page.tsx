import Link from "next/link";

import { Countdown } from "@/components/countdown";
import { EntryMedia } from "@/components/entry-media";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export default async function Home() {
  const arenaService = getArenaService();
  const week = await arenaService.getCurrentWeek();

  const now = new Date();
  type PageState = "submissions_open" | "gap" | "voting_open" | "locked" | "no_week";
  let pageState: PageState;

  if (!week) {
    pageState = "no_week";
  } else if (week.status === "submissions_open") {
    pageState = now > new Date(week.submissionCloseAt) ? "gap" : "submissions_open";
  } else if (week.status === "voting_open") {
    pageState = "voting_open";
  } else if (week.status === "locked" || week.status === "archived") {
    pageState = "locked";
  } else {
    pageState = "no_week";
  }

  // ── no_week ──────────────────────────────────────────────────────────────
  if (pageState === "no_week") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-4 py-24 sm:px-6 lg:px-8">
        <div className="brutal-card w-full p-10 text-center">
          <h1 className="font-display text-6xl font-black uppercase leading-[0.9] tracking-tight text-[var(--ink)] sm:text-8xl">
            BETWEEN<br />ROUNDS
          </h1>
          <p className="mt-6 font-mono text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
            Next theme drops Thursday 12PM PT
          </p>
          <div className="mt-8">
            <Link href="/leaderboard" className="brutal-btn brutal-btn-outline">
              Past winners →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── gap ───────────────────────────────────────────────────────────────────
  if (pageState === "gap") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
            Current theme
          </p>
          <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-[var(--ink)] sm:text-7xl">
            {week!.themeTitle}
          </h1>
          <p className="mt-6 border-[3px] border-[var(--ink)] bg-[var(--paper)] px-5 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--ink)]">
            Submissions closed — voting opens{" "}
            {formatDate(week!.votingOpenAt)}
          </p>
        </div>
      </div>
    );
  }

  // ── submissions_open ──────────────────────────────────────────────────────
  if (pageState === "submissions_open") {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <section className="brutal-card bg-[var(--ink)] p-8 text-[var(--surface)] sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
            Submissions open
          </p>
          <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl">
            {week!.themeTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
            {week!.themeDescription}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/submit" className="brutal-btn brutal-btn-green w-full sm:w-auto">
              Submit your app →
            </Link>
          </div>
          <div className="mt-4 flex gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400">
            <Link href="/rules" className="hover:text-[var(--accent-green)] transition-colors">
              Rules →
            </Link>
            <Link href="/leaderboard" className="hover:text-[var(--accent-green)] transition-colors">
              Past winners →
            </Link>
          </div>
        </section>

        <Countdown targetIso={week!.submissionCloseAt} label="Submissions close in" />
      </div>
    );
  }

  // ── voting_open ───────────────────────────────────────────────────────────
  if (pageState === "voting_open") {
    const featuredEntries = await arenaService.getFeaturedEntries(week!.slug, 3);

    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <section className="brutal-card bg-[var(--ink)] p-8 text-[var(--surface)] sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
                Current theme
              </p>
              <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl">
                {week!.themeTitle}
              </h1>
            </div>
            <span className="border-[3px] border-[var(--accent-green)] bg-[var(--accent-green)] px-4 py-2 font-mono text-sm font-bold uppercase tracking-[0.2em] text-[var(--ink)]">
              VOTING LIVE
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/vote" className="brutal-btn brutal-btn-blue">
              Start voting →
            </Link>
          </div>
        </section>

        <Countdown targetIso={week!.votingCloseAt} label="Voting closes in" />

        {featuredEntries.length > 0 && (
          <section>
            <p className="brutal-label mb-4">Featured entries</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredEntries.map((entry) => (
                <article key={entry.entrySlug} className="brutal-card overflow-hidden">
                  <EntryMedia
                    assetPath={entry.demoAssetUrl}
                    title={entry.title}
                    className="h-48"
                  />
                  <div className="space-y-3 border-t-[3px] border-[var(--ink)] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="brutal-label">Rank {entry.rank}</span>
                      <span className="border-[2px] border-[var(--ink)] bg-[var(--accent-green)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]">
                        ELO {entry.elo}
                      </span>
                    </div>
                    <p className="text-xl font-black tracking-tight text-[var(--ink)]">
                      {entry.title}
                    </p>
                    <p className="text-sm text-[var(--muted)]">by {entry.builderName}</p>
                    <Link
                      href={`/entry/${entry.entrySlug}`}
                      className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2"
                    >
                      View entry ↗
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ── locked ────────────────────────────────────────────────────────────────
  // pageState === 'locked'
  const leaderboard = await arenaService.getLeaderboard({ weekSlug: week!.slug });
  const winner = leaderboard[0] ?? null;
  const top5 = leaderboard.slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      {winner && (
        <section className="brutal-card border-[4px] border-[var(--accent-green)] p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
            Winner — {week!.themeTitle}
          </p>
          <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[0.9] tracking-tight text-[var(--ink)] sm:text-7xl">
            {winner.title}
          </h1>
          <p className="mt-3 text-lg text-[var(--muted)]">by {winner.builderName}</p>
          <div className="mt-4 flex flex-wrap gap-5 font-mono text-sm">
            <span className="border-[2px] border-[var(--ink)] bg-[var(--accent-green)] px-3 py-1 font-bold uppercase tracking-wider text-[var(--ink)]">
              ELO {winner.elo}
            </span>
            <span className="border-[2px] border-[var(--ink)] bg-[var(--paper)] px-3 py-1 font-bold uppercase tracking-wider text-[var(--ink)]">
              {winner.wins}W / {winner.losses}L
            </span>
          </div>
        </section>
      )}

      {top5.length > 0 && (
        <section className="brutal-card overflow-hidden p-0">
          <div className="border-b-[3px] border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-[var(--surface)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
              Final results
            </p>
          </div>
          <div className="divide-y-[2px] divide-[var(--ink)]">
            {top5.map((row) => (
              <div
                key={row.entrySlug}
                className="grid grid-cols-[56px_minmax(0,1fr)_80px] items-center gap-4 px-5 py-4"
              >
                <span className="text-3xl font-black tracking-tight text-[var(--ink)]">
                  #{row.rank}
                </span>
                <div>
                  <Link
                    href={`/entry/${row.entrySlug}`}
                    className="font-black tracking-tight text-[var(--ink)] hover:text-[var(--accent-blue)] transition-colors"
                  >
                    {row.title}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">by {row.builderName}</p>
                </div>
                <span className="text-right font-mono text-sm font-bold text-[var(--ink)]">
                  {row.elo}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/leaderboard" className="brutal-btn brutal-btn-outline">
          View full results →
        </Link>
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Next round starts Thursday
        </p>
      </div>
    </div>
  );
}
