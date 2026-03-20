import { createClient } from "@supabase/supabase-js";

import { getDataMode, getEnv } from "@/lib/env";
import { getArenaService } from "@/lib/server/runtime";

type NextVoteInput = {
  weekSlug: string;
  cookieId: string;
  fingerprintHash: string;
};

type CastVoteInput = {
  weekSlug: string;
  matchupId: string;
  winnerEntryId: string;
  loserEntryId: string;
  cookieId: string;
  fingerprintHash: string;
  idempotencyKey: string;
};

async function callSec4<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const env = getEnv();

  if (!env.SEC4_INTERNAL_BASE_URL || !env.SEC4_INTERNAL_TOKEN) {
    throw new Error("sec4 internal runtime is not configured.");
  }

  const response = await fetch(`${env.SEC4_INTERNAL_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-sec4-internal-token": env.SEC4_INTERNAL_TOKEN,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "sec4 internal request failed.");
  }

  return (await response.json()) as T;
}

const SHORT_WINDOW_LIMIT = 30;
const DAILY_LIMIT = 100;
const SHORT_WINDOW_MS = 10 * 60 * 1_000;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1_000;

function countVotesWithinWindow(voteTimestamps: string[], now: Date, windowMs: number) {
  const cutoff = now.getTime() - windowMs;
  return voteTimestamps.filter((ts) => new Date(ts).getTime() >= cutoff).length;
}

function assertRpcRateLimits(
  sessionVoteTimestamps: string[],
  fingerprintVoteTimestamps: string[],
  now: Date,
) {
  const sessionShort = countVotesWithinWindow(sessionVoteTimestamps, now, SHORT_WINDOW_MS);
  const fpShort = countVotesWithinWindow(fingerprintVoteTimestamps, now, SHORT_WINDOW_MS);
  if (sessionShort >= SHORT_WINDOW_LIMIT || fpShort >= SHORT_WINDOW_LIMIT) {
    throw new Error("Voting is limited to 30 votes per 10 minutes.");
  }

  const sessionDaily = countVotesWithinWindow(sessionVoteTimestamps, now, DAILY_WINDOW_MS);
  const fpDaily = countVotesWithinWindow(fingerprintVoteTimestamps, now, DAILY_WINDOW_MS);
  if (sessionDaily >= DAILY_LIMIT || fpDaily >= DAILY_LIMIT) {
    throw new Error("Voting is limited to 100 votes per day.");
  }
}

async function castVoteViaRpc(input: CastVoteInput) {
  const env = getEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Resolve week ID from slug
  const { data: week, error: weekError } = await supabase
    .from("weeks")
    .select("id")
    .eq("slug", input.weekSlug)
    .single();
  if (weekError || !week) throw new Error(`Week ${input.weekSlug} not found.`);

  // Ensure voter session exists
  const { data: existingSession } = await supabase
    .from("voter_sessions")
    .select("id")
    .eq("week_id", week.id)
    .eq("cookie_id", input.cookieId)
    .maybeSingle();

  let sessionId: string;
  if (existingSession) {
    sessionId = existingSession.id;
  } else {
    const { data: newSession, error: sessionError } = await supabase
      .from("voter_sessions")
      .insert({
        week_id: week.id,
        cookie_id: input.cookieId,
        fingerprint_hash: input.fingerprintHash,
      })
      .select("id")
      .single();
    if (sessionError || !newSession) throw new Error("Failed to create voter session.");
    sessionId = newSession.id;
  }

  // Rate limit check: query existing votes by session and fingerprint
  const { data: sessionVotes } = await supabase
    .from("votes")
    .select("created_at")
    .eq("voter_session_id", sessionId);

  const { data: fingerprintVotes } = await supabase
    .from("votes")
    .select("created_at")
    .eq("week_id", week.id)
    .eq("fingerprint_hash", input.fingerprintHash);

  assertRpcRateLimits(
    (sessionVotes ?? []).map((v) => v.created_at),
    (fingerprintVotes ?? []).map((v) => v.created_at),
    new Date(),
  );

  // Call the transactional PG function
  const { data, error } = await supabase.rpc("cast_vote", {
    p_week_id: week.id,
    p_matchup_id: input.matchupId,
    p_winner_entry_id: input.winnerEntryId,
    p_loser_entry_id: input.loserEntryId,
    p_voter_session_id: sessionId,
    p_fingerprint_hash: input.fingerprintHash,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  return {
    vote: { id: row.vote_id },
    winner: { eloRating: row.winner_new_elo, wins: row.winner_wins },
    loser: { eloRating: row.loser_new_elo, losses: row.loser_losses },
  };
}

export function getVoteEngine() {
  const dataMode = getDataMode();
  const hasSec4 = Boolean(getEnv().SEC4_INTERNAL_BASE_URL && getEnv().SEC4_INTERNAL_TOKEN);

  if (dataMode === "mock") {
    const service = getArenaService();
    return {
      getNextMatchup(input: NextVoteInput) {
        return service.getVoteDeck(input);
      },
      castVote(input: CastVoteInput) {
        return service.castVote(input);
      },
      getLeaderboard(weekSlug: string) {
        return service.getLeaderboard({ weekSlug });
      },
      openVoting(weekSlug: string, adminEmail: string) {
        return service.openVoting({ weekSlug, adminEmail });
      },
      lockWeek(weekSlug: string, adminEmail: string) {
        return service.setWeekStatus({ weekSlug, adminEmail, action: "lock_results" });
      },
    };
  }

  if (hasSec4) {
    return {
      getNextMatchup(input: NextVoteInput) {
        return callSec4("/internal/v1/vote/next", {
          method: "POST",
          body: JSON.stringify(input),
        });
      },
      castVote(input: CastVoteInput) {
        return callSec4("/internal/v1/vote", {
          method: "POST",
          body: JSON.stringify(input),
        });
      },
      getLeaderboard(weekSlug: string) {
        return callSec4(`/internal/v1/leaderboard?week=${encodeURIComponent(weekSlug)}`);
      },
      openVoting(weekSlug: string, adminEmail: string) {
        return callSec4("/internal/v1/admin/weeks/open-voting", {
          method: "POST",
          body: JSON.stringify({ weekSlug, adminEmail }),
        });
      },
      lockWeek(weekSlug: string, adminEmail: string) {
        return callSec4("/internal/v1/admin/weeks/lock", {
          method: "POST",
          body: JSON.stringify({ weekSlug, adminEmail }),
        });
      },
    };
  }

  // Supabase mode without sec4 — use transactional PG function for votes
  const service = getArenaService();
  return {
    getNextMatchup(input: NextVoteInput) {
      return service.getVoteDeck(input);
    },
    castVote(input: CastVoteInput) {
      return castVoteViaRpc(input);
    },
    getLeaderboard(weekSlug: string) {
      return service.getLeaderboard({ weekSlug });
    },
    openVoting(weekSlug: string, adminEmail: string) {
      return service.openVoting({ weekSlug, adminEmail });
    },
    lockWeek(weekSlug: string, adminEmail: string) {
      return service.setWeekStatus({ weekSlug, adminEmail, action: "lock_results" });
    },
  };
}
