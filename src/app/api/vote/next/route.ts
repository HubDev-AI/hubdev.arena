import { NextResponse } from "next/server";

import { getSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";
import { attachVoterCookie, getVoterIdentity } from "@/lib/server/voter-identity";
import { createServiceRoleClient } from "@/lib/supabase";
import { getDataMode } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const weekSlug = url.searchParams.get("week");

    if (!weekSlug) {
      return NextResponse.json({ error: "week is required." }, { status: 400 });
    }

    // Auth is optional — anonymous voters see the first matchup before signing in
    const user = await getSession();
    const userId = user?.id ?? null;

    // Get voter identity from the signed cookie (creates a new UUID if absent)
    const voterIdentity = await getVoterIdentity(request);

    // If signed in and in Supabase mode, opportunistically link userId to the
    // anonymous voter session so subsequent votes are attributed to the user.
    if (userId && getDataMode() !== "mock") {
      const supabase = createServiceRoleClient();
      const { data: weekRow } = await supabase
        .from("weeks")
        .select("id")
        .eq("slug", weekSlug)
        .maybeSingle();

      if (weekRow) {
        await supabase
          .from("voter_sessions")
          .update({ user_id: userId })
          .eq("week_id", weekRow.id as string)
          .eq("cookie_id", voterIdentity.cookieId)
          .is("user_id", null);
      }
    }

    const arenaService = getArenaService();
    const matchup = await arenaService.getVoteDeck({
      weekSlug,
      cookieId: voterIdentity.cookieId,
      fingerprintHash: voterIdentity.fingerprintHash,
    });

    if (!matchup) {
      return NextResponse.json({ error: "No more matchups available." }, { status: 404 });
    }

    const response = NextResponse.json(matchup);
    if (voterIdentity.shouldSetCookie) {
      attachVoterCookie(response, voterIdentity.cookieId);
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load the next matchup.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
