import Link from "next/link";

import type { LeaderboardRow } from "@/lib/server/types";

export function LeaderboardTable({
  rows,
  compact = false,
}: {
  rows: LeaderboardRow[];
  compact?: boolean;
}) {
  return (
    <div className="brutal-card overflow-hidden p-0">
      <div className="border-b-[3px] border-[var(--ink)] bg-[var(--ink)] px-5 py-3 text-[var(--surface)]">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
          Live weekly leaderboard
        </p>
      </div>
      <div className="divide-y-[2px] divide-[var(--ink)]">
        {rows.map((row) => (
          <div
            key={row.entrySlug}
            className="grid gap-4 px-5 py-4 transition hover:bg-[var(--bg)] sm:grid-cols-[80px_minmax(0,1fr)_140px]"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black tracking-tight text-[var(--ink)]">
                {String(row.rank).padStart(2, "0")}
              </span>
              <span className="border-[2px] border-[var(--ink)] bg-[var(--accent-green)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--ink)]">
                {row.elo}
              </span>
            </div>
            <div>
              <Link
                href={`/entry/${row.entrySlug}`}
                className="text-lg font-black tracking-tight text-[var(--ink)] transition hover:text-[var(--accent-blue)]"
              >
                {row.title}
              </Link>
              <p className="mt-0.5 text-sm text-[var(--muted)]">by {row.builderName}</p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="text-right">
                <p className="brutal-label">Record</p>
                <p className="text-sm font-bold text-[var(--ink)]">
                  {row.wins}W / {row.losses}L
                </p>
              </div>
              {!compact ? (
                <a
                  href={row.liveUrl}
                  target="_blank"
                  rel="noreferrer"
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
