import { createInMemoryArenaRepository } from "@/lib/server/in-memory-arena-repository";
import type { ArenaState } from "@/lib/server/types";

function createMockArenaState(): ArenaState {
  return {
    profiles: [
      {
        id: "builder-1",
        email: "alex.chen@example.com",
        displayName: "Alex Chen",
        username: "alexchen",
        avatarUrl: null,
        authProvider: "mock",
        foundingBuilder: true,
        createdAt: "2026-03-14T10:00:00.000Z",
      },
      {
        id: "builder-2",
        email: "maya.rodriguez@example.com",
        displayName: "Maya Rodriguez",
        username: "mayarodriguez",
        avatarUrl: null,
        authProvider: "mock",
        foundingBuilder: true,
        createdAt: "2026-03-14T10:00:00.000Z",
      },
      {
        id: "builder-3",
        email: "sam.nakamura@example.com",
        displayName: "Sam Nakamura",
        username: "samnakamura",
        avatarUrl: null,
        authProvider: "mock",
        foundingBuilder: true,
        createdAt: "2026-03-14T10:00:00.000Z",
      },
      {
        id: "builder-4",
        email: "riley.patel@example.com",
        displayName: "Riley Patel",
        username: "rileypatel",
        avatarUrl: null,
        authProvider: "mock",
        foundingBuilder: false,
        createdAt: "2026-03-14T10:00:00.000Z",
      },
      {
        id: "builder-5",
        email: "jordan.lee@example.com",
        displayName: "Jordan Lee",
        username: "jordanlee",
        avatarUrl: null,
        authProvider: "mock",
        foundingBuilder: false,
        createdAt: "2026-03-14T10:00:00.000Z",
      },
    ],
    weeks: [
      {
        id: "week-current",
        slug: "agents-that-ship",
        themeTitle: "Agents That Ship",
        themeDescription:
          "Build the most compelling AI-powered app that feels production-ready after a single session.",
        timezone: "Europe/Sofia",
        submissionOpenAt: "2026-03-14T10:00:00.000Z",
        submissionCloseAt: "2026-03-18T22:00:00.000Z",
        votingOpenAt: "2026-03-19T10:00:00.000Z",
        votingCloseAt: "2026-03-25T22:00:00.000Z",
        status: "voting_open",
      },
      {
        id: "week-past",
        slug: "hello-world",
        themeTitle: "Hello World",
        themeDescription:
          "Ship something — anything — that proves your AI workflow can go from zero to live in one sitting.",
        timezone: "Europe/Sofia",
        submissionOpenAt: "2026-03-07T10:00:00.000Z",
        submissionCloseAt: "2026-03-11T22:00:00.000Z",
        votingOpenAt: "2026-03-12T10:00:00.000Z",
        votingCloseAt: "2026-03-14T22:00:00.000Z",
        status: "locked",
      },
    ],
    entries: [
      {
        id: "entry-1",
        weekId: "week-current",
        builderId: "builder-1",
        slug: "shipfast-agent",
        title: "ShipFast Agent",
        oneLiner: "An AI co-pilot that turns a product brief into a deployed MVP in under 30 minutes.",
        liveUrl: "https://shipfast-agent.example.com",
        demoAssetPath: "mock://shipfast-agent",
        status: "approved",
        eloRating: 1243,
        wins: 28,
        losses: 21,
        appearanceCount: 49,
        rejectionNote: null,
        submittedAt: "2026-03-17T12:00:00.000Z",
        approvedAt: "2026-03-18T14:00:00.000Z",
      },
      {
        id: "entry-2",
        weekId: "week-current",
        builderId: "builder-2",
        slug: "designbot-studio",
        title: "DesignBot Studio",
        oneLiner: "Generate production-ready UI components from rough sketches using multi-modal AI.",
        liveUrl: "https://designbot-studio.example.com",
        demoAssetPath: "mock://designbot-studio",
        status: "approved",
        eloRating: 1210,
        wins: 29,
        losses: 27,
        appearanceCount: 56,
        rejectionNote: null,
        submittedAt: "2026-03-17T13:00:00.000Z",
        approvedAt: "2026-03-18T15:00:00.000Z",
      },
      {
        id: "entry-3",
        weekId: "week-current",
        builderId: "builder-3",
        slug: "data-whisperer",
        title: "Data Whisperer",
        oneLiner: "Ask questions in plain English and get instant SQL queries, charts, and insights.",
        liveUrl: "https://data-whisperer.example.com",
        demoAssetPath: "mock://data-whisperer",
        status: "approved",
        eloRating: 1201,
        wins: 21,
        losses: 30,
        appearanceCount: 51,
        rejectionNote: null,
        submittedAt: "2026-03-17T14:00:00.000Z",
        approvedAt: "2026-03-18T16:00:00.000Z",
      },
      {
        id: "entry-4",
        weekId: "week-current",
        builderId: "builder-4",
        slug: "codepilot-ai",
        title: "CodePilot AI",
        oneLiner: "Real-time code review agent that catches bugs, suggests fixes, and explains trade-offs.",
        liveUrl: "https://codepilot-ai.example.com",
        demoAssetPath: "mock://codepilot-ai",
        status: "approved",
        eloRating: 1190,
        wins: 28,
        losses: 28,
        appearanceCount: 56,
        rejectionNote: null,
        submittedAt: "2026-03-17T15:00:00.000Z",
        approvedAt: "2026-03-18T17:00:00.000Z",
      },
      {
        id: "entry-5",
        weekId: "week-current",
        builderId: "builder-5",
        slug: "bugslayer-pro",
        title: "BugSlayer Pro",
        oneLiner: "Autonomous debugging agent that reproduces, diagnoses, and patches bugs from error logs.",
        liveUrl: "https://bugslayer-pro.example.com",
        demoAssetPath: "mock://bugslayer-pro",
        status: "approved",
        eloRating: 1156,
        wins: 24,
        losses: 24,
        appearanceCount: 48,
        rejectionNote: null,
        submittedAt: "2026-03-17T16:00:00.000Z",
        approvedAt: "2026-03-18T18:00:00.000Z",
      },
      {
        id: "entry-past-1",
        weekId: "week-past",
        builderId: "builder-1",
        slug: "landing-wizard",
        title: "Landing Wizard",
        oneLiner: "Generate a complete landing page from a single sentence describing your product.",
        liveUrl: "https://landing-wizard.example.com",
        demoAssetPath: "mock://landing-wizard",
        status: "approved",
        eloRating: 1280,
        wins: 18,
        losses: 6,
        appearanceCount: 24,
        rejectionNote: null,
        submittedAt: "2026-03-10T12:00:00.000Z",
        approvedAt: "2026-03-11T14:00:00.000Z",
      },
    ],
    matchups: [
      { id: "m-1-2", weekId: "week-current", entryAId: "entry-1", entryBId: "entry-2", exposureCount: 35, voteCount: 20, createdAt: "2026-03-19T10:00:00.000Z" },
      { id: "m-1-3", weekId: "week-current", entryAId: "entry-1", entryBId: "entry-3", exposureCount: 32, voteCount: 18, createdAt: "2026-03-19T10:00:00.000Z" },
      { id: "m-1-4", weekId: "week-current", entryAId: "entry-1", entryBId: "entry-4", exposureCount: 30, voteCount: 16, createdAt: "2026-03-19T10:00:00.000Z" },
      { id: "m-1-5", weekId: "week-current", entryAId: "entry-1", entryBId: "entry-5", exposureCount: 28, voteCount: 14, createdAt: "2026-03-19T10:00:00.000Z" },
      { id: "m-2-3", weekId: "week-current", entryAId: "entry-2", entryBId: "entry-3", exposureCount: 34, voteCount: 19, createdAt: "2026-03-19T10:00:00.000Z" },
      { id: "m-2-4", weekId: "week-current", entryAId: "entry-2", entryBId: "entry-4", exposureCount: 31, voteCount: 17, createdAt: "2026-03-19T10:00:00.000Z" },
      { id: "m-2-5", weekId: "week-current", entryAId: "entry-2", entryBId: "entry-5", exposureCount: 29, voteCount: 15, createdAt: "2026-03-19T10:00:00.000Z" },
      { id: "m-3-4", weekId: "week-current", entryAId: "entry-3", entryBId: "entry-4", exposureCount: 33, voteCount: 18, createdAt: "2026-03-19T10:00:00.000Z" },
      { id: "m-3-5", weekId: "week-current", entryAId: "entry-3", entryBId: "entry-5", exposureCount: 27, voteCount: 13, createdAt: "2026-03-19T10:00:00.000Z" },
      { id: "m-4-5", weekId: "week-current", entryAId: "entry-4", entryBId: "entry-5", exposureCount: 26, voteCount: 12, createdAt: "2026-03-19T10:00:00.000Z" },
    ],
    voterSessions: [],
    votes: [],
  };
}

declare global {
  var __hubdevMockRepository:
    | ReturnType<typeof createInMemoryArenaRepository>
    | undefined;
}

export function getMockArenaRepository() {
  if (!globalThis.__hubdevMockRepository) {
    globalThis.__hubdevMockRepository = createInMemoryArenaRepository(
      createMockArenaState(),
    );
  }

  return globalThis.__hubdevMockRepository;
}

export function resetMockArenaRepository() {
  globalThis.__hubdevMockRepository = createInMemoryArenaRepository(
    createMockArenaState(),
  );
  return globalThis.__hubdevMockRepository;
}
