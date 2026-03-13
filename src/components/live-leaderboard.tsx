"use client";

import { useEffect, useRef, useState } from "react";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { LeaderboardRow } from "@/lib/server/types";
import type { WeekStatus } from "@/lib/domain/weeks";

function sortRows(rows: LeaderboardRow[]): LeaderboardRow[] {
  return [...rows]
    .sort((a, b) => {
      if (b.elo !== a.elo) return b.elo - a.elo;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses;
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function LiveLeaderboard({
  initialRows,
  weekId,
  weekSlug,
  weekStatus,
  compact = false,
}: {
  initialRows: LeaderboardRow[];
  weekId: string;
  weekSlug: string;
  weekStatus: WeekStatus;
  compact?: boolean;
}) {
  const [rows, setRows] = useState<LeaderboardRow[]>(() => sortRows(initialRows));
  const [changedSlugs, setChangedSlugs] = useState<Set<string>>(new Set());
  const prevRanksRef = useRef<Map<string, number>>(
    new Map(initialRows.map((r) => [r.entrySlug, r.rank])),
  );

  // Apply rank-change animation when rows update
  function applyRows(nextRows: LeaderboardRow[]) {
    const sorted = sortRows(nextRows);
    const prevRanks = prevRanksRef.current;
    const changed = new Set<string>();

    for (const row of sorted) {
      const prev = prevRanks.get(row.entrySlug);
      if (prev !== undefined && prev !== row.rank) {
        changed.add(row.entrySlug);
      }
    }

    if (changed.size > 0) {
      setChangedSlugs(changed);
      setTimeout(() => setChangedSlugs(new Set()), 1_500);
    }

    prevRanksRef.current = new Map(sorted.map((r) => [r.entrySlug, r.rank]));
    setRows(sorted);
  }

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let subscribed = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    // Poll fallback after 5 s if Realtime hasn't connected
    const subscribeTimeout = setTimeout(() => {
      if (!subscribed) {
        pollInterval = setInterval(async () => {
          const res = await fetch(`/api/leaderboard?week=${encodeURIComponent(weekSlug)}`);
          if (res.ok) {
            const nextRows = (await res.json()) as LeaderboardRow[];
            applyRows(nextRows);
          }
        }, 30_000);
      }
    }, 5_000);

    const channel = supabase
      .channel(`leaderboard-${weekId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "entries",
          filter: `week_id=eq.${weekId}`,
        },
        async () => {
          // Re-fetch full leaderboard on any change (simplest correct approach)
          const res = await fetch(`/api/leaderboard?week=${encodeURIComponent(weekSlug)}`);
          if (res.ok) {
            const nextRows = (await res.json()) as LeaderboardRow[];
            applyRows(nextRows);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          subscribed = true;
          clearTimeout(subscribeTimeout);
          // Cancel poll fallback if it was already started
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      });

    return () => {
      clearTimeout(subscribeTimeout);
      if (pollInterval) clearInterval(pollInterval);
      void supabase.removeChannel(channel);
    };
    // weekId / weekSlug are stable for the lifetime of the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId, weekSlug]);

  const isLive = weekStatus === "voting_open";
  const isFinal = weekStatus === "locked" || weekStatus === "archived";

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className="flex items-center gap-3">
        {isLive && (
          <span className="flex items-center gap-2 border-[2px] border-[var(--accent-green)] bg-[var(--accent-green)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--ink)]">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--ink)]" />
            LIVE
          </span>
        )}
        {isFinal && (
          <span className="border-[2px] border-[var(--ink)] bg-[var(--ink)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--surface)]">
            FINAL RESULTS
          </span>
        )}
      </div>

      <LeaderboardTable rows={rows} compact={compact} changedSlugs={changedSlugs} />
    </div>
  );
}
