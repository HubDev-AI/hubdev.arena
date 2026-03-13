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

export function getVoteEngine() {
  const dataMode = getDataMode();
  const hasSec4 = Boolean(getEnv().SEC4_INTERNAL_BASE_URL && getEnv().SEC4_INTERNAL_TOKEN);

  if (dataMode === "mock" || !hasSec4) {
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
        return service.setWeekStatus({
          weekSlug,
          adminEmail,
          action: "lock_results",
        });
      },
    };
  }

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
