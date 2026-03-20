import { NextResponse } from "next/server";

import { getVoteEngine } from "@/lib/server/vote-engine";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const weekSlug = url.searchParams.get("week");

    if (!weekSlug) {
      return NextResponse.json({ error: "week is required." }, { status: 400 });
    }

    const leaderboard = await getVoteEngine().getLeaderboard(weekSlug);
    return NextResponse.json(leaderboard);
  } catch {
    return NextResponse.json({ error: "Failed to load the leaderboard." }, { status: 500 });
  }
}
