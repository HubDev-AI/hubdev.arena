import { randomUUID } from "node:crypto";

import { DEFAULT_ELO_RATING, applyEloResult } from "@/lib/domain/elo";
import { generateUniqueMatchups, selectNextMatchup } from "@/lib/domain/matchups";
import { transitionWeekStatus } from "@/lib/domain/weeks";
import type {
  ArenaRepository,
  Entry,
  LeaderboardRow,
  VoteDeck,
  VoteDeckEntry,
} from "@/lib/server/types";

const SHORT_WINDOW_LIMIT = 30;
const DAILY_LIMIT = 100;
const SHORT_WINDOW_MS = 10 * 60 * 1_000;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1_000;

type ArenaServiceOptions = {
  now?: () => Date;
  random?: () => number;
  adminAllowlist?: string[];
};

type SubmitEntryInput = {
  weekSlug: string;
  builderId: string;
  title: string;
  oneLiner: string;
  liveUrl: string;
  demoAssetPath: string;
};

type ReviewEntryInput = {
  adminEmail: string;
  entryId: string;
  decision: "approved" | "rejected";
};

type OpenVotingInput = {
  adminEmail: string;
  weekSlug: string;
};

type CreateWeekInput = {
  adminEmail: string;
  slug: string;
  themeTitle: string;
  themeDescription: string;
  timezone: string;
  submissionOpenAt: string;
  submissionCloseAt: string;
  votingOpenAt: string;
  votingCloseAt: string;
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

type GetVoteDeckInput = {
  weekSlug: string;
  cookieId: string;
  fingerprintHash: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensure(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(message);
  }
}

function sortLeaderboardEntries(entries: Entry[]) {
  return [...entries].sort((left, right) => {
    if (right.eloRating !== left.eloRating) {
      return right.eloRating - left.eloRating;
    }

    if (right.wins !== left.wins) {
      return right.wins - left.wins;
    }

    if (left.losses !== right.losses) {
      return left.losses - right.losses;
    }

    return (left.approvedAt ?? "").localeCompare(right.approvedAt ?? "");
  });
}

function countVotesWithinWindow(voteTimestamps: string[], now: Date, windowMs: number) {
  const cutoff = now.getTime() - windowMs;
  return voteTimestamps.filter((timestamp) => new Date(timestamp).getTime() >= cutoff).length;
}

function assertRateLimits(
  sessionVoteTimestamps: string[],
  fingerprintVoteTimestamps: string[],
  now: Date,
) {
  const sessionShortWindow = countVotesWithinWindow(
    sessionVoteTimestamps,
    now,
    SHORT_WINDOW_MS,
  );
  const fingerprintShortWindow = countVotesWithinWindow(
    fingerprintVoteTimestamps,
    now,
    SHORT_WINDOW_MS,
  );

  if (
    sessionShortWindow >= SHORT_WINDOW_LIMIT ||
    fingerprintShortWindow >= SHORT_WINDOW_LIMIT
  ) {
    throw new Error("Voting is limited to 30 votes per 10 minutes.");
  }

  const sessionDaily = countVotesWithinWindow(sessionVoteTimestamps, now, DAILY_WINDOW_MS);
  const fingerprintDaily = countVotesWithinWindow(
    fingerprintVoteTimestamps,
    now,
    DAILY_WINDOW_MS,
  );

  if (sessionDaily >= DAILY_LIMIT || fingerprintDaily >= DAILY_LIMIT) {
    throw new Error("Voting is limited to 100 votes per day.");
  }
}

function buildVoteDeckEntry(
  entry: Entry,
  builderName: string,
  foundingBuilder: boolean,
): VoteDeckEntry {
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    oneLiner: entry.oneLiner,
    liveUrl: entry.liveUrl,
    demoAssetPath: entry.demoAssetPath,
    builderName,
    foundingBuilder,
  };
}

export function createArenaService(
  repository: ArenaRepository,
  {
    now = () => new Date(),
    random = Math.random,
    adminAllowlist = ["admin@example.com"],
  }: ArenaServiceOptions = {},
) {
  async function assertAdmin(adminEmail: string) {
    if (!adminAllowlist.includes(adminEmail)) {
      throw new Error("Admin access denied.");
    }
  }

  async function loadWeek(weekSlug: string) {
    const week = await repository.getWeekBySlug(weekSlug);
    ensure(week, `Week ${weekSlug} was not found.`);
    return week;
  }

  async function loadEntry(entryId: string) {
    const entry = await repository.getEntryById(entryId);
    ensure(entry, `Entry ${entryId} was not found.`);
    return entry;
  }

  async function loadProfile(profileId: string) {
    const profile = await repository.getProfileById(profileId);
    ensure(profile, `Profile ${profileId} was not found.`);
    return profile;
  }

  async function saveEntryWithUniqueSlug(entry: Entry, weekId: string, title: string) {
    const allEntries = await repository.listEntriesByWeek(weekId);
    const baseSlug = slugify(title);
    let candidate = baseSlug || "untitled-entry";
    let suffix = 2;

    while (
      allEntries.some(
        (existingEntry) =>
          existingEntry.id !== entry.id && existingEntry.slug === candidate,
      )
    ) {
      candidate = `${baseSlug || "untitled-entry"}-${suffix}`;
      suffix += 1;
    }

    entry.slug = candidate;
    return repository.saveEntry(entry);
  }

  return {
    async submitEntry(input: SubmitEntryInput) {
      const currentTime = now().toISOString();
      const week = await loadWeek(input.weekSlug);

      if (week.status !== "submissions_open") {
        throw new Error("Submissions are not open for this week.");
      }

      await loadProfile(input.builderId);

      const builderEntries = await repository.listEntriesByBuilder(week.id, input.builderId);
      const approvedEntry = builderEntries.find((entry) => entry.status === "approved");
      if (approvedEntry) {
        throw new Error("Builders can have only one approved entry per week.");
      }

      const pendingEntry = builderEntries.find((entry) => entry.status === "pending");

      if (pendingEntry) {
        pendingEntry.title = input.title;
        pendingEntry.oneLiner = input.oneLiner;
        pendingEntry.liveUrl = input.liveUrl;
        pendingEntry.demoAssetPath = input.demoAssetPath;
        pendingEntry.submittedAt = currentTime;
        return saveEntryWithUniqueSlug(pendingEntry, week.id, input.title);
      }

      const entry: Entry = {
        id: randomUUID(),
        weekId: week.id,
        builderId: input.builderId,
        slug: "",
        title: input.title,
        oneLiner: input.oneLiner,
        liveUrl: input.liveUrl,
        demoAssetPath: input.demoAssetPath,
        status: "pending",
        eloRating: DEFAULT_ELO_RATING,
        wins: 0,
        losses: 0,
        appearanceCount: 0,
        submittedAt: currentTime,
        approvedAt: null,
        rejectedAt: null,
        rejectionNote: null,
      };

      return saveEntryWithUniqueSlug(entry, week.id, input.title);
    },

    async listWeeks() {
      const weeks = await repository.listWeeks();
      return [...weeks].sort(
        (left, right) =>
          new Date(right.submissionOpenAt).getTime() -
          new Date(left.submissionOpenAt).getTime(),
      );
    },

    async getCurrentWeek() {
      const weeks = await repository.listWeeks();
      const activeWeek = weeks.find((week) =>
        ["submissions_open", "voting_open", "locked"].includes(week.status),
      );

      if (activeWeek) {
        return activeWeek;
      }

      return [...weeks].sort(
        (left, right) =>
          new Date(right.submissionOpenAt).getTime() -
          new Date(left.submissionOpenAt).getTime(),
      )[0] ?? null;
    },

    async createWeek({
      adminEmail,
      slug,
      themeTitle,
      themeDescription,
      timezone,
      submissionOpenAt,
      submissionCloseAt,
      votingOpenAt,
      votingCloseAt,
    }: CreateWeekInput) {
      await assertAdmin(adminEmail);

      const existingWeek = await repository.getWeekBySlug(slug);
      if (existingWeek) {
        throw new Error("A week with this slug already exists.");
      }

      const week = {
        id: randomUUID(),
        slug,
        themeTitle,
        themeDescription,
        timezone,
        submissionOpenAt,
        submissionCloseAt,
        votingOpenAt,
        votingCloseAt,
        status: "draft" as const,
      };

      return repository.saveWeek(week);
    },

    async reviewEntry({ adminEmail, entryId, decision }: ReviewEntryInput) {
      await assertAdmin(adminEmail);

      const currentTime = now().toISOString();
      const entry = await loadEntry(entryId);

      if (decision === "approved") {
        const siblingEntries = await repository.listEntriesByBuilder(
          entry.weekId,
          entry.builderId,
        );
        const conflictingApprovedEntry = siblingEntries.find(
          (siblingEntry) =>
            siblingEntry.id !== entry.id && siblingEntry.status === "approved",
        );

        if (conflictingApprovedEntry) {
          throw new Error("This builder already has one approved entry for the week.");
        }
      }

      entry.status = decision;
      entry.approvedAt = decision === "approved" ? currentTime : null;
      return repository.saveEntry(entry);
    },

    async setWeekStatus({
      adminEmail,
      weekSlug,
      action,
    }: {
      adminEmail: string;
      weekSlug: string;
      action: "open_submissions" | "lock_results" | "archive";
    }) {
      await assertAdmin(adminEmail);

      const week = await loadWeek(weekSlug);
      week.status = transitionWeekStatus(week.status, action);
      return repository.saveWeek(week);
    },

    async openVoting({ adminEmail, weekSlug }: OpenVotingInput) {
      await assertAdmin(adminEmail);

      const currentTime = now().toISOString();
      const week = await loadWeek(weekSlug);
      const approvedEntries = (await repository.listEntriesByWeek(week.id)).filter(
        (entry) => entry.status === "approved",
      );
      const matchups = generateUniqueMatchups(approvedEntries.map((entry) => entry.id)).map(
        ([entryAId, entryBId]) => ({
          id: `matchup-${entryAId}-${entryBId}`,
          weekId: week.id,
          entryAId,
          entryBId,
          exposureCount: 0,
          voteCount: 0,
          createdAt: currentTime,
        }),
      );

      week.status = transitionWeekStatus(week.status, "open_voting");
      await repository.saveWeek(week);
      await repository.replaceMatchups(week.id, matchups);

      return {
        matchupsCreated: matchups.length,
      };
    },

    async getWeekAdminDetail(weekSlug: string) {
      const week = await loadWeek(weekSlug);
      const entries = await repository.listEntriesByWeek(week.id);
      const matchups = await repository.listMatchupsByWeek(week.id);
      const leaderboard = await this.getLeaderboard({ weekSlug });

      return {
        week,
        entries: entries.sort(
          (left, right) =>
            new Date(right.submittedAt).getTime() -
            new Date(left.submittedAt).getTime(),
        ),
        matchups,
        leaderboard,
      };
    },

    async getVoteDeck({ weekSlug, cookieId, fingerprintHash }: GetVoteDeckInput) {
      const currentTime = now().toISOString();
      const week = await loadWeek(weekSlug);

      if (week.status !== "voting_open") {
        throw new Error("Voting is not open for this week.");
      }

      let voterSession = await repository.getVoterSessionByCookie(week.id, cookieId);
      if (!voterSession) {
        voterSession = {
          id: randomUUID(),
          weekId: week.id,
          userId: null,
          cookieId,
          fingerprintHash,
          votesCast: 0,
          lastSeenAt: currentTime,
          createdAt: currentTime,
        };
      }

      const sessionVotes = await repository.listVotesBySession(voterSession.id);
      const matchups = await repository.listMatchupsByWeek(week.id);
      const selectedMatchup = selectNextMatchup({
        matchups: matchups.map((matchup) => ({
          id: matchup.id,
          entryAId: matchup.entryAId,
          entryBId: matchup.entryBId,
          exposureCount: matchup.exposureCount,
        })),
        seenMatchupIds: sessionVotes.map((vote) => vote.matchupId),
        previousEntryIds:
          sessionVotes.length === 0
            ? []
            : [
                sessionVotes[sessionVotes.length - 1].winnerEntryId,
                sessionVotes[sessionVotes.length - 1].loserEntryId,
              ],
        random,
      });

      if (!selectedMatchup) {
        return null;
      }

      const matchup = await repository.getMatchupById(selectedMatchup.id);
      ensure(matchup, "Selected matchup was not found.");
      matchup.exposureCount += 1;
      await repository.saveMatchup(matchup);

      const [leftEntry, rightEntry] = await repository.listEntriesByIds([
        matchup.entryAId,
        matchup.entryBId,
      ]);
      ensure(leftEntry, "Left entry was not found.");
      ensure(rightEntry, "Right entry was not found.");

      leftEntry.appearanceCount += 1;
      rightEntry.appearanceCount += 1;
      await repository.saveEntry(leftEntry);
      await repository.saveEntry(rightEntry);

      const [leftBuilder, rightBuilder] = await Promise.all([
        loadProfile(leftEntry.builderId),
        loadProfile(rightEntry.builderId),
      ]);

      voterSession.lastSeenAt = currentTime;
      voterSession.fingerprintHash = fingerprintHash;
      await repository.saveVoterSession(voterSession);

      return {
        matchupId: matchup.id,
        leftEntry: buildVoteDeckEntry(
          leftEntry,
          leftBuilder.displayName,
          leftBuilder.foundingBuilder,
        ),
        rightEntry: buildVoteDeckEntry(
          rightEntry,
          rightBuilder.displayName,
          rightBuilder.foundingBuilder,
        ),
        votesCast: voterSession.votesCast,
        votingClosesAt: week.votingCloseAt,
      } satisfies VoteDeck;
    },

    async castVote(input: CastVoteInput) {
      const currentTime = now();
      const week = await loadWeek(input.weekSlug);

      if (week.status !== "voting_open") {
        throw new Error("Voting is not open for this week.");
      }

      const existingVote = await repository.getVoteByIdempotencyKey(
        week.id,
        input.idempotencyKey,
      );
      if (existingVote) {
        throw new Error("Duplicate vote rejected because the idempotency key was reused.");
      }

      let voterSession = await repository.getVoterSessionByCookie(week.id, input.cookieId);
      if (!voterSession) {
        voterSession = {
          id: randomUUID(),
          weekId: week.id,
          userId: null,
          cookieId: input.cookieId,
          fingerprintHash: input.fingerprintHash,
          votesCast: 0,
          lastSeenAt: currentTime.toISOString(),
          createdAt: currentTime.toISOString(),
        };
      }

      const matchup = await repository.getMatchupById(input.matchupId);
      ensure(matchup, `Matchup ${input.matchupId} was not found.`);

      if (matchup.weekId !== week.id) {
        throw new Error("This matchup does not belong to the requested week.");
      }

      const matchupEntryIds = new Set([matchup.entryAId, matchup.entryBId]);
      if (
        !matchupEntryIds.has(input.winnerEntryId) ||
        !matchupEntryIds.has(input.loserEntryId)
      ) {
        throw new Error("Vote payload does not match the selected matchup.");
      }

      if (input.winnerEntryId === input.loserEntryId) {
        throw new Error("Winner and loser entries must be different.");
      }

      const sessionVotes = await repository.listVotesBySession(voterSession.id);
      const repeatVote = sessionVotes.find((vote) => vote.matchupId === matchup.id);
      if (repeatVote) {
        throw new Error("This account already voted on the selected matchup.");
      }

      const fingerprintVotes = await repository.listVotesByFingerprint(
        week.id,
        input.fingerprintHash,
      );
      assertRateLimits(
        sessionVotes.map((vote) => vote.createdAt),
        fingerprintVotes.map((vote) => vote.createdAt),
        currentTime,
      );

      const winner = await loadEntry(input.winnerEntryId);
      const loser = await loadEntry(input.loserEntryId);
      const eloResult = applyEloResult({
        winnerRating: winner.eloRating,
        loserRating: loser.eloRating,
      });

      winner.eloRating = eloResult.winnerRating;
      winner.wins += 1;
      loser.eloRating = eloResult.loserRating;
      loser.losses += 1;
      matchup.voteCount += 1;
      voterSession.votesCast += 1;
      voterSession.fingerprintHash = input.fingerprintHash;
      voterSession.lastSeenAt = currentTime.toISOString();

      const vote = {
        id: randomUUID(),
        weekId: week.id,
        matchupId: matchup.id,
        winnerEntryId: winner.id,
        loserEntryId: loser.id,
        voterSessionId: voterSession.id,
        fingerprintHash: input.fingerprintHash,
        idempotencyKey: input.idempotencyKey,
        createdAt: currentTime.toISOString(),
      };

      await repository.saveEntry(winner);
      await repository.saveEntry(loser);
      await repository.saveMatchup(matchup);
      await repository.saveVoterSession(voterSession);
      await repository.saveVote(vote);

      return {
        vote,
        winner,
        loser,
      };
    },

    async getLeaderboard({ weekSlug }: { weekSlug: string }) {
      const week = await loadWeek(weekSlug);
      const approvedEntries = (await repository.listEntriesByWeek(week.id)).filter(
        (entry) => entry.status === "approved",
      );
      const profiles = await repository.listProfiles();
      const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

      return sortLeaderboardEntries(approvedEntries).map((entry, index) => {
        const builder = profilesById.get(entry.builderId);
        ensure(builder, `Builder ${entry.builderId} was not found.`);

        return {
          rank: index + 1,
          entrySlug: entry.slug,
          title: entry.title,
          builderName: builder.displayName,
          liveUrl: entry.liveUrl,
          demoAssetUrl: entry.demoAssetPath,
          elo: entry.eloRating,
          wins: entry.wins,
          losses: entry.losses,
        } satisfies LeaderboardRow;
      });
    },

    async getFeaturedEntries(weekSlug: string, limit = 3) {
      return (await this.getLeaderboard({ weekSlug })).slice(0, limit);
    },

    async getEntryDetail(entrySlug: string) {
      const entry = await repository.getEntryBySlug(entrySlug);
      if (!entry) {
        return null;
      }

      const week = (await repository.listWeeks()).find(
        (candidate) => candidate.id === entry.weekId,
      );
      ensure(week, `Week ${entry.weekId} was not found.`);
      const builder = await loadProfile(entry.builderId);

      return {
        entry,
        week,
        builder,
      };
    },

    async getMySubmissions(builderId: string) {
      const weeks = await repository.listWeeks();
      const entries = await Promise.all(
        weeks.map(async (week) => ({
          week,
          entries: await repository.listEntriesByBuilder(week.id, builderId),
        })),
      );

      return entries.filter((group) => group.entries.length > 0);
    },

    async listPastWinners(limit = 3) {
      const weeks = (await repository.listWeeks()).filter((week) =>
        ["locked", "archived"].includes(week.status),
      );

      const winners = await Promise.all(
        weeks.map(async (week) => ({
          week,
          topEntry: (await this.getLeaderboard({ weekSlug: week.slug }))[0] ?? null,
        })),
      );

      return winners.filter((week) => week.topEntry).slice(0, limit);
    },
  };
}
