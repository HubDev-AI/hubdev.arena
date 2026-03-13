import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getDataMode, getEnv } from "@/lib/env";
import { getSession } from "@/lib/server/auth";
import { getArenaService } from "@/lib/server/runtime";
import { createServiceRoleClient } from "@/lib/supabase";
import { hashFingerprint } from "@/lib/security/fingerprint";

const voteSchema = z.object({
  matchupId: z.string().min(1),
  winnerEntryId: z.string().min(1),
  loserEntryId: z.string().min(1),
  idempotencyKey: z.string().min(8),
  weekSlug: z.string().min(1).optional(),
  cookieId: z.string().min(1).optional(),
  fingerprintHash: z.string().optional(),
});

function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "127.0.0.1";
  }
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function POST(request: Request) {
  // Auth is required to vote
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Sign in to vote." }, { status: 401 });
  }

  const userId = user.id;

  try {
    const body = voteSchema.parse(await request.json());
    const weekSlug = body.weekSlug ?? "agents-in-the-arena";

    // Compute fingerprint from request signals if not supplied by the client
    const fingerprintHash =
      body.fingerprintHash ??
      (await hashFingerprint({
        ipAddress: getRequestIpAddress(request),
        userAgent: request.headers.get("user-agent") ?? "unknown",
        secret: getEnv().HUBDEV_FINGERPRINT_SECRET,
      }));

    // cookieId falls back to userId if not provided
    const cookieId = body.cookieId ?? userId;

    const dataMode = getDataMode();

    // -------------------------------------------------------------------------
    // Mock mode: delegate to arena-service (in-memory)
    // -------------------------------------------------------------------------
    if (dataMode === "mock") {
      const arenaService = getArenaService();
      const result = await arenaService.castVote({
        weekSlug,
        matchupId: body.matchupId,
        winnerEntryId: body.winnerEntryId,
        loserEntryId: body.loserEntryId,
        idempotencyKey: body.idempotencyKey,
        cookieId,
        fingerprintHash,
      });

      return NextResponse.json({
        voteId: result.vote.id,
        winnerNewElo: result.winner.eloRating,
        loserNewElo: result.loser.eloRating,
        sessionVotesCast: result.vote.voterSessionId ? 1 : 0,
      });
    }

    // -------------------------------------------------------------------------
    // Supabase mode: call cast_vote() Postgres function directly
    // -------------------------------------------------------------------------
    const supabase = createServiceRoleClient();

    // 1. Resolve week by slug
    const { data: weekRow, error: weekError } = await supabase
      .from("weeks")
      .select("id")
      .eq("slug", weekSlug)
      .single();

    if (weekError || !weekRow) {
      return NextResponse.json({ error: `Week '${weekSlug}' was not found.` }, { status: 404 });
    }

    const weekId = weekRow.id as string;

    // 2. Look up or create voter session; link userId if needed
    const { data: existingSession, error: sessionLookupError } = await supabase
      .from("voter_sessions")
      .select("id, user_id")
      .eq("week_id", weekId)
      .eq("cookie_id", cookieId)
      .maybeSingle();

    if (sessionLookupError) {
      throw sessionLookupError;
    }

    let voterSessionId: string;

    if (existingSession) {
      voterSessionId = existingSession.id as string;
      // Link userId if session was created anonymously
      if (!existingSession.user_id && userId) {
        const { error: updateError } = await supabase
          .from("voter_sessions")
          .update({ user_id: userId })
          .eq("id", voterSessionId);
        if (updateError) {
          throw updateError;
        }
      }
    } else {
      // Create new voter session with userId already set
      voterSessionId = randomUUID();
      const now = new Date().toISOString();
      const { error: insertError } = await supabase.from("voter_sessions").insert({
        id: voterSessionId,
        week_id: weekId,
        user_id: userId,
        cookie_id: cookieId,
        fingerprint_hash: fingerprintHash,
        votes_cast: 0,
        last_seen_at: now,
        created_at: now,
      });
      if (insertError) {
        if (insertError.code === "23505") {
          // Concurrent insert hit unique constraint — re-fetch the session
          const { data: reFetched } = await supabase
            .from("voter_sessions")
            .select("id")
            .eq("week_id", weekId)
            .eq("cookie_id", cookieId)
            .single();
          if (reFetched) {
            voterSessionId = reFetched.id as string;
          }
        } else {
          throw insertError;
        }
      }
    }

    // 3. Call cast_vote() Postgres RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc("cast_vote", {
      p_week_id: weekId,
      p_matchup_id: body.matchupId,
      p_winner_entry_id: body.winnerEntryId,
      p_loser_entry_id: body.loserEntryId,
      p_voter_session_id: voterSessionId,
      p_fingerprint_hash: fingerprintHash,
      p_idempotency_key: body.idempotencyKey,
    });

    if (rpcError) {
      // 23505 = unique_violation — duplicate idempotency key
      if (rpcError.code === "23505" || rpcError.message?.includes("23505")) {
        return NextResponse.json({ duplicate: true }, { status: 200 });
      }
      throw rpcError;
    }

    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;

    return NextResponse.json({
      voteId: row.vote_id,
      winnerNewElo: row.winner_new_elo,
      loserNewElo: row.loser_new_elo,
      sessionVotesCast: row.session_votes_cast,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vote failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
