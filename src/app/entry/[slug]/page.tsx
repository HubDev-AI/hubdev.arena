import Link from "next/link";
import { notFound } from "next/navigation";

import { EntryMedia } from "@/components/entry-media";
import { getArenaService } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const arenaService = getArenaService();
  const detail = await arenaService.getEntryDetail(slug);

  if (!detail || detail.entry.status !== "approved") {
    notFound();
  }

  const { entry, week, builder } = detail;

  const votingHasOpened =
    week.status === "voting_open" ||
    week.status === "locked" ||
    week.status === "archived";

  // Get rank from leaderboard
  let rank: number | null = null;
  if (votingHasOpened) {
    const leaderboard = await arenaService.getLeaderboard({ weekSlug: week.slug });
    rank = leaderboard.find((r) => r.entrySlug === entry.slug)?.rank ?? null;
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
      {/* Main content */}
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">
            {week.themeTitle}
          </p>
          <h1 className="font-display text-4xl font-black uppercase tracking-[-0.06em] text-[var(--ink)]">
            {entry.title}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--muted)]">{entry.oneLiner}</p>
        </div>

        <EntryMedia
          assetPath={entry.demoAssetPath}
          title={entry.title}
          className="h-[26rem]"
        />
      </div>

      {/* Sidebar */}
      <aside className="space-y-5">
        {/* Builder card */}
        <div className="brutal-card p-6">
          <p className="brutal-label">Builder</p>
          {builder.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={builder.avatarUrl}
              alt={builder.displayName}
              className="mt-3 h-12 w-12 rounded-full border-[2px] border-[var(--ink)]"
            />
          )}
          <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-[var(--ink)]">
            {builder.displayName}
          </p>
          <p className="mt-1 font-mono text-sm text-[var(--muted)]">@{builder.username}</p>
        </div>

        {/* Stats card — only after voting opens */}
        {votingHasOpened && (
          <div className="brutal-card p-6">
            <div className="grid grid-cols-3 gap-3">
              {rank !== null && (
                <div className="border-[2px] border-[var(--ink)] bg-[var(--accent-green)] p-3 text-center">
                  <p className="brutal-label">Rank</p>
                  <p className="mt-1 text-xl font-black text-[var(--ink)]">#{rank}</p>
                </div>
              )}
              <div className="border-[2px] border-[var(--ink)] bg-[var(--paper)] p-3 text-center">
                <p className="brutal-label">ELO</p>
                <p className="mt-1 text-xl font-black text-[var(--ink)]">{entry.eloRating}</p>
              </div>
              <div className="border-[2px] border-[var(--ink)] bg-[var(--paper)] p-3 text-center">
                <p className="brutal-label">Record</p>
                <p className="mt-1 text-xl font-black text-[var(--ink)]">
                  {entry.wins}-{entry.losses}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <a
            href={entry.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="brutal-btn brutal-btn-green text-center"
          >
            Open app →
          </a>
          <Link href="/leaderboard" className="brutal-btn brutal-btn-outline text-center">
            View leaderboard →
          </Link>
        </div>
      </aside>
    </div>
  );
}
