import { NextResponse } from "next/server";

import { getVoteRequestContext } from "@/lib/server/vote-request-context";
import { getVoteEngine } from "@/lib/server/vote-engine";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const weekSlug = url.searchParams.get("week");

    if (!weekSlug || !/^[a-z0-9-]{1,50}$/.test(weekSlug)) {
      return NextResponse.json({ error: "Invalid week parameter." }, { status: 400 });
    }

    const voterContext = await getVoteRequestContext(request);
    if (!voterContext) {
      return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
    }

    const matchup = await getVoteEngine().getNextMatchup({
      weekSlug,
      cookieId: voterContext.userId,
      fingerprintHash: voterContext.fingerprintHash,
    });

    if (!matchup) {
      return NextResponse.json({ error: "No more matchups available." }, { status: 404 });
    }

    return NextResponse.json(matchup);
  } catch {
    return NextResponse.json({ error: "Failed to load the next matchup." }, { status: 500 });
  }
}
