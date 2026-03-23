import type { Metadata } from "next";
import Link from "next/link";

import { AuroraBg } from "@/components/aurora-bg";
import { GlitchText } from "@/components/glitch-text";
import { requireAdminSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";

import { WeekActions } from "./week-actions";
import { EntryModeration } from "./entry-moderation";
import { LeaderboardPreview } from "./leaderboard-preview";

export const metadata: Metadata = {
  title: "Admin: Week Detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminWeekDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const adminSession = await requireAdminSession("/admin/weeks");
  const { slug } = await params;
  const detail = await getArenaService().getWeekAdminDetail(adminSession.email, slug);

  const statusColor =
    detail.week.status === "voting_open"
      ? "var(--accent-green)"
      : detail.week.status === "submissions_open"
        ? "var(--accent-yellow)"
        : detail.week.status === "locked"
          ? "var(--accent-blue)"
          : "var(--text-secondary)";

  const approvedCount = detail.entries.filter((e) => e.status === "approved").length;
  const pendingCount = detail.entries.filter((e) => e.status === "pending").length;

  // Build builder name map from leaderboard data (approved entries)
  const builderNameMap = new Map<string, string>();
  for (const row of detail.leaderboard) {
    builderNameMap.set(row.entrySlug, row.builderName);
  }

  // Build serializable entry data with builder names (L36)
  const entriesWithMeta = detail.entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    oneLiner: entry.oneLiner,
    liveUrl: entry.liveUrl,
    status: entry.status as "pending" | "approved" | "rejected",
    rejectionNote: entry.rejectionNote,
    builderName: builderNameMap.get(entry.slug) ?? null,
    builderId: entry.builderId,
  }));

  return (
    <div className="page-bg page-bg-default">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        {/* M28: Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-[0.2em]">
          <ol className="flex items-center gap-1 text-[var(--text-secondary)]">
            <li>
              <Link href="/admin" className="transition hover:text-[var(--accent-green)]">
                Admin
              </Link>
            </li>
            <li aria-hidden="true" className="text-[var(--text-secondary)]">/</li>
            <li>
              <Link href="/admin/weeks" className="transition hover:text-[var(--accent-green)]">
                Weeks
              </Link>
            </li>
            <li aria-hidden="true" className="text-[var(--text-secondary)]">/</li>
            <li className="text-[var(--text-primary)]" aria-current="page">
              {detail.week.themeTitle}
            </li>
          </ol>
        </nav>

        {/* Dark hero header */}
        <div className="brutal-card neon-box relative overflow-hidden arena-hero-bg p-6 text-white sm:p-8">
          <AuroraBg />
          <div className="absolute right-0 top-0 z-20 h-20 w-20" style={{ background: statusColor, clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,1) 10px, rgba(255,255,255,1) 11px)",
          }} />
          <div className="absolute bottom-0 left-0 z-20 h-1 w-full" style={{ background: `linear-gradient(to right, ${statusColor}, transparent)` }} />
          <div className="relative z-10">
            <Link href="/admin/weeks" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-gray-400 transition hover:text-white">
              &larr; All weeks
            </Link>

            <div className="mt-4">
              <div className="flex items-center gap-3">
                <span className="inline-block rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ background: statusColor, color: "var(--bg)" }}>
                  {detail.week.status.replaceAll("_", " ")}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                <GlitchText text={detail.week.themeTitle} />
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-300">
                {detail.week.themeDescription}
              </p>
            </div>

            {/* Stats row -- M17: grid-cols-2 sm:grid-cols-4 */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px] border-t-[var(--accent-green)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Entries</p>
                <p className="mt-1 text-lg font-black text-white">{detail.entries.length}</p>
              </div>
              <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px] border-t-[var(--accent-blue)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Matchups</p>
                <p className="mt-1 text-lg font-black text-white">{detail.matchups.length}</p>
              </div>
              <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px] border-t-[var(--accent-yellow)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Approved</p>
                <p className="mt-1 text-lg font-black text-[var(--accent-green)]">{approvedCount}</p>
              </div>
              <div className="border-[2px] border-gray-700 bg-gray-900 p-3 border-t-[3px]" style={{ borderTopColor: statusColor }}>
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gray-400">Pending</p>
                <p className="mt-1 text-lg font-black text-[var(--accent-yellow)]">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* H12/H16/H17: Actions with confirmation, error handling, loading states */}
        <WeekActions
          weekSlug={detail.week.slug}
          weekStatus={detail.week.status}
          approvedCount={approvedCount}
          statusColor={statusColor}
        />

        {/* M20/L36/L37: Entries with filter, builder names, URL validation */}
        <EntryModeration
          entries={entriesWithMeta}
          weekSlug={detail.week.slug}
          weekStatus={detail.week.status}
        />

        {/* M27: Leaderboard preview */}
        {detail.leaderboard.length > 0 ? (
          <LeaderboardPreview leaderboard={detail.leaderboard} />
        ) : null}
      </div>
    </div>
  );
}
