import { NextResponse } from "next/server";
import { z } from "zod";

import { assertCsrf } from "@/lib/security/csrf";
import { getVoteEngine } from "@/lib/server/vote-engine";
import { getVoteRequestContext } from "@/lib/server/vote-request-context";

const voteSchema = z.object({
  matchupId: z.string().min(1),
  winnerEntryId: z.string().min(1),
  loserEntryId: z.string().min(1),
  idempotencyKey: z.string().min(8),
  weekSlug: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    assertCsrf(request);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const voterContext = await getVoteRequestContext(request);
    if (!voterContext) {
      return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const body = voteSchema.parse(json);

    const vote = await getVoteEngine().castVote({
      weekSlug: body.weekSlug,
      matchupId: body.matchupId,
      winnerEntryId: body.winnerEntryId,
      loserEntryId: body.loserEntryId,
      idempotencyKey: body.idempotencyKey,
      cookieId: voterContext.userId,
      fingerprintHash: voterContext.fingerprintHash,
    });

    return NextResponse.json(vote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data.", fields: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    if (error instanceof Error && /rate.?limit|limited/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
