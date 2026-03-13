import { LiveLeaderboard } from "@/components/live-leaderboard";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const arenaService = getArenaService();
  const week = await arenaService.getCurrentWeek();
  const rows = week ? await arenaService.getLeaderboard({ weekSlug: week.slug }) : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
          Weekly leaderboard
        </p>
        <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
          {week ? week.themeTitle : "No active week"}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Ranking order is ELO descending, then wins, then losses, then earliest approval.
        </p>
      </div>

      {week ? (
        <LiveLeaderboard
          initialRows={rows}
          weekId={week.id}
          weekSlug={week.slug}
          weekStatus={week.status}
        />
      ) : (
        <div className="brutal-card p-6">
          <p className="text-base text-[var(--muted)]">No active week. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
