"use client";

import Link from "next/link";
import { useState } from "react";

import { InfoTooltip } from "@/components/info-tooltip";
import { safeHref } from "@/lib/safe-href";
import type { LeaderboardRow } from "@/lib/server/types";

const PAGE_SIZE = 20;

export function LeaderboardTable({
  rows,
  compact = false,
}: {
  rows: LeaderboardRow[];
  compact?: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <div className="brutal-card p-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Leaderboard
        </p>
        <p className="mt-3 text-xl font-black tracking-tight text-[var(--text-primary)]">
          No entries yet.
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Entries will appear here once submissions are approved and voting begins.
        </p>
      </div>
    );
  }

  const visibleRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  function isValidUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return safeHref(url) !== "#";
  }

  return (
    <div className="brutal-card overflow-hidden p-0 neon-box radar-sweep">
      <div className="border-b border-[var(--line)] bg-black/40 px-5 py-3 flow-border-bottom">
        <p className="live-indicator font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)] neon-text">
          Live weekly leaderboard
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" aria-label="Weekly leaderboard rankings">
          <thead>
            <tr className="border-b border-[var(--line)] bg-black/20">
              <th
                scope="col"
                className="px-5 py-3 text-left font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]"
              >
                Rank
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-left font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]"
              >
                <InfoTooltip tip="ELO measures relative skill. All entries start at 1,200. Win against higher-rated entries to gain more points.">
                  <span className="cursor-help border-b border-dotted border-[var(--text-secondary)]">
                    ELO
                  </span>
                </InfoTooltip>
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-left font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]"
              >
                Entry
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-right font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]"
              >
                <InfoTooltip tip="Win/Loss record from head-to-head voting. Each vote = one matchup between two entries.">
                  <span className="cursor-help border-b border-dotted border-[var(--text-secondary)]">
                    Record
                  </span>
                </InfoTooltip>
              </th>
              {!compact && (
                <th
                  scope="col"
                  className="px-5 py-3 text-right font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]"
                >
                  Link
                </th>
              )}
            </tr>
          </thead>
          <tbody className="stagger-children divide-y divide-[var(--line)]">
            {visibleRows.map((row) => (
              <tr
                key={row.entrySlug}
                className={`holo-shimmer transition hover:bg-white/5 ${row.rank === 1 ? "bg-gradient-to-r from-[#1a1a0e] to-black/40" : ""}`}
              >
                {/* Rank + ELO on mobile; separate cells on desktop */}
                <td
                  className={`px-5 py-4 ${row.rank === 1 ? "border-l-4 border-l-[#D4A017]" : ""}`}
                >
                  <span
                    className={`${row.rank === 1 ? "text-4xl" : "text-3xl"} font-black tracking-tight ${row.rank === 1 ? "rank-gold" : row.rank === 2 ? "rank-silver" : row.rank === 3 ? "rank-bronze" : "text-[var(--text-secondary)]"}`}
                  >
                    {String(row.rank).padStart(2, "0")}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="brutal-badge brutal-badge-elo shrink-0">
                    {row.elo}
                  </span>
                </td>
                <td className="min-w-0 px-5 py-4">
                  <Link
                    href={`/entry/${row.entrySlug}`}
                    className={`block truncate text-xl font-black tracking-tight transition hover:text-[var(--accent-green)] hover:underline decoration-2 underline-offset-4 ${row.rank === 1 ? "text-white" : "text-[var(--text-primary)]"}`}
                  >
                    {row.title}
                  </Link>
                  <p
                    className={`mt-0.5 truncate text-sm ${row.rank === 1 ? "text-gray-400" : "text-[var(--text-secondary)]"}`}
                  >
                    by {row.builderName}
                  </p>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-right">
                  <p className="text-sm font-bold">
                    <span className="text-[var(--accent-green)]">
                      W {row.wins}
                    </span>
                    <span className="text-[var(--text-secondary)]"> / </span>
                    <span className="text-red-400">
                      L {row.losses}
                    </span>
                  </p>
                </td>
                {!compact && (
                  <td className="px-5 py-4 text-right">
                    {isValidUrl(row.liveUrl) ? (
                      <a
                        href={safeHref(row.liveUrl)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${row.title}`}
                        className="brutal-btn brutal-btn-outline text-[10px] px-3 py-2"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="text-[10px] font-mono text-[var(--muted)]">
                        No link
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="border-t border-[var(--line)] px-5 py-4 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="brutal-btn brutal-btn-outline hover-lift px-6 py-2 text-sm"
          >
            Show more ({rows.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
