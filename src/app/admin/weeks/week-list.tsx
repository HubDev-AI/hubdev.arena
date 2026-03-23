"use client";

import { useState } from "react";
import Link from "next/link";

import type { WeekStatus } from "@/lib/domain/weeks";

type WeekSummary = {
  id: string;
  slug: string;
  themeTitle: string;
  themeDescription: string;
  status: WeekStatus;
};

const INITIAL_DISPLAY_COUNT = 10;

function getStatusColor(status: WeekStatus): string {
  switch (status) {
    case "voting_open":
      return "var(--accent-green)";
    case "submissions_open":
      return "var(--accent-yellow)";
    case "locked":
      return "var(--accent-blue)";
    default:
      return "var(--text-secondary)";
  }
}

function isActiveStatus(status: WeekStatus): boolean {
  return status === "voting_open" || status === "submissions_open";
}

export function WeekList({ weeks }: { weeks: WeekSummary[] }) {
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  const visibleWeeks = weeks.slice(0, displayCount);
  const hasMore = weeks.length > displayCount;

  return (
    <div className="brutal-card holo-shimmer overflow-hidden p-0">
      <div className="bg-black/40 px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-green)]">
          All weeks ({weeks.length})
        </p>
      </div>
      {weeks.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">No weeks created yet. Use the form to create the first one.</p>
        </div>
      ) : (
        <>
          <div className="divide-y-[2px] divide-[var(--line)]">
            {visibleWeeks.map((week) => {
              const statusColor = getStatusColor(week.status);
              const isActive = isActiveStatus(week.status);
              return (
                <Link
                  key={week.id}
                  href={`/admin/weeks/${week.slug}`}
                  className="relative block p-5 pl-7 transition hover:bg-white/5 group"
                >
                  <div className="absolute left-0 top-0 h-full w-1.5" style={{ background: statusColor }} />
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block rounded-sm px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ background: statusColor, color: "var(--bg)" }}>
                          {week.status.replaceAll("_", " ")}
                        </span>
                        {/* L33: Active badge */}
                        {isActive ? (
                          <span className="inline-block rounded-sm border-[2px] border-[var(--accent-green)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-green)] animate-pulse">
                            Active
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-blue)]">
                        {week.themeTitle}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{week.themeDescription}</p>
                    </div>
                    {/* L32: Larger slug text */}
                    <span className="font-mono text-xs text-[var(--text-secondary)] bg-black/30 px-2 py-0.5 rounded-sm border border-[var(--line)]">
                      {week.slug}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* M19: Show more button */}
          {hasMore ? (
            <div className="border-t-[2px] border-[var(--line)] p-4 text-center">
              <button
                type="button"
                onClick={() => setDisplayCount((prev) => prev + INITIAL_DISPLAY_COUNT)}
                className="brutal-btn brutal-btn-outline text-[10px] px-4 py-2"
              >
                Show older weeks ({weeks.length - displayCount} remaining)
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
