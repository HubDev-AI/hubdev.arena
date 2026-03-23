"use client";

import { useEffect, useState } from "react";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { createClient } from "@/lib/supabase/browser";
import type { LeaderboardRow } from "@/lib/server/types";
import type { WeekStatus } from "@/lib/domain/weeks";

type WeekOption = {
  slug: string;
  themeTitle: string;
  status: WeekStatus;
};

export function LiveLeaderboard({
  weekSlug,
  weekId,
  initialRows,
  compact = false,
  availableWeeks = [],
}: {
  weekSlug: string;
  weekId?: string;
  initialRows: LeaderboardRow[];
  compact?: boolean;
  availableWeeks?: WeekOption[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [activeWeekSlug, setActiveWeekSlug] = useState(weekSlug);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch(
          `/api/leaderboard?week=${encodeURIComponent(activeWeekSlug)}`,
          {
            headers: { "X-Requested-With": "XMLHttpRequest" },
          },
        );
        if (response.ok) {
          const nextRows = (await response.json()) as LeaderboardRow[];
          setRows(nextRows);
          setFetchError(false);
        } else {
          setFetchError(true);
        }
      } catch {
        setFetchError(true);
      }
    }

    // When week changes via dropdown, fetch immediately
    if (activeWeekSlug !== weekSlug) {
      void fetchLeaderboard();
    }

    const supabase = createClient();
    const subscriptionFilter =
      weekId && activeWeekSlug === weekSlug
        ? {
            event: "UPDATE" as const,
            schema: "public",
            table: "entries",
            filter: `week_id=eq.${weekId}`,
          }
        : { event: "UPDATE" as const, schema: "public", table: "entries" };

    const channel = supabase
      .channel(`leaderboard-${activeWeekSlug}`)
      .on("postgres_changes", subscriptionFilter, () => {
        void fetchLeaderboard();
      })
      .subscribe();

    // Fall back to polling if Realtime drops
    const fallbackTimer = window.setInterval(() => {
      if (channel.state !== "joined") {
        void fetchLeaderboard();
      }
    }, 30_000);

    return () => {
      window.clearInterval(fallbackTimer);
      void supabase.removeChannel(channel);
    };
  }, [activeWeekSlug, weekSlug, weekId]);

  function handleWeekChange(slug: string) {
    setActiveWeekSlug(slug);
    setFetchError(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Week selector */}
      {availableWeeks.length > 1 && (
        <div className="flex items-center gap-3">
          <label
            htmlFor="week-selector"
            className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-secondary)]"
          >
            Week
          </label>
          <select
            id="week-selector"
            value={activeWeekSlug}
            onChange={(e) => handleWeekChange(e.target.value)}
            className="brutal-btn brutal-btn-outline px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text-primary)] border-[2px] border-[var(--line)] font-mono cursor-pointer"
          >
            {availableWeeks.map((week) => (
              <option key={week.slug} value={week.slug}>
                {week.themeTitle}
                {week.status === "voting_open"
                  ? " (voting)"
                  : week.status === "submissions_open"
                    ? " (submissions)"
                    : week.status === "locked"
                      ? " (locked)"
                      : week.status === "archived"
                        ? " (past)"
                        : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error notice -- shows stale data warning without hiding existing rows */}
      {fetchError && (
        <div
          className="flex items-center gap-2 border-[2px] border-[var(--accent-yellow)]/30 bg-[var(--accent-yellow)]/5 px-4 py-2 text-sm text-[var(--accent-yellow)]"
          role="status"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <span>Unable to refresh -- showing cached data</span>
        </div>
      )}

      <LeaderboardTable rows={rows} compact={compact} />
    </div>
  );
}
