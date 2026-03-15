import { NextResponse } from "next/server";
import { z } from "zod";

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
    const body = voteSchema.parse(await request.json());
    const voterContext = await getVoteRequestContext(request);
    if (!voterContext) {
      return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
    }

    const vote = await getVoteEngine().castVote({
      weekSlug: body.weekSlug!,
      matchupId: body.matchupId,
      winnerEntryId: body.winnerEntryId,
      loserEntryId: body.loserEntryId,
      idempotencyKey: body.idempotencyKey,
      cookieId: voterContext.userId,
      fingerprintHash: voterContext.fingerprintHash,
    });

    return NextResponse.json(vote);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vote failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
