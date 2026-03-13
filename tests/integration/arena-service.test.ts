import { createArenaService } from "@/lib/server/arena-service";
import { createInMemoryArenaRepository } from "@/lib/server/in-memory-arena-repository";
import type {
  Entry,
  Matchup,
  Profile,
  Vote,
  VoterSession,
  Week,
} from "@/lib/server/types";

const NOW = new Date("2026-03-10T12:00:00.000Z");

function makeWeek(status: Week["status"] = "submissions_open"): Week {
  return {
    id: "week-1",
    slug: "agents-in-the-arena",
    themeTitle: "Agents in the Arena",
    themeDescription: "Build an AI app that feels competitive on first touch.",
    timezone: "America/Los_Angeles",
    submissionOpenAt: "2026-03-06T20:00:00.000Z",
    submissionCloseAt: "2026-03-10T07:00:00.000Z",
    votingOpenAt: "2026-03-10T16:00:00.000Z",
    votingCloseAt: "2026-03-13T07:00:00.000Z",
    status,
  };
}

function makeProfile(index: number): Profile {
  return {
    id: `builder-${index}`,
    email: `builder-${index}@example.com`,
    displayName: `Builder ${index}`,
    username: `builder${index}`,
    avatarUrl: `https://example.com/avatar-${index}.png`,
    authProvider: "twitter",
    foundingBuilder: index <= 2,
    createdAt: NOW.toISOString(),
  };
}

function makeApprovedEntry(index: number, overrides: Partial<Entry> = {}): Entry {
  return {
    id: `entry-${index}`,
    weekId: "week-1",
    builderId: `builder-${index}`,
    slug: `entry-${index}`,
    title: `Entry ${index}`,
    oneLiner: `Pitch ${index}`,
    liveUrl: `https://entry-${index}.example.com`,
    demoAssetPath: `demo-assets/entry-${index}.gif`,
    status: "approved",
    eloRating: 1200,
    wins: 0,
    losses: 0,
    appearanceCount: 0,
    submittedAt: NOW.toISOString(),
    approvedAt: new Date(NOW.getTime() + index * 1_000).toISOString(),
    ...overrides,
  };
}

function makeMatchups(entries: Entry[]): Matchup[] {
  const matchups: Matchup[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    for (let opponentIndex = index + 1; opponentIndex < entries.length; opponentIndex += 1) {
      matchups.push({
        id: `matchup-${entries[index].id}-${entries[opponentIndex].id}`,
        weekId: "week-1",
        entryAId: entries[index].id,
        entryBId: entries[opponentIndex].id,
        exposureCount: 0,
        voteCount: 0,
        createdAt: NOW.toISOString(),
      });
    }
  }

  return matchups;
}

function makeVote(
  index: number,
  matchup: Matchup,
  winnerEntryId: string,
  loserEntryId: string,
  sessionId: string,
  fingerprintHash: string,
  createdAt: string,
): Vote {
  return {
    id: `vote-${index}`,
    weekId: "week-1",
    matchupId: matchup.id,
    winnerEntryId,
    loserEntryId,
    voterSessionId: sessionId,
    fingerprintHash,
    idempotencyKey: `vote-key-${index}`,
    createdAt,
  };
}

function makeSession(votesCast = 0): VoterSession {
  return {
    id: "session-1",
    weekId: "week-1",
    cookieId: "cookie-1",
    fingerprintHash: "fp-1",
    votesCast,
    lastSeenAt: NOW.toISOString(),
    createdAt: NOW.toISOString(),
  };
}

describe("ArenaService", () => {
  it("creates a submission, lets the builder edit their pending entry, and blocks a second approved entry", async () => {
    const repository = createInMemoryArenaRepository({
      profiles: [makeProfile(1)],
      weeks: [makeWeek()],
      entries: [],
      matchups: [],
      voterSessions: [],
      votes: [],
    });
    const service = createArenaService(repository, { now: () => NOW, random: () => 0 });

    const created = await service.submitEntry({
      weekSlug: "agents-in-the-arena",
      builderId: "builder-1",
      title: "Round One",
      oneLiner: "First draft",
      liveUrl: "https://round-one.example.com",
      demoAssetPath: "demo-assets/round-one.gif",
    });

    const updated = await service.submitEntry({
      weekSlug: "agents-in-the-arena",
      builderId: "builder-1",
      title: "Round One Updated",
      oneLiner: "Sharper pitch",
      liveUrl: "https://round-one-v2.example.com",
      demoAssetPath: "demo-assets/round-one-v2.gif",
    });

    await service.reviewEntry({
      adminEmail: "admin@example.com",
      entryId: created.id,
      decision: "approved",
    });

    expect(created.status).toBe("pending");
    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe("Round One Updated");

    await expect(
      service.submitEntry({
        weekSlug: "agents-in-the-arena",
        builderId: "builder-1",
        title: "Second App",
        oneLiner: "Should be rejected",
        liveUrl: "https://second-app.example.com",
        demoAssetPath: "demo-assets/second-app.gif",
      }),
    ).rejects.toThrow(/one approved entry/i);
  });

  it("approves and rejects submissions, then opens voting by generating every unique approved matchup", async () => {
    const repository = createInMemoryArenaRepository({
      profiles: [makeProfile(1), makeProfile(2), makeProfile(3)],
      weeks: [makeWeek()],
      entries: [
        makeApprovedEntry(1, { id: "entry-pending-1", status: "pending", approvedAt: null }),
        makeApprovedEntry(2, { id: "entry-pending-2", status: "pending", approvedAt: null }),
        makeApprovedEntry(3, { id: "entry-pending-3", status: "pending", approvedAt: null }),
      ],
      matchups: [],
      voterSessions: [],
      votes: [],
    });
    const service = createArenaService(repository, { now: () => NOW, random: () => 0 });

    await service.reviewEntry({
      adminEmail: "admin@example.com",
      entryId: "entry-pending-1",
      decision: "approved",
    });
    await service.reviewEntry({
      adminEmail: "admin@example.com",
      entryId: "entry-pending-2",
      decision: "approved",
    });
    await service.reviewEntry({
      adminEmail: "admin@example.com",
      entryId: "entry-pending-3",
      decision: "rejected",
    });

    const result = await service.openVoting({
      adminEmail: "admin@example.com",
      weekSlug: "agents-in-the-arena",
    });

    const week = await repository.getWeekBySlug("agents-in-the-arena");
    const matchups = await repository.listMatchupsByWeek("week-1");

    expect(result.matchupsCreated).toBe(1);
    expect(week?.status).toBe("voting_open");
    expect(matchups).toHaveLength(1);
    expect(matchups[0]).toMatchObject({
      entryAId: "entry-pending-1",
      entryBId: "entry-pending-2",
    });
  });

  it("records votes transactionally and rejects duplicate idempotency keys or repeat votes for the same matchup", async () => {
    const approvedEntries = [makeApprovedEntry(1), makeApprovedEntry(2)];
    const matchups = makeMatchups(approvedEntries);
    const repository = createInMemoryArenaRepository({
      profiles: [makeProfile(1), makeProfile(2)],
      weeks: [makeWeek("voting_open")],
      entries: approvedEntries,
      matchups,
      voterSessions: [],
      votes: [],
    });
    const service = createArenaService(repository, { now: () => NOW, random: () => 0 });

    const result = await service.castVote({
      weekSlug: "agents-in-the-arena",
      matchupId: matchups[0].id,
      winnerEntryId: "entry-1",
      loserEntryId: "entry-2",
      cookieId: "cookie-1",
      fingerprintHash: "fp-1",
      idempotencyKey: "vote-1",
    });

    expect(result.winner.eloRating).toBe(1212);
    expect(result.loser.eloRating).toBe(1188);

    await expect(
      service.castVote({
        weekSlug: "agents-in-the-arena",
        matchupId: matchups[0].id,
        winnerEntryId: "entry-1",
        loserEntryId: "entry-2",
        cookieId: "cookie-1",
        fingerprintHash: "fp-1",
        idempotencyKey: "vote-1",
      }),
    ).rejects.toThrow(/idempotency/i);

    await expect(
      service.castVote({
        weekSlug: "agents-in-the-arena",
        matchupId: matchups[0].id,
        winnerEntryId: "entry-1",
        loserEntryId: "entry-2",
        cookieId: "cookie-1",
        fingerprintHash: "fp-1",
        idempotencyKey: "vote-2",
      }),
    ).rejects.toThrow(/already voted/i);
  });

  it("enforces the short-window and daily authenticated vote limits", async () => {
    const shortWindowEntries = Array.from({ length: 9 }, (_, index) => makeApprovedEntry(index + 1));
    const shortWindowMatchups = makeMatchups(shortWindowEntries);
    const shortWindowVotes = shortWindowMatchups.slice(0, 30).map((matchup, index) =>
      makeVote(
        index + 1,
        matchup,
        matchup.entryAId,
        matchup.entryBId,
        "session-1",
        "fp-1",
        new Date(NOW.getTime() - 5 * 60 * 1_000).toISOString(),
      ),
    );
    const shortWindowRepository = createInMemoryArenaRepository({
      profiles: shortWindowEntries.map((entry, index) => makeProfile(index + 1)),
      weeks: [makeWeek("voting_open")],
      entries: shortWindowEntries,
      matchups: shortWindowMatchups,
      voterSessions: [makeSession(30)],
      votes: shortWindowVotes,
    });
    const shortWindowService = createArenaService(shortWindowRepository, {
      now: () => NOW,
      random: () => 0,
    });

    await expect(
      shortWindowService.castVote({
        weekSlug: "agents-in-the-arena",
        matchupId: shortWindowMatchups[30].id,
        winnerEntryId: shortWindowMatchups[30].entryAId,
        loserEntryId: shortWindowMatchups[30].entryBId,
        cookieId: "cookie-1",
        fingerprintHash: "fp-1",
        idempotencyKey: "short-window-limit",
      }),
    ).rejects.toThrow(/30 votes per 10 minutes/i);

    const dailyEntries = Array.from({ length: 15 }, (_, index) => makeApprovedEntry(index + 1));
    const dailyMatchups = makeMatchups(dailyEntries);
    const dailyVotes = dailyMatchups.slice(0, 100).map((matchup, index) =>
      makeVote(
        index + 1,
        matchup,
        matchup.entryAId,
        matchup.entryBId,
        "session-1",
        "fp-1",
        new Date(NOW.getTime() - 6 * 60 * 60 * 1_000).toISOString(),
      ),
    );
    const dailyRepository = createInMemoryArenaRepository({
      profiles: dailyEntries.map((entry, index) => makeProfile(index + 1)),
      weeks: [makeWeek("voting_open")],
      entries: dailyEntries,
      matchups: dailyMatchups,
      voterSessions: [makeSession(100)],
      votes: dailyVotes,
    });
    const dailyService = createArenaService(dailyRepository, { now: () => NOW, random: () => 0 });

    await expect(
      dailyService.castVote({
        weekSlug: "agents-in-the-arena",
        matchupId: dailyMatchups[100].id,
        winnerEntryId: dailyMatchups[100].entryAId,
        loserEntryId: dailyMatchups[100].entryBId,
        cookieId: "cookie-1",
        fingerprintHash: "fp-1",
        idempotencyKey: "daily-limit",
      }),
    ).rejects.toThrow(/100 votes per day/i);
  });

  it("recalculates the weekly leaderboard after votes land", async () => {
    const approvedEntries = [makeApprovedEntry(1), makeApprovedEntry(2), makeApprovedEntry(3)];
    const repository = createInMemoryArenaRepository({
      profiles: [makeProfile(1), makeProfile(2), makeProfile(3)],
      weeks: [makeWeek("voting_open")],
      entries: approvedEntries,
      matchups: makeMatchups(approvedEntries),
      voterSessions: [],
      votes: [],
    });
    const service = createArenaService(repository, { now: () => NOW, random: () => 0 });

    await service.castVote({
      weekSlug: "agents-in-the-arena",
      matchupId: "matchup-entry-1-entry-2",
      winnerEntryId: "entry-1",
      loserEntryId: "entry-2",
      cookieId: "cookie-1",
      fingerprintHash: "fp-1",
      idempotencyKey: "leaderboard-1",
    });

    await service.castVote({
      weekSlug: "agents-in-the-arena",
      matchupId: "matchup-entry-1-entry-3",
      winnerEntryId: "entry-3",
      loserEntryId: "entry-1",
      cookieId: "cookie-2",
      fingerprintHash: "fp-2",
      idempotencyKey: "leaderboard-2",
    });

    const leaderboard = await service.getLeaderboard({
      weekSlug: "agents-in-the-arena",
    });

    expect(leaderboard.map((row) => row.entrySlug)).toEqual([
      "entry-3",
      "entry-1",
      "entry-2",
    ]);
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[0].wins).toBe(1);
  });
});
