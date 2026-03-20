"use client";

import { useEffect, useState } from "react";

import { LeaderboardTable } from "@/components/leaderboard-table";
import { createClient } from "@/lib/supabase/browser";
import type { LeaderboardRow } from "@/lib/server/types";

export function LiveLeaderboard({
  weekSlug,
  weekId,
  initialRows,
  compact = false,
}: {
  weekSlug: string;
  weekId?: string;
  initialRows: LeaderboardRow[];
  compact?: boolean;
}) {
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    async function fetchLeaderboard() {
      const response = await fetch(`/api/leaderboard?week=${encodeURIComponent(weekSlug)}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (response.ok) {
        const nextRows = (await response.json()) as LeaderboardRow[];
        setRows(nextRows);
      }
    }

    const supabase = createClient();
    const subscriptionFilter = weekId
      ? { event: "UPDATE" as const, schema: "public", table: "entries", filter: `week_id=eq.${weekId}` }
      : { event: "UPDATE" as const, schema: "public", table: "entries" };

    const channel = supabase
      .channel(`leaderboard-${weekSlug}`)
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
  }, [weekSlug, weekId]);

  return <LeaderboardTable rows={rows} compact={compact} />;
}
