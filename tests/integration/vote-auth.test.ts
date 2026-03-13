import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getBuilderSession: vi.fn(),
  getNextMatchup: vi.fn(),
  castVote: vi.fn(),
  attachVoterCookie: vi.fn(),
  getVoterIdentity: vi.fn(),
  getCurrentWeek: vi.fn(),
  getLeaderboard: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => ({
  getBuilderSession: mocks.getBuilderSession,
}));

vi.mock("@/lib/server/voter-identity", () => ({
  attachVoterCookie: mocks.attachVoterCookie,
  getVoterIdentity: mocks.getVoterIdentity,
}));

vi.mock("@/lib/server/vote-engine", () => ({
  getVoteEngine: () => ({
    getNextMatchup: mocks.getNextMatchup,
    castVote: mocks.castVote,
  }),
}));

vi.mock("@/lib/server/runtime", () => ({
  getArenaService: () => ({
    getCurrentWeek: mocks.getCurrentWeek,
    getLeaderboard: mocks.getLeaderboard,
  }),
}));

describe("authenticated voting boundaries", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.getBuilderSession.mockResolvedValue(null);
    mocks.getVoterIdentity.mockResolvedValue({
      cookieId: "cookie-1",
      fingerprintHash: "fp-1",
    });
    mocks.getNextMatchup.mockResolvedValue({
      matchupId: "matchup-1",
      leftEntry: { id: "entry-1", title: "Entry 1" },
      rightEntry: { id: "entry-2", title: "Entry 2" },
      votesCast: 0,
      votingClosesAt: "2026-03-13T07:00:00.000Z",
    });
    mocks.castVote.mockResolvedValue({ ok: true });
    mocks.getCurrentWeek.mockResolvedValue({
      id: "week-1",
      slug: "agents-in-the-arena",
      themeTitle: "Agents in the Arena",
      themeDescription: "Theme",
      timezone: "America/Los_Angeles",
      submissionOpenAt: "2026-03-06T20:00:00.000Z",
      submissionCloseAt: "2026-03-10T07:00:00.000Z",
      votingOpenAt: "2026-03-10T16:00:00.000Z",
      votingCloseAt: "2026-03-13T07:00:00.000Z",
      status: "voting_open",
    });
    mocks.getLeaderboard.mockResolvedValue([]);
  });

  it("shows a sign-in gate on the vote page when the voter is not authenticated", async () => {
    const pageModule = await import("@/app/vote/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain("Sign in to vote");
    expect(markup).toContain("/login?next=%2Fvote");
  });

  it("returns 401 from GET /api/vote/next when the voter is not authenticated", async () => {
    const nextVoteRouteModule = await import("@/app/api/vote/next/route");
    const response = await nextVoteRouteModule.GET(
      new Request("https://hubdev.ai/api/vote/next?week=agents-in-the-arena"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/sign in/i),
    });
    expect(mocks.getNextMatchup).not.toHaveBeenCalled();
  });

  it("returns 401 from POST /api/vote when the voter is not authenticated", async () => {
    const voteRouteModule = await import("@/app/api/vote/route");
    const response = await voteRouteModule.POST(
      new Request("https://hubdev.ai/api/vote", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          weekSlug: "agents-in-the-arena",
          matchupId: "matchup-1",
          winnerEntryId: "entry-1",
          loserEntryId: "entry-2",
          idempotencyKey: "vote-1-key",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/sign in/i),
    });
    expect(mocks.castVote).not.toHaveBeenCalled();
  });
});
