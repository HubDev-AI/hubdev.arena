import type { Metadata } from "next";
import Link from "next/link";

import { VoteClient } from "@/components/vote-client";
import { getBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vote — HubDev Arena",
  description: "Pick the best AI-built app in head-to-head matchups. 10 votes per session.",
};

export default async function VotePage() {
  const session = await getBuilderSession();

  if (!session) {
    return (
      <div className="page-bg page-bg-vote">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="brutal-card relative overflow-hidden bg-[var(--ink)] p-8 text-white">
          <div className="absolute right-0 top-0 h-20 w-20 bg-[var(--accent-green)]" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[var(--accent-green)] via-[var(--accent-blue)] to-transparent" />
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
            Authenticated voting
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.06em] text-white sm:text-5xl">
            Sign in to vote
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300">
            Every vote comes from a signed-in HubDev account. That keeps the leaderboard cleaner, ties each voting streak to a real user, and still lets us enforce fingerprint-based abuse checks behind the scenes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login?next=%2Fvote" className="brutal-btn brutal-btn-green">
              Sign in to start voting
            </Link>
            <Link href="/leaderboard" className="brutal-btn bg-white text-[var(--ink)]">
              View leaderboard
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { num: "01", title: "Sign in", desc: "Use X or magic link email" },
            { num: "02", title: "Pick winners", desc: "10 head-to-head matchups" },
            { num: "03", title: "Shape the board", desc: "Live ELO updates instantly" },
          ].map((step) => (
            <div key={step.num} className="brutal-card p-5">
              <span className="flex h-10 w-10 items-center justify-center border-[3px] border-[var(--ink)] bg-[var(--ink)] font-mono text-sm font-bold text-[var(--accent-green)]">
                {step.num}
              </span>
              <p className="mt-3 text-lg font-black tracking-tight text-[var(--ink)]">{step.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
    );
  }

  let week;
  try {
    week = await getArenaService().getCurrentWeek();
  } catch {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="brutal-label">Voting</p>
          <p className="mt-2 text-xl font-bold text-[var(--ink)]">
            Unable to load voting right now. Please try again shortly.
          </p>
        </div>
      </div>
    );
  }

  if (!week) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="brutal-label">Voting</p>
          <p className="mt-2 text-xl font-bold text-[var(--ink)]">
            No active week is available for voting.
          </p>
        </div>
      </div>
    );
  }

  const leaderboard = await getArenaService().getLeaderboard({ weekSlug: week.slug });

  return (
    <div className="page-bg page-bg-vote">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="brutal-card p-6 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
          Authenticated head-to-head voting
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
          Pick the app you would open again tomorrow
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          One tap per matchup. Ten picks. Live ELO updates. Signed in as {session.displayName}.
        </p>
      </div>
      <VoteClient weekSlug={week.slug} initialLeaderboard={leaderboard} />
    </div>
    </div>
  );
}
