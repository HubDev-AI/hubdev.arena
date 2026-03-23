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

    const result = await getVoteEngine().getNextMatchup({
      weekSlug,
      cookieId: voterContext.userId,
      fingerprintHash: voterContext.fingerprintHash,
    });

    // H36: Return 200 with status indicator when all matchups are voted,
    // instead of 404 which signals a missing resource.
    if (
      !result ||
      (typeof result === "object" &&
        result !== null &&
        "status" in (result as Record<string, unknown>) &&
        (result as Record<string, unknown>).status === "all_voted")
    ) {
      return NextResponse.json(
        { status: "all_voted", message: "You've voted on all available matchups!" },
        { status: 200 },
      );
    }

    // Unwrap discriminated union: the in-memory service returns { status: "found", deck }
    // while sec4/RPC paths return the deck directly.
    const resultObj = result as Record<string, unknown>;
    const matchup = "deck" in resultObj ? resultObj.deck : result;

    return NextResponse.json(matchup);
  } catch {
    return NextResponse.json({ error: "Failed to load the next matchup." }, { status: 500 });
  }
}
