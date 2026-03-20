import { NextResponse } from "next/server";

import { getVoteEngine } from "@/lib/server/vote-engine";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const weekSlug = url.searchParams.get("week");

    if (!weekSlug || !/^[a-z0-9-]{1,50}$/.test(weekSlug)) {
      return NextResponse.json({ error: "Invalid week parameter." }, { status: 400 });
    }

    const leaderboard = await getVoteEngine().getLeaderboard(weekSlug);
    return NextResponse.json(leaderboard, {
      headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load the leaderboard." }, { status: 500 });
  }
}
