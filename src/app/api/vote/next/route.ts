import { NextResponse } from "next/server";

import { getVoteRequestContext } from "@/lib/server/vote-request-context";
import { getVoteEngine } from "@/lib/server/vote-engine";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const weekSlug = url.searchParams.get("week");

    if (!weekSlug) {
      return NextResponse.json({ error: "week is required." }, { status: 400 });
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load the next matchup.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
