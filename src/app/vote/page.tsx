import Link from "next/link";

import { VoteClient } from "@/components/vote-client";
import { getBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export default async function VotePage() {
  const session = await getBuilderSession();

  if (!session) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
            Authenticated voting
          </p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
            Sign in to vote
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Every vote now comes from a signed-in HubDev account. That keeps the leaderboard cleaner, ties each voting streak to a real user, and still lets us enforce fingerprint-based abuse checks behind the scenes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login?next=%2Fvote" className="brutal-btn brutal-btn-green">
              Sign in to start voting
            </Link>
            <Link href="/leaderboard" className="brutal-btn brutal-btn-outline">
              View leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const service = getArenaService();
  const week = await service.getCurrentWeek();

  if (!week || week.status !== "voting_open") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="brutal-card p-8">
          <p className="brutal-label">Voting</p>
          <p className="mt-2 text-xl font-bold text-[var(--ink)]">
            No active voting round right now. Check back when a week opens for voting.
          </p>
          <div className="mt-4">
            <Link href="/leaderboard" className="brutal-btn brutal-btn-outline">View leaderboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const leaderboard = await service.getLeaderboard({ weekSlug: week.slug });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
          Authenticated head-to-head voting
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
          Pick the app you would open again tomorrow
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
          One tap per matchup. Ten picks. Live ELO updates. Signed in as {session.displayName}.
        </p>
      </div>
      <VoteClient weekSlug={week.slug} initialLeaderboard={leaderboard} />
    </div>
  );
}
