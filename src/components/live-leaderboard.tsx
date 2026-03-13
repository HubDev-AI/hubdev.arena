"use client";

import { useEffect, useState } from "react";

import { LeaderboardTable } from "@/components/leaderboard-table";
import type { LeaderboardRow } from "@/lib/server/types";

export function LiveLeaderboard({
  weekSlug,
  initialRows,
  compact = false,
}: {
  weekSlug: string;
  initialRows: LeaderboardRow[];
  compact?: boolean;
}) {
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/leaderboard?week=${encodeURIComponent(weekSlug)}`);
      if (!response.ok) {
        return;
      }

      const nextRows = (await response.json()) as LeaderboardRow[];
      setRows(nextRows);
    }, 8_000);

    return () => window.clearInterval(timer);
  }, [weekSlug]);

  return <LeaderboardTable rows={rows} compact={compact} />;
}
