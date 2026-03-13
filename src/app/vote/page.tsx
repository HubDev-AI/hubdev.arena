import { VoteClient } from "@/components/vote-client";
import { getBuilderSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export default async function VotePage() {
  // Session is optional — unauthenticated users can see the first matchup.
  // The VoteClient handles the auth gate when they try to cast a vote.
  const session = await getBuilderSession();

  const service = getArenaService();
  const week = await service.getCurrentWeek();

  if (!week) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-lg text-[var(--muted)]">No active week is available for voting.</p>
      </div>
    );
  }

  const leaderboard = await service.getLeaderboard({ weekSlug: week.slug });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
          Head-to-head voting
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
          Pick the app you would open again tomorrow
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
          {session
            ? `One tap per matchup. Ten picks. Live ELO updates. Signed in as ${session.displayName}.`
            : "One tap per matchup. Sign in to save your votes and track your streak."}
        </p>
      </div>
      <VoteClient weekSlug={week.slug} initialLeaderboard={leaderboard} />
    </div>
  );
}
