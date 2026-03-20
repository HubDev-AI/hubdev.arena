import Link from "next/link";

import { InfoTooltip } from "@/components/info-tooltip";
import type { LeaderboardRow } from "@/lib/server/types";

export function LeaderboardTable({
  rows,
  compact = false,
}: {
  rows: LeaderboardRow[];
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="brutal-card p-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Leaderboard
        </p>
        <p className="mt-3 text-xl font-black tracking-tight text-[var(--ink)]">
          No entries yet.
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Entries will appear here once submissions are approved and voting begins.
        </p>
      </div>
    );
  }

  return (
    <div className="brutal-card overflow-hidden p-0">
      <div className="border-b-[3px] border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-[var(--surface)]">
        <p className="live-indicator font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
          Live weekly leaderboard
        </p>
      </div>
      <div className="stagger-children divide-y-[2px] divide-[var(--ink)]">
        {rows.map((row) => (
          <div
            key={row.entrySlug}
            className={`grid gap-4 px-5 py-4 transition hover:bg-[var(--paper)] sm:grid-cols-[120px_minmax(0,1fr)_200px] ${row.rank === 1 ? "bg-gradient-to-r from-[#FFF8E1] to-[var(--paper)] border-l-4 border-l-[#D4A017]" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span className={`${row.rank === 1 ? "text-4xl" : "text-3xl"} font-black tracking-tight shrink-0 ${row.rank === 1 ? "rank-gold" : row.rank === 2 ? "rank-silver" : row.rank === 3 ? "rank-bronze" : "text-[var(--ink)]"}`}>
                {String(row.rank).padStart(2, "0")}
              </span>
              <InfoTooltip tip="ELO rating — calculated from head-to-head matchup results. Higher is better. All entries start at 1200.">
                <span className="brutal-badge brutal-badge-elo shrink-0">
                  {row.elo}
                </span>
              </InfoTooltip>
            </div>
            <div className="min-w-0">
              <Link
                href={`/entry/${row.entrySlug}`}
                className="block truncate text-xl font-black tracking-tight text-[var(--ink)] transition hover:text-[var(--accent-blue)] hover:underline decoration-2 underline-offset-4"
              >
                {row.title}
              </Link>
              <p className="mt-0.5 truncate text-sm text-[var(--muted)]">by {row.builderName}</p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="text-right whitespace-nowrap">
                <InfoTooltip tip="Win/Loss record from head-to-head voting. Each vote = one matchup between two entries.">
                  <p className="brutal-label">Record</p>
                </InfoTooltip>
                <p className="text-sm font-bold">
                  <span className="text-emerald-700">{row.wins}W</span>
                  <span className="text-[var(--muted)]"> / </span>
                  <span className="text-red-700">{row.losses}L</span>
                </p>
              </div>
              {!compact ? (
                <a
                  href={row.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${row.title}`}
                  className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2"
                >
                  Open
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
